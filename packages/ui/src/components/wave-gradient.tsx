"use client";

import * as React from "react";
import styles from "../styles/wave-gradient.module.css";

export interface WaveGradientProps {
  /** First wave color */
  color1?: string;
  /** Second wave color */
  color2?: string;
  /** Third wave color */
  color3?: string;
  /** Fourth wave color */
  color4?: string;
  /** Surface color behind the waves */
  backgroundColor?: string;
  /** Undulation speed multiplier (1 = default, 0 = paused) */
  speed?: number;
  /** Wave amplitude in px (at the default 360px height) */
  amplitude?: number;
  /** Number of stacked wave layers (2–6) */
  layers?: number;
  /** Tilt of the wave field in degrees */
  angle?: number;
  /** Softening blur applied to the waves, in px */
  blur?: number;
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

export function WaveGradient({
  color1 = "#a960ee",
  color2 = "#ff333d",
  color3 = "#90e0ff",
  color4 = "#ffcb57",
  backgroundColor = "#0b0a1a",
  speed = 1,
  amplitude = 38,
  layers = 4,
  angle = -12,
  blur = 0,
  height = 360,
  borderRadius = 20,
  children,
  className = "",
  style,
}: WaveGradientProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const timeRef = React.useRef(0);
  const reduced = useReducedMotionPref();
  const inView = useInView(rootRef);
  const safeSpeed = Math.max(0, speed);
  const layerCount = Math.max(2, Math.min(6, Math.round(layers)));

  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const colors = [color1, color2, color3, color4];
    const rad = (angle * Math.PI) / 180;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      const rect = root.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };

    const render = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, w, h);
      const d = Math.hypot(w, h);
      const amp = amplitude * (h / 360);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(rad);
      const left = -d / 2;
      const right = d / 2;
      const step = Math.max(6, d / 140);
      for (let i = 0; i < layerCount; i++) {
        const k = layerCount === 1 ? 0 : i / (layerCount - 1);
        const baseY = -h * 0.2 + k * h * 0.5;
        const a = amp * (1 - k * 0.35);
        const f1 = (1.6 + i * 0.35) / d;
        const f2 = (3.1 + i * 0.5) / d;
        const ph = i * 1.7;
        const grad = ctx.createLinearGradient(left, 0, right, 0);
        grad.addColorStop(0, colors[i % 4]);
        grad.addColorStop(0.5, colors[(i + 1) % 4]);
        grad.addColorStop(1, colors[(i + 2) % 4]);
        ctx.beginPath();
        for (let x = left; x <= right + step; x += step) {
          const y =
            baseY +
            Math.sin(x * f1 * Math.PI * 2 + t * (0.55 + i * 0.12) + ph) * a * 0.65 +
            Math.sin(x * f2 * Math.PI * 2 - t * (0.4 + i * 0.09) + ph * 1.3) * a * 0.35;
          if (x === left) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        // top ridge highlight
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.lineWidth = 1.25;
        ctx.globalAlpha = 1;
        ctx.stroke();
        ctx.lineTo(right + step, d);
        ctx.lineTo(left, d);
        ctx.closePath();
        ctx.globalAlpha = 0.78 + k * 0.12;
        ctx.fillStyle = grad;
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
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
  }, [color1, color2, color3, color4, backgroundColor, amplitude, layerCount, angle, safeSpeed, reduced, inView]);

  const styleVars = {
    "--mf-wg-bg": backgroundColor,
    "--mf-wg-blur": `${Math.max(0, blur)}px`,
    height: `${height}px`,
    borderRadius: `${borderRadius}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={styleVars} className={`${styles.root} ${className}`.trim()}>
      <canvas ref={canvasRef} aria-hidden="true" className={styles.canvas} />
      <div aria-hidden="true" className={styles.shade} />
      <div className={styles.content}>
        {children ?? (
          <div className={styles.copy}>
            <h3 className={styles.title}>Wave Gradient</h3>
            <p className={styles.subtitle}>Layered bands of color rolling in slow motion.</p>
          </div>
        )}
      </div>
    </div>
  );
}
