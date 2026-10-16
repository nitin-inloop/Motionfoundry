"use client";

import * as React from "react";
import styles from "../styles/eclipse-gradient.module.css";

export interface EclipseGradientProps {
  /** Hot inner corona color */
  color1?: string;
  /** Outer corona / halo color */
  color2?: string;
  /** Chromatic rim color around the disk */
  color3?: string;
  /** Deep space color behind the eclipse */
  backgroundColor?: string;
  /** Corona animation speed (1 = default, 0 = paused) */
  speed?: number;
  /** Size of the eclipsed disk (0.5–1.6) */
  ringSize?: number;
  /** Length and brightness of the corona rays (0–2) */
  rayIntensity?: number;
  /** Tilt the eclipse toward the pointer */
  interactive?: boolean;
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
uniform vec3 u_c1; uniform vec3 u_c2; uniform vec3 u_c3; uniform vec3 u_bg;
uniform float u_ring; uniform float u_rays; uniform vec2 u_ptr;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++){ v += a * noise(p); p = m * p; a *= 0.5; } return v; }
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time;
  vec2 ctr = u_ptr * vec2(0.05, 0.04);
  float R = 0.26 * u_ring;
  vec2 d = uv - ctr; float r = length(d);
  vec2 dc = uv - ctr * 0.4; float rc = length(dc); vec2 dir = dc / max(rc, 0.0001);
  float ca = cos(t * 0.03), sa = sin(t * 0.03);
  vec2 rd = mat2(ca, -sa, sa, ca) * dir;
  float rays = fbm(dir * 2.2 + vec2(t * 0.06, -t * 0.04)) * 0.6 + noise(rd * 7.0 + t * 0.15) * 0.3 + noise(rd * 17.0 - t * 0.1) * 0.15;
  float x = max(rc - R, 0.0);
  float corona = exp(-x * 4.5 / (0.3 + rays * rays * 2.4 * u_rays)) * (0.5 + rays * 0.9 * u_rays);
  float inner = exp(-x * 26.0);
  vec3 col = mix(u_c2, u_c1, clamp(inner + exp(-x * 9.0) * 0.5, 0.0, 1.0)) * corona * 1.3 + u_c1 * inner * 1.1;
  col += u_c2 * exp(-rc * 3.0) * 0.16;
  col = 1.0 - exp(-col * 1.1);
  float disk = smoothstep(R + 0.0015, R - 0.0015, r);
  vec3 diskCol = u_bg * 0.5 + u_c3 * 0.05 * smoothstep(R * 0.55, R, r);
  vec3 c = mix(u_bg + col, diskCol, disk);
  float w = 0.0035 + 0.002 * u_ring;
  float dl = 0.0055;
  vec3 e3 = (vec3(r) - vec3(R + dl, R, R - dl * 0.6)) / w;
  vec3 edge = exp(-e3 * e3);
  float lp = length(u_ptr);
  float bias = 0.75 + 0.6 * max(dot(d / max(r, 0.0001), u_ptr / max(lp, 0.0001)), 0.0) * lp;
  c += edge * mix(vec3(1.0), u_c3, 0.55) * 1.5 * bias;
  c *= 1.0 - 0.25 * dot(uv, uv);
  gl_FragColor = vec4(c, 1.0);
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

export function EclipseGradient({
  color1 = "#a8aeff",
  color2 = "#caabd3",
  color3 = "#0d3040",
  backgroundColor = "#020205",
  speed = 3,
  ringSize = 0.5,
  rayIntensity = 0,
  interactive = true,
  height = 380,
  borderRadius = 20,
  children,
  className = "",
  style,
}: EclipseGradientProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const target = React.useRef({ x: 0, y: 0 });
  const ptr = React.useRef({ x: 0, y: 0 });
  const reduced = useReducedMotionPref();
  const inView = useInView(rootRef);
  const safeSpeed = Math.max(0, speed);
  const safeRing = Math.max(0.5, Math.min(1.6, ringSize));
  const safeRays = Math.max(0, Math.min(2, rayIntensity));
  const tilt = interactive && !reduced;
  const c1 = hexRgb(color1, [1, 0.85, 0.66]);
  const c2 = hexRgb(color2, [1, 0.42, 0.24]);
  const c3 = hexRgb(color3, [0.49, 0.83, 0.99]);
  const bg = hexRgb(backgroundColor, [0.008, 0.008, 0.02]);

  const fallback = useShader(
    rootRef,
    canvasRef,
    FRAG,
    () => {
      const p = ptr.current;
      p.x += (target.current.x - p.x) * 0.07;
      p.y += (target.current.y - p.y) * 0.07;
      return { u_c1: c1, u_c2: c2, u_c3: c3, u_bg: bg, u_ring: safeRing, u_rays: safeRays, u_ptr: [p.x, p.y] };
    },
    !reduced && inView && (safeSpeed > 0 || tilt),
    safeSpeed,
    [color1, color2, color3, backgroundColor, safeRing, safeRays].join("|"),
    2,
  );

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || !tilt) return;
    const move = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      target.current = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -(((e.clientY - rect.top) / rect.height) * 2 - 1),
      };
      root.style.setProperty("--mf-ec-tx", `${(target.current.x * 10).toFixed(1)}px`);
      root.style.setProperty("--mf-ec-ty", `${(-target.current.y * 8).toFixed(1)}px`);
    };
    const leave = () => {
      target.current = { x: 0, y: 0 };
      root.style.setProperty("--mf-ec-tx", "0px");
      root.style.setProperty("--mf-ec-ty", "0px");
    };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    return () => {
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
      target.current = { x: 0, y: 0 };
    };
  }, [tilt]);

  const styleVars = {
    "--mf-ec-bg": backgroundColor,
    "--mf-ec-c1": color1,
    "--mf-ec-c2": color2,
    "--mf-ec-c3": color3,
    "--mf-ec-size": `${(52 * safeRing).toFixed(1)}%`,
    "--mf-ec-corona": `conic-gradient(from 0deg, ${rgba(c2, 0.9)}, ${rgba(c1, 0.35 + 0.3 * safeRays)}, ${rgba(c2, 0.5)}, ${rgba(c1, 0.8)}, ${rgba(c2, 0.4)}, ${rgba(c1, 0.6)}, ${rgba(c2, 0.9)})`,
    "--mf-ec-op": (0.35 + safeRays * 0.5).toFixed(2),
    "--mf-ec-dur": `${(40 / Math.max(0.1, safeSpeed)).toFixed(1)}s`,
    height: `${height}px`,
    borderRadius: `${borderRadius}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={styleVars} className={`${styles.root} ${className}`.trim()}>
      {fallback ? (
        <div aria-hidden="true" className={`${styles.fallback} ${safeSpeed === 0 ? styles.paused : ""}`.trim()}>
          <div className={styles.corona} />
          <div className={styles.disk} />
        </div>
      ) : (
        <canvas ref={canvasRef} aria-hidden="true" className={styles.canvas} />
      )}
      <div className={styles.content}>
        {children ?? (
          <div className={styles.copy}>
            <h3 className={styles.title}>Eclipse Gradient</h3>
            <p className={styles.subtitle}>A living corona blazing around a perfect black disk.</p>
          </div>
        )}
      </div>
    </div>
  );
}
