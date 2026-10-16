"use client";

import * as React from "react";
import styles from "../styles/ember-gradient.module.css";

export interface EmberGradientProps {
  /** Hot core color of the rising heat */
  color1?: string;
  /** Outer, cooler glow color */
  color2?: string;
  /** Color of the drifting ember particles */
  emberColor?: string;
  /** Dark base color above the heat */
  backgroundColor?: string;
  /** Animation speed multiplier (1 = default, 0 = paused) */
  speed?: number;
  /** Approximate number of embers on screen (0–200) */
  emberCount?: number;
  /** How high and bright the heat glow rises (0.2–2) */
  heat?: number;
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
uniform vec3 u_c1; uniform vec3 u_c2; uniform vec3 u_ember; uniform vec3 u_bg;
uniform float u_count; uniform float u_heat;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++){ v += a * noise(p); p = m * p; a *= 0.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / u_res.y;
  float y = gl_FragCoord.y / u_res.y;
  float aspect = u_res.x / u_res.y;
  float t = u_time;
  float n = fbm(vec2(uv.x * 2.4, y * 1.5 - t * 0.55));
  float n2 = noise(vec2(uv.x * 5.0 + t * 0.2, y * 3.0 - t * 1.1));
  float g = exp(-y * 3.1 / u_heat) * (0.5 + 0.9 * n + 0.25 * n2);
  vec3 heat = u_c2 * smoothstep(0.0, 0.95, g) * 0.95 + u_c1 * pow(g, 2.2) * 1.35 + vec3(1.0, 0.9, 0.7) * pow(g, 5.0) * 0.45;
  vec3 col = heat;
  float prob = clamp(u_count / (aspect * 286.0), 0.0, 1.0);
  for (int l = 0; l < 3; l++) {
    float fl = float(l);
    float s = 6.0 + fl * fl * 1.5 + fl * 1.5;
    vec2 p = uv * s + vec2(fl * 13.7, 0.0);
    float column = floor(p.x);
    float rise = 0.55 + 0.7 * hash(vec2(column, fl + 2.0));
    p.y -= t * rise * (1.25 - fl * 0.2);
    vec2 id = floor(p);
    float h = hash(id + fl * 31.0);
    if (h < prob) {
      vec2 fp = fract(p) - 0.5;
      vec2 off = (vec2(hash(id + 1.3), hash(id + 7.1)) - 0.5) * 0.5;
      off.x += sin(t * (1.5 + h * 2.0) + h * 40.0) * 0.14;
      float d = length(fp - off);
      float size = 0.045 + 0.04 * hash(id + 4.4);
      float flick = 0.6 + 0.4 * sin(t * (6.0 + h * 9.0) + h * 70.0);
      float life = smoothstep(1.05, 0.05, y) * flick * (1.0 - fl * 0.22);
      col += (u_ember * smoothstep(size * 2.6, 0.0, d) * 0.55 + mix(u_ember, vec3(1.0), 0.5) * smoothstep(size, 0.0, d) * 1.4) * life;
    }
  }
  vec3 c = u_bg + (1.0 - exp(-col * 1.15));
  vec2 v = gl_FragCoord.xy / u_res - 0.5;
  c *= 1.0 - 0.45 * dot(v, v);
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

const rand = (n: number) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

export function EmberGradient({
  color1 = "#ff7a1a",
  color2 = "#b3122e",
  emberColor = "#ffb347",
  backgroundColor = "#070304",
  speed = 1,
  emberCount = 70,
  heat = 1,
  height = 380,
  borderRadius = 20,
  children,
  className = "",
  style,
}: EmberGradientProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotionPref();
  const inView = useInView(rootRef);
  const safeSpeed = Math.max(0, speed);
  const safeCount = Math.max(0, Math.min(200, Math.round(emberCount)));
  const safeHeat = Math.max(0.2, Math.min(2, heat));
  const c1 = hexRgb(color1, [1, 0.48, 0.1]);
  const c2 = hexRgb(color2, [0.7, 0.07, 0.18]);
  const em = hexRgb(emberColor, [1, 0.7, 0.28]);
  const bg = hexRgb(backgroundColor, [0.027, 0.012, 0.016]);

  const fallback = useShader(
    rootRef,
    canvasRef,
    FRAG,
    () => ({ u_c1: c1, u_c2: c2, u_ember: em, u_bg: bg, u_count: safeCount, u_heat: safeHeat }),
    !reduced && inView && safeSpeed > 0,
    safeSpeed,
    [color1, color2, emberColor, backgroundColor, safeCount, safeHeat].join("|"),
  );

  const dur = 9 / Math.max(0.1, safeSpeed);
  const styleVars = {
    "--mf-em-bg": backgroundColor,
    "--mf-em-heat": `radial-gradient(${(70 + safeHeat * 30).toFixed(0)}% ${(35 + safeHeat * 30).toFixed(0)}% at 50% 100%, ${rgba(c1, 0.95)}, ${rgba(c2, 0.7)} 45%, transparent 80%)`,
    "--mf-em-color": emberColor,
    "--mf-em-dur": `${(dur * 0.5).toFixed(1)}s`,
    height: `${height}px`,
    borderRadius: `${borderRadius}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={styleVars} className={`${styles.root} ${className}`.trim()}>
      {fallback ? (
        <div aria-hidden="true" className={`${styles.fallback} ${safeSpeed === 0 ? styles.paused : ""}`.trim()}>
          <div className={styles.heat} />
          {Array.from({ length: Math.min(40, Math.ceil(safeCount / 2)) }, (_, i) => (
            <span
              key={i}
              className={styles.ember}
              style={{
                left: `${(rand(i) * 100).toFixed(2)}%`,
                width: `${(2 + rand(i + 3) * 3).toFixed(1)}px`,
                height: `${(2 + rand(i + 3) * 3).toFixed(1)}px`,
                animationDuration: `${(dur * (0.6 + rand(i + 1) * 0.8)).toFixed(2)}s`,
                animationDelay: `-${(rand(i + 2) * dur).toFixed(2)}s`,
              }}
            />
          ))}
        </div>
      ) : (
        <canvas ref={canvasRef} aria-hidden="true" className={styles.canvas} />
      )}
      <div className={styles.content}>
        {children ?? (
          <div className={styles.copy}>
            <h3 className={styles.title}>Ember Gradient</h3>
            <p className={styles.subtitle}>Heat rising from below, scattering drifting sparks.</p>
          </div>
        )}
      </div>
    </div>
  );
}
