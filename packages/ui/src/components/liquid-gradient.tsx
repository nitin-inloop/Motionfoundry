"use client";

import * as React from "react";
import styles from "../styles/liquid-gradient.module.css";

export interface LiquidGradientProps {
  /** First fluid color */
  color1?: string;
  /** Second fluid color */
  color2?: string;
  /** Third fluid color */
  color3?: string;
  /** Fourth fluid color */
  color4?: string;
  /** Flow speed multiplier (1 = default, 0 = paused) */
  speed?: number;
  /** Size of the fluid features (higher = larger, calmer pools) */
  scale?: number;
  /** Edge softness between colors (0 = sharp cells, 1 = fully blended) */
  softness?: number;
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

/** Two attractors per color, each on its own Lissajous loop */
const BLOBS = [
  { c: 0, ax: 0.32, ay: 0.3, fx: 0.21, fy: 0.17, px: 0.0, py: 1.2 },
  { c: 1, ax: 0.36, ay: 0.32, fx: 0.15, fy: 0.23, px: 2.1, py: 0.4 },
  { c: 2, ax: 0.3, ay: 0.36, fx: 0.19, fy: 0.13, px: 4.0, py: 2.9 },
  { c: 3, ax: 0.34, ay: 0.28, fx: 0.12, fy: 0.2, px: 5.3, py: 4.4 },
  { c: 0, ax: 0.28, ay: 0.34, fx: 0.17, fy: 0.11, px: 3.3, py: 5.6 },
  { c: 1, ax: 0.38, ay: 0.3, fx: 0.11, fy: 0.19, px: 1.0, py: 3.7 },
  { c: 2, ax: 0.26, ay: 0.38, fx: 0.23, fy: 0.15, px: 5.9, py: 0.9 },
  { c: 3, ax: 0.36, ay: 0.26, fx: 0.14, fy: 0.24, px: 2.7, py: 2.2 },
];

function hexToRgb(hex: string, fallback: RGB): RGB {
  const m = hex.trim().replace(/^#/, "");
  const full = m.length === 3 ? m.split("").map((ch) => ch + ch).join("") : m;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return fallback;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

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

export function LiquidGradient({
  color1 = "#ff4d6d",
  color2 = "#ffb703",
  color3 = "#3a86ff",
  color4 = "#8338ec",
  speed = 1,
  scale = 1,
  softness = 0.6,
  height = 360,
  borderRadius = 20,
  children,
  className = "",
  style,
}: LiquidGradientProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const timeRef = React.useRef(0);
  const reduced = useReducedMotionPref();
  const inView = useInView(rootRef);
  const safeSpeed = Math.max(0, speed);
  const safeScale = Math.max(0.3, Math.min(3, scale));
  const safeSoft = Math.max(0, Math.min(1, softness));

  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const buffer = document.createElement("canvas");
    const bctx = buffer.getContext("2d");
    if (!bctx) return;

    const palette: RGB[] = [
      hexToRgb(color1, [255, 77, 109]),
      hexToRgb(color2, [255, 183, 3]),
      hexToRgb(color3, [58, 134, 255]),
      hexToRgb(color4, [131, 56, 236]),
    ];
    // softness maps to the inverse-distance exponent: low exponent = wide blends, high = crisp cells
    const power = 4.2 - safeSoft * 3;
    const warp = 0.09 / safeScale;
    const freq = 3.2 / safeScale;

    let cssW = 0;
    let cssH = 0;
    let bw = 0;
    let bh = 0;
    let image: ImageData | null = null;

    const resize = () => {
      const rect = root.getBoundingClientRect();
      // the canvas bleeds 12px past each edge to hide the blur fringe
      cssW = Math.max(1, rect.width + 24);
      cssH = Math.max(1, rect.height + 24);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      // low-resolution field (~1 sample per 7 css px), upscaled with smoothing for a liquid look
      bw = Math.max(16, Math.round(cssW / 7));
      bh = Math.max(10, Math.round(cssH / 7));
      buffer.width = bw;
      buffer.height = bh;
      image = bctx.createImageData(bw, bh);
    };

    const render = (t: number) => {
      if (!image) return;
      const data = image.data;
      const aspect = cssW / cssH;
      const pos = BLOBS.map((b) => [
        0.5 + Math.sin(t * b.fx + b.px) * b.ax * Math.max(1, aspect * 0.8),
        0.5 + Math.cos(t * b.fy + b.py) * b.ay,
      ]);
      let o = 0;
      for (let y = 0; y < bh; y++) {
        const v = y / (bh - 1);
        for (let x = 0; x < bw; x++) {
          const u = (x / (bw - 1)) * aspect;
          // domain warp for the liquid swirl
          const wu = u + Math.sin(v * freq + t * 0.6) * warp + Math.sin((u + v) * freq * 0.7 - t * 0.4) * warp * 0.6;
          const wv = v + Math.cos(u * freq * 0.9 - t * 0.5) * warp + Math.cos((u - v) * freq * 0.6 + t * 0.3) * warp * 0.6;
          let r = 0;
          let g = 0;
          let bl = 0;
          let wsum = 0;
          for (let i = 0; i < BLOBS.length; i++) {
            const dx = wu - pos[i][0];
            const dy = wv - pos[i][1];
            const w = 1 / Math.pow(dx * dx + dy * dy + 0.004, power * 0.5);
            const c = palette[BLOBS[i].c];
            r += c[0] * w;
            g += c[1] * w;
            bl += c[2] * w;
            wsum += w;
          }
          data[o] = r / wsum;
          data[o + 1] = g / wsum;
          data[o + 2] = bl / wsum;
          data[o + 3] = 255;
          o += 4;
        }
      }
      bctx.putImageData(image, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(buffer, 0, 0, canvas.width, canvas.height);
    };

    resize();
    render(timeRef.current);

    const ro = new ResizeObserver(() => {
      resize();
      render(timeRef.current);
    });
    ro.observe(root);

    let raf = 0;
    if (!reduced && safeSpeed > 0 && inView) {
      let last = performance.now();
      const tick = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        timeRef.current += dt * safeSpeed;
        render(timeRef.current);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [color1, color2, color3, color4, safeSpeed, safeScale, safeSoft, reduced, inView]);

  const styleVars = {
    "--mf-lg-soft": `${(safeSoft * 10).toFixed(1)}px`,
    "--mf-lg-fallback": `linear-gradient(120deg, ${color1}, ${color2}, ${color3}, ${color4})`,
    height: `${height}px`,
    borderRadius: `${borderRadius}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={styleVars} className={`${styles.root} ${className}`.trim()}>
      <canvas ref={canvasRef} aria-hidden="true" className={styles.canvas} />
      <div aria-hidden="true" className={styles.sheen} />
      <div className={styles.content}>
        {children ?? (
          <div className={styles.copy}>
            <h3 className={styles.title}>Liquid Gradient</h3>
            <p className={styles.subtitle}>A warped color field that pours and pools in real time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
