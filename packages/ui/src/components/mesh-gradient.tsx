"use client";

import * as React from "react";
import styles from "../styles/mesh-gradient.module.css";

export interface MeshGradientProps {
  /** First blob color */
  color1?: string;
  /** Second blob color */
  color2?: string;
  /** Third blob color */
  color3?: string;
  /** Fourth blob color */
  color4?: string;
  /** Base surface color behind the blobs */
  backgroundColor?: string;
  /** Animation speed multiplier (1 = default drift, 0 = paused) */
  speed?: number;
  /** Blur radius applied to the blob layer, in px */
  blur?: number;
  /** Overlay an animated film grain texture */
  grain?: boolean;
  /** Opacity of the film grain overlay (0–1) */
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

/** Blob layout: position (%), size (% of the larger side), base loop duration (s), keyframe path index */
const BLOBS = [
  { x: 18, y: 22, size: 62, dur: 22, path: 0, color: 0 },
  { x: 78, y: 18, size: 58, dur: 27, path: 1, color: 1 },
  { x: 72, y: 82, size: 66, dur: 31, path: 2, color: 2 },
  { x: 22, y: 80, size: 56, dur: 25, path: 3, color: 3 },
  { x: 50, y: 50, size: 44, dur: 19, path: 4, color: 0 },
];

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

export function MeshGradient({
  color1 = "#ff5c9a",
  color2 = "#7c5cff",
  color3 = "#00c2ff",
  color4 = "#ffb36b",
  backgroundColor = "#0c0a1f",
  speed = 1,
  blur = 70,
  grain = true,
  grainOpacity = 0.18,
  height = 360,
  borderRadius = 20,
  children,
  className = "",
  style,
}: MeshGradientProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPref();
  const inView = useInView(rootRef);
  const colors = [color1, color2, color3, color4];
  const safeSpeed = Math.max(0, speed);
  const running = !reduced && safeSpeed > 0 && inView;

  const styleVars = {
    "--mf-mg-bg": backgroundColor,
    "--mf-mg-blur": `${Math.max(0, blur)}px`,
    "--mf-mg-grain": String(Math.min(1, Math.max(0, grainOpacity))),
    "--mf-mg-state": running ? "running" : "paused",
    height: `${height}px`,
    borderRadius: `${borderRadius}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={styleVars} className={`${styles.root} ${className}`.trim()}>
      <div aria-hidden="true" className={styles.blobs}>
        {BLOBS.map((b, i) => (
          <span
            key={i}
            className={`${styles.blob} ${styles[`path${b.path}`]}`}
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.size}%`,
              background: `radial-gradient(circle at 50% 50%, ${colors[b.color]} 0%, ${colors[b.color]} 30%, transparent 68%)`,
              animationDuration: `${(b.dur / (safeSpeed > 0 ? safeSpeed : 1)).toFixed(2)}s`,
              animationDelay: `-${(b.dur * (i * 0.17)).toFixed(2)}s`,
              opacity: i === 4 ? 0.7 : 0.9,
            }}
          />
        ))}
      </div>
      <div aria-hidden="true" className={styles.sheen} />
      {grain ? <div aria-hidden="true" className={styles.grain} /> : null}
      <div className={styles.content}>
        {children ?? (
          <div className={styles.copy}>
            <h3 className={styles.title}>Mesh Gradient</h3>
            <p className={styles.subtitle}>Soft color fields drifting on independent loops.</p>
          </div>
        )}
      </div>
    </div>
  );
}
