"use client";

import * as React from "react";
import styles from "../styles/silk-gradient.module.css";

export interface SilkGradientProps {
  /** Primary fabric color */
  color1?: string;
  /** Secondary fabric color blended across the folds */
  color2?: string;
  /** Specular sheen color on the fold crests */
  highlightColor?: string;
  /** Shadow color deep in the folds */
  backgroundColor?: string;
  /** Flow speed multiplier (1 = default, 0 = paused) */
  speed?: number;
  /** Size of the folds (higher = broader, softer drapes) */
  foldScale?: number;
  /** Specular sheen strength (0 = matte, 2 = glossy) */
  sheen?: number;
  /** Height of the background in px */
  height?: number;
  /** Corner radius in px */
  borderRadius?: number;
  /** Foreground content rendered centered on top */
  children?: React.ReactNode;
  /** Optional className merged onto the root */
  className?: string;
  /** Inline styles merged onto the root */
  style?: React.CSSProperties;
}

type RGB = [number, number, number];
type UniformMap = Record<string, number | readonly number[]>;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res; uniform float u_time;
uniform vec3 u_c1; uniform vec3 u_c2; uniform vec3 u_hl; uniform vec3 u_bg;
uniform float u_fold; uniform float u_sheen;
float H(vec2 p, float t){
  p.x += 0.42 * sin(p.y * 1.25 + t * 0.7);
  p.y += 0.3 * sin(p.x * 0.85 - t * 0.5);
  return sin(p.x * 1.7 + p.y * 0.55 + t) * 0.55
       + sin(p.x * 0.65 - p.y * 1.3 - t * 0.8) * 0.33
       + sin((p.x + p.y) * 2.5 + t * 1.25) * 0.12;
}
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time * 0.35;
  mat2 rot = mat2(0.866, -0.5, 0.5, 0.866);
  vec2 p = rot * uv * (3.2 / u_fold);
  float e = 0.012;
  float h = H(p, t);
  vec2 grad = vec2(H(p + vec2(e, 0.0), t) - h, H(p + vec2(0.0, e), t) - h) / e;
  vec3 n = normalize(vec3(-grad * 0.42, 1.0));
  vec3 L = normalize(vec3(-0.55, 0.65, 0.75));
  vec3 Hv = normalize(L + vec3(0.0, 0.0, 1.0));
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float nh = max(dot(n, Hv), 0.0);
  float spec = pow(nh, 48.0);
  float broad = pow(nh, 7.0);
  vec3 base = mix(u_c1, u_c2, smoothstep(-0.9, 0.9, h * 0.8 + uv.x * 0.7));
  float shade = smoothstep(-1.1, 0.6, h) * 0.75 + 0.25;
  vec3 col = u_bg + base * diff * diff * 1.15 * shade;
  col += u_hl * (spec * 0.85 + broad * 0.18 * shade) * u_sheen;
  col += u_hl * pow(1.0 - n.z, 2.0) * 0.08 * u_sheen;
  col *= 1.0 - 0.32 * dot(uv * vec2(0.8, 1.0), uv * vec2(0.8, 1.0));
  gl_FragColor = vec4(col, 1.0);
}`;

const VERT = "attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0.0,1.0);}";

function hexRgb(hex: string, fb: RGB): RGB {
  const m = hex.trim().replace(/^#/, "");
  const full = m.length === 3 ? m.split("").map((ch) => ch + ch).join("") : m;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return fb;
  const n = parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const rgba = (c: RGB, a: number) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;

function useReducedMotionPref() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = React.useState(true);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) setInView(entry.isIntersecting);
    }, { rootMargin: "80px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh;
  gl.deleteShader(sh);
  return null;
}

/** Full-screen-triangle WebGL renderer; returns true when the CSS fallback should be shown instead */
function useShader(
  rootRef: React.RefObject<HTMLDivElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  frag: string,
  uniforms: () => UniformMap,
  running: boolean,
  speed: number,
  paramsKey: string,
  maxDpr = 2,
) {
  const [fallback, setFallback] = React.useState(false);
  const timeRef = React.useRef(12);
  const drawRef = React.useRef<(() => void) | null>(null);
  const uniRef = React.useRef(uniforms);
  uniRef.current = uniforms;
  const speedRef = React.useRef(speed);
  speedRef.current = speed;

  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas || fallback) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
    if (!gl) { setFallback(true); return; }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
    const prog = gl.createProgram();
    const buf = gl.createBuffer();
    const dispose = () => {
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
    if (!vs || !fs || !prog || !buf) { dispose(); setFallback(true); return; }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { dispose(); setFallback(true); return; }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const locs = new Map<string, WebGLUniformLocation | null>();
    const loc = (n: string) => {
      if (!locs.has(n)) locs.set(n, gl.getUniformLocation(prog, n));
      return locs.get(n) ?? null;
    };
    const resize = () => {
      const rect = root.getBoundingClientRect();
      const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const draw = () => {
      if (gl.isContextLost()) return;
      gl.uniform2f(loc("u_res"), canvas.width, canvas.height);
      gl.uniform1f(loc("u_time"), timeRef.current);
      const u = uniRef.current();
      for (const k in u) {
        const v = u[k];
        if (typeof v === "number") gl.uniform1f(loc(k), v);
        else if (v.length === 2) gl.uniform2f(loc(k), v[0], v[1]);
        else gl.uniform3f(loc(k), v[0], v[1], v[2]);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    resize();
    draw();
    drawRef.current = draw;
    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(root);
    const onLost = (e: Event) => { e.preventDefault(); drawRef.current = null; setFallback(true); };
    canvas.addEventListener("webglcontextlost", onLost);
    return () => {
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      drawRef.current = null;
      if (!gl.isContextLost()) dispose();
    };
  }, [frag, fallback, maxDpr, rootRef, canvasRef]);

  React.useEffect(() => {
    if (!running || fallback) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      timeRef.current += dt * speedRef.current;
      drawRef.current?.();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, fallback]);

  React.useEffect(() => { drawRef.current?.(); }, [paramsKey]);

  return fallback;
}

export function SilkGradient({
  color1 = "#6d28d9",
  color2 = "#1e40af",
  highlightColor = "#f5d0fe",
  backgroundColor = "#030306",
  speed = 1,
  foldScale = 1,
  sheen = 1,
  height = 380,
  borderRadius = 20,
  children,
  className = "",
  style,
}: SilkGradientProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotionPref();
  const inView = useInView(rootRef);
  const safeSpeed = Math.max(0, speed);
  const safeFold = Math.max(0.3, Math.min(3, foldScale));
  const safeSheen = Math.max(0, Math.min(2, sheen));
  const c1 = hexRgb(color1, [0.43, 0.16, 0.85]);
  const c2 = hexRgb(color2, [0.12, 0.25, 0.69]);
  const hl = hexRgb(highlightColor, [0.96, 0.82, 1]);
  const bg = hexRgb(backgroundColor, [0.012, 0.012, 0.024]);

  const fallback = useShader(
    rootRef,
    canvasRef,
    FRAG,
    () => ({ u_c1: c1, u_c2: c2, u_hl: hl, u_bg: bg, u_fold: safeFold, u_sheen: safeSheen }),
    !reduced && inView && safeSpeed > 0,
    safeSpeed,
    [color1, color2, highlightColor, backgroundColor, safeFold, safeSheen].join("|"),
    1.5,
  );

  const band = (40 * safeFold).toFixed(0);
  const styleVars = {
    "--mf-sk-bg": backgroundColor,
    "--mf-sk-folds": `repeating-linear-gradient(115deg, ${rgba(bg, 1)} 0px, ${rgba(c1, 0.85)} ${(+band * 0.45).toFixed(0)}px, ${rgba(hl, 0.35 * safeSheen)} ${(+band * 0.55).toFixed(0)}px, ${rgba(c2, 0.8)} ${(+band * 0.7).toFixed(0)}px, ${rgba(bg, 1)} ${band}px)`,
    "--mf-sk-dur": `${(18 / Math.max(0.1, safeSpeed)).toFixed(1)}s`,
    height: `${height}px`,
    borderRadius: `${borderRadius}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={styleVars} className={`${styles.root} ${className}`.trim()}>
      {fallback ? (
        <div aria-hidden="true" className={`${styles.fallback} ${safeSpeed === 0 ? styles.paused : ""}`.trim()}>
          <div className={styles.folds} />
          <div className={styles.shade} />
        </div>
      ) : (
        <canvas ref={canvasRef} aria-hidden="true" className={styles.canvas} />
      )}
      <div className={styles.content}>
        {children ?? (
          <div className={styles.copy}>
            <h3 className={styles.title}>Silk Gradient</h3>
            <p className={styles.subtitle}>Dark satin folds catching a slow specular sheen.</p>
          </div>
        )}
      </div>
    </div>
  );
}
