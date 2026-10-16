"use client";

import * as React from "react";
import styles from "../styles/grain-gradient.module.css";

export interface GrainGradientProps {
  /** First gradient stop color */
  color1?: string;
  /** Second gradient stop color */
  color2?: string;
  /** Third gradient stop color */
  color3?: string;
  /** Fourth gradient stop color */
  color4?: string;
  /** Gradient shape */
  type?: "linear" | "radial";
  /** Direction of the linear gradient in degrees (ignored for radial) */
  angle?: number;
  /** Speed at which the stops travel along the gradient (1 = default, 0 = paused) */
  speed?: number;
  /** Opacity of the film-grain overlay (0–1) */
  grainOpacity?: number;
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

/** Length of one full color cycle, as a percentage of the gradient line */
const PERIOD = 180;
/** Seconds per full cycle at speed 1 */
const CYCLE_S = 16;

function buildGradient(
  type: "linear" | "radial",
  angle: number,
  colors: string[],
  phase: number,
): string {
  const n = colors.length;
  const stops: string[] = [];
  for (let i = 0; i <= n; i++) {
    const pos = ((i / n - phase) * PERIOD).toFixed(2);
    stops.push(`${colors[i % n]} ${pos}%`);
  }
  const list = stops.join(", ");
  return type === "radial"
    ? `repeating-radial-gradient(circle at 28% 22%, ${list})`
    : `repeating-linear-gradient(${angle}deg, ${list})`;
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

export function GrainGradient({
  color1 = "#f97316",
  color2 = "#db2777",
  color3 = "#7c3aed",
  color4 = "#0ea5e9",
  type = "linear",
  angle = 135,
  speed = 1,
  grainOpacity = 0.35,
  height = 360,
  borderRadius = 20,
  children,
  className = "",
  style,
}: GrainGradientProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const layerRef = React.useRef<HTMLDivElement>(null);
  const phaseRef = React.useRef(0);
  const reduced = useReducedMotionPref();
  const inView = useInView(rootRef);
  const filterId = `mf-gg-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const safeSpeed = Math.max(0, speed);
  const running = !reduced && safeSpeed > 0 && inView;
  const colors = React.useMemo(() => [color1, color2, color3, color4], [color1, color2, color3, color4]);

  React.useEffect(() => {
    const layer = layerRef.current;
    if (!layer || !running) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      phaseRef.current = (phaseRef.current + (dt * safeSpeed) / CYCLE_S) % 1;
      acc += dt;
      // ~40fps is plenty for a slow gradient drift and halves style recalcs
      if (acc >= 0.025) {
        acc = 0;
        layer.style.backgroundImage = buildGradient(type, angle, colors, phaseRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, safeSpeed, type, angle, colors]);

  const styleVars = {
    "--mf-gg-grain": String(Math.max(0, Math.min(1, grainOpacity))),
    "--mf-gg-glow": color2,
    height: `${height}px`,
    borderRadius: `${borderRadius}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={styleVars} className={`${styles.root} ${className}`.trim()}>
      <div
        ref={layerRef}
        aria-hidden="true"
        className={styles.gradient}
        style={{ backgroundImage: buildGradient(type, angle, colors, 0) }}
      />
      <div aria-hidden="true" className={styles.depth} />
      <svg aria-hidden="true" focusable="false" className={styles.grain} preserveAspectRatio="none">
        <filter id={filterId} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="1.6" intercept="-0.25" />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} />
      </svg>
      <div className={styles.content}>
        {children ?? (
          <div className={styles.copy}>
            <h3 className={styles.title}>Grain Gradient</h3>
            <p className={styles.subtitle}>Shifting color with a tactile film-grain finish.</p>
          </div>
        )}
      </div>
    </div>
  );
}
