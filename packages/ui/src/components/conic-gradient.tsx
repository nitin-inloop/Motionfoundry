"use client";

import * as React from "react";
import styles from "../styles/conic-gradient.module.css";

export interface ConicGradientProps {
  /** First conic stop color */
  color1?: string;
  /** Second conic stop color */
  color2?: string;
  /** Third conic stop color */
  color3?: string;
  /** Fourth conic stop color */
  color4?: string;
  /** Surface color behind the glow */
  backgroundColor?: string;
  /** Rotation speed multiplier (1 = one turn per 14s, 0 = paused) */
  speed?: number;
  /** Blur radius of the outer glow, in px */
  blur?: number;
  /** Diameter of the conic core as a percentage of the component width */
  spread?: number;
  /** Tilt the gradient origin slightly toward the pointer */
  interactive?: boolean;
  /** Show the crisp counter-rotating inner ring */
  ring?: boolean;
  /** Overlay a fine static noise texture */
  noise?: boolean;
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

const BASE_TURN_S = 14;
const MAX_TILT_PX = 36;

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

export function ConicGradient({
  color1 = "#ff3d7f",
  color2 = "#ffb020",
  color3 = "#18d6a3",
  color4 = "#5b6cff",
  backgroundColor = "#07070b",
  speed = 1,
  blur = 60,
  spread = 55,
  interactive = true,
  ring = true,
  noise = true,
  height = 360,
  borderRadius = 20,
  children,
  className = "",
  style,
}: ConicGradientProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPref();
  const inView = useInView(rootRef);
  const safeSpeed = Math.max(0, speed);
  const running = !reduced && safeSpeed > 0 && inView;

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || !interactive || reduced) return;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let raf = 0;
    const step = () => {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      el.style.setProperty("--mf-cg-tx", `${cur.x.toFixed(2)}px`);
      el.style.setProperty("--mf-cg-ty", `${cur.y.toFixed(2)}px`);
      if (Math.abs(target.x - cur.x) > 0.05 || Math.abs(target.y - cur.y) > 0.05) {
        raf = requestAnimationFrame(step);
      } else {
        raf = 0;
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      target.x = Math.max(-1, Math.min(1, nx)) * MAX_TILT_PX;
      target.y = Math.max(-1, Math.min(1, ny)) * MAX_TILT_PX;
      kick();
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      kick();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [interactive, reduced]);

  const conic = `conic-gradient(from 0deg, ${color1}, ${color2}, ${color3}, ${color4}, ${color1})`;
  const styleVars = {
    "--mf-cg-bg": backgroundColor,
    "--mf-cg-blur": `${Math.max(0, blur)}px`,
    "--mf-cg-size": `${Math.max(5, spread)}%`,
    "--mf-cg-conic": conic,
    "--mf-cg-dur": `${(BASE_TURN_S / (safeSpeed > 0 ? safeSpeed : 1)).toFixed(2)}s`,
    "--mf-cg-state": running ? "running" : "paused",
    height: `${height}px`,
    borderRadius: `${borderRadius}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={styleVars} className={`${styles.root} ${className}`.trim()}>
      <div aria-hidden="true" className={styles.stage}>
        <div className={styles.glow} />
        <div className={styles.core} />
        {ring ? <div className={styles.ring} /> : null}
        <div className={styles.center} />
      </div>
      {noise ? <div aria-hidden="true" className={styles.noise} /> : null}
      <div aria-hidden="true" className={styles.vignette} />
      <div className={styles.content}>
        {children ?? (
          <div className={styles.copy}>
            <h3 className={styles.title}>Conic Gradient</h3>
            <p className={styles.subtitle}>A slow-turning spectrum core with a soft halo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
