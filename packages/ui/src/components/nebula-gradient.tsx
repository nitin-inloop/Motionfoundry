"use client";

import * as React from "react";
import styles from "../styles/nebula-gradient.module.css";

export interface NebulaGradientProps {
  /** Primary cloud color */
  color1?: string;
  /** Secondary cloud color */
  color2?: string;
  /** Accent color for the brightest filaments */
  color3?: string;
  /** Deep-space base color behind the clouds */
  backgroundColor?: string;
  /** Drift speed multiplier (1 = default, 0 = paused) */
  speed?: number;
  /** Cloud density / detail (0.2 = sparse wisps, 2 = thick nebula) */
  density?: number;
  /** Render a subtle field of twinkling stars */
  stars?: boolean;
  /** Overall glow brightness (0.2–2) */
  intensity?: number;
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
uniform float u_density; uniform float u_stars; uniform float u_intensity;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = m * p; a *= 0.5; } return v; }
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time * 0.05;
  vec2 p = uv * (1.4 + u_density * 0.9);
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 1.5), fbm(p + 3.0 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 2.6 * r);
  float d = smoothstep(0.42 - 0.14 * u_density, 0.98, f);
  vec3 col = mix(u_c1, u_c2, clamp(length(q) * 1.15 - 0.2, 0.0, 1.0));
  col = mix(col, u_c3, clamp(r.x * r.x * 1.8 - 0.15, 0.0, 1.0));
  vec3 neb = col * d * d * 2.2 + col * pow(d, 5.0) * 1.6 + vec3(1.0) * pow(d, 9.0) * 0.5;
  float dust = smoothstep(0.48, 0.78, fbm(p * 1.9 - r * 1.4 + t));
  neb *= (1.0 - dust * 0.6) * u_intensity;
  vec3 c = u_bg + (1.0 - exp(-neb * 1.3));
  if (u_stars > 0.5) {
    vec2 g = gl_FragCoord.xy / u_res.y * 44.0;
    vec2 id = floor(g); vec2 fp = fract(g) - 0.5;
    float h = hash(id);
    vec2 off = (vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5) * 0.6;
    float tw = 0.55 + 0.45 * sin(u_time * (1.2 + h * 2.5) + h * 40.0);
    float s = smoothstep(0.13, 0.0, length(fp - off)) * step(0.9, h) * (h - 0.88) * 9.0;
    c += vec3(0.85, 0.9, 1.0) * s * tw * (1.0 - d * 0.75);
  }
  c *= 1.0 - 0.3 * dot(uv, uv);
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

export function NebulaGradient({
  color1 = "#7c3aed",
  color2 = "#ec4899",
  color3 = "#22d3ee",
  backgroundColor = "#05040b",
  speed = 1,
  density = 1,
  stars = true,
  intensity = 1,
  height = 380,
  borderRadius = 20,
  children,
  className = "",
  style,
}: NebulaGradientProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotionPref();
  const inView = useInView(rootRef);
  const safeSpeed = Math.max(0, speed);
  const safeDensity = Math.max(0.2, Math.min(2, density));
  const safeIntensity = Math.max(0.2, Math.min(2, intensity));
  const c1 = hexRgb(color1, [0.49, 0.23, 0.93]);
  const c2 = hexRgb(color2, [0.93, 0.28, 0.6]);
  const c3 = hexRgb(color3, [0.13, 0.83, 0.93]);
  const bg = hexRgb(backgroundColor, [0.02, 0.016, 0.043]);

  const fallback = useShader(
    rootRef,
    canvasRef,
    FRAG,
    () => ({ u_c1: c1, u_c2: c2, u_c3: c3, u_bg: bg, u_density: safeDensity, u_stars: stars ? 1 : 0, u_intensity: safeIntensity }),
    !reduced && inView && safeSpeed > 0,
    safeSpeed,
    [color1, color2, color3, backgroundColor, safeDensity, stars, safeIntensity].join("|"),
    1.5,
  );

  const starField = React.useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => `radial-gradient(1px 1px at ${(rand(i) * 100).toFixed(1)}% ${(rand(i + 50) * 100).toFixed(1)}%, rgba(235,240,255,${(0.4 + rand(i + 9) * 0.6).toFixed(2)}), transparent)`).join(","),
    [],
  );

  const styleVars = {
    "--mf-nb-bg": backgroundColor,
    "--mf-nb-clouds": `radial-gradient(38% 46% at 30% 42%, ${rgba(c1, 0.75 * safeIntensity)}, transparent 70%), radial-gradient(34% 40% at 66% 58%, ${rgba(c2, 0.6 * safeIntensity)}, transparent 70%), radial-gradient(22% 26% at 52% 36%, ${rgba(c3, 0.45 * safeIntensity)}, transparent 70%)`,
    "--mf-nb-stars": starField,
    "--mf-nb-dur": `${(28 / Math.max(0.1, safeSpeed)).toFixed(1)}s`,
    height: `${height}px`,
    borderRadius: `${borderRadius}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={styleVars} className={`${styles.root} ${className}`.trim()}>
      {fallback ? (
        <div aria-hidden="true" className={`${styles.fallback} ${safeSpeed === 0 ? styles.paused : ""}`.trim()}>
          <div className={styles.clouds} />
          {stars ? <div className={styles.stars} /> : null}
        </div>
      ) : (
        <canvas ref={canvasRef} aria-hidden="true" className={styles.canvas} />
      )}
      <div className={styles.content}>
        {children ?? (
          <div className={styles.copy}>
            <h3 className={styles.title}>Nebula Gradient</h3>
            <p className={styles.subtitle}>Domain-warped star clouds drifting through deep space.</p>
          </div>
        )}
      </div>
    </div>
  );
}
