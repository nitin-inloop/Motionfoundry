"use client";

import * as React from "react";
import styles from "../styles/plasma-gradient.module.css";

export interface PlasmaGradientProps {
  /** First filament color */
  color1?: string;
  /** Second filament color */
  color2?: string;
  /** Third filament color */
  color3?: string;
  /** Flow speed multiplier (1 = default, 0 = paused) */
  speed?: number;
  /** Size of the plasma structures (higher = larger, calmer arcs) */
  scale?: number;
  /** Filament glow strength (0.2–3) */
  glow?: number;
  /** Edge darkening amount (0 = none, 1 = strong) */
  vignette?: number;
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
uniform vec3 u_c1; uniform vec3 u_c2; uniform vec3 u_c3;
uniform float u_scale; uniform float u_glow; uniform float u_vig;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++){ v += a * noise(p); p = m * p; a *= 0.5; } return v; }
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time * 0.3;
  vec2 p = uv * (2.6 / u_scale);
  vec2 w = vec2(fbm(p + vec2(t * 0.3, 0.0)), fbm(p + vec2(4.1, 1.7) - t * 0.25));
  vec3 col = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 o = p + vec2(fi * 1.7, fi * 2.3);
    float n = fbm(o + 1.9 * w + vec2(t * 0.35 * (1.0 + fi * 0.3), -t * 0.28));
    float d = abs(n - 0.5);
    float g = u_glow * 0.0055 / (d + 0.0035);
    vec3 c = i == 0 ? u_c1 : (i == 1 ? u_c2 : u_c3);
    col += c * g + vec3(1.0) * pow(g, 3.0) * 0.06;
  }
  float amb = fbm(p * 0.6 - w + t * 0.1);
  col += mix(u_c1, u_c2, amb) * amb * amb * 0.18;
  col = 1.0 - exp(-col * 0.9);
  float r = length(uv * vec2(0.85, 1.0));
  col *= mix(1.0, smoothstep(1.05, 0.15, r), u_vig);
  col += (hash(gl_FragCoord.xy + fract(t)) - 0.5) * 0.012;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
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

export function PlasmaGradient({
  color1 = "#a855f7",
  color2 = "#38bdf8",
  color3 = "#f472b6",
  speed = 1,
  scale = 1,
  glow = 1,
  vignette = 0.6,
  height = 380,
  borderRadius = 20,
  children,
  className = "",
  style,
}: PlasmaGradientProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotionPref();
  const inView = useInView(rootRef);
  const safeSpeed = Math.max(0, speed);
  const safeScale = Math.max(0.3, Math.min(3, scale));
  const safeGlow = Math.max(0.2, Math.min(3, glow));
  const safeVig = Math.max(0, Math.min(1, vignette));
  const c1 = hexRgb(color1, [0.66, 0.33, 0.97]);
  const c2 = hexRgb(color2, [0.22, 0.74, 0.97]);
  const c3 = hexRgb(color3, [0.96, 0.45, 0.71]);

  const fallback = useShader(
    rootRef,
    canvasRef,
    FRAG,
    () => ({ u_c1: c1, u_c2: c2, u_c3: c3, u_scale: safeScale, u_glow: safeGlow, u_vig: safeVig }),
    !reduced && inView && safeSpeed > 0,
    safeSpeed,
    [color1, color2, color3, safeScale, safeGlow, safeVig].join("|"),
    1.5,
  );

  const a = Math.min(1, 0.55 * safeGlow);
  const styleVars = {
    "--mf-pl-arcs": `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${rgba(c1, a)} 40deg, transparent 80deg, ${rgba(c2, a)} 150deg, transparent 200deg, ${rgba(c3, a)} 270deg, transparent 320deg)`,
    "--mf-pl-vig": `radial-gradient(85% 100% at 50% 50%, transparent ${(70 - safeVig * 40).toFixed(0)}%, rgba(0,0,0,${(0.2 + safeVig * 0.75).toFixed(2)}) 100%)`,
    "--mf-pl-dur": `${(14 / Math.max(0.1, safeSpeed)).toFixed(1)}s`,
    height: `${height}px`,
    borderRadius: `${borderRadius}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={styleVars} className={`${styles.root} ${className}`.trim()}>
      {fallback ? (
        <div aria-hidden="true" className={`${styles.fallback} ${safeSpeed === 0 ? styles.paused : ""}`.trim()}>
          <div className={styles.arcs} />
          <div className={`${styles.arcs} ${styles.arcsAlt}`} />
          <div className={styles.vignette} />
        </div>
      ) : (
        <canvas ref={canvasRef} aria-hidden="true" className={styles.canvas} />
      )}
      <div className={styles.content}>
        {children ?? (
          <div className={styles.copy}>
            <h3 className={styles.title}>Plasma Gradient</h3>
            <p className={styles.subtitle}>Electric filaments arcing through a dark charged field.</p>
          </div>
        )}
      </div>
    </div>
  );
}
