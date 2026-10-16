"use client";

import * as React from "react";
import styles from "../styles/spotlight-gradient.module.css";

export interface SpotlightGradientProps {
  /** Inner spotlight color */
  color1?: string;
  /** Outer spotlight halo color */
  color2?: string;
  /** Dark surface color */
  backgroundColor?: string;
  /** Spotlight radius in px */
  radius?: number;
  /** Background grid pattern */
  gridType?: "dots" | "lines" | "none";
  /** Base opacity of the grid (0–1); the grid brightens under the spotlight */
  gridOpacity?: number;
  /** Idle auto-drift speed multiplier (1 = default, 0 = paused) */
  speed?: number;
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

/** Idle path: a slow Lissajous figure around the center, in 0–1 coordinates */
function driftPoint(t: number): [number, number] {
  return [0.5 + Math.sin(t * 0.5) * 0.3 + Math.sin(t * 0.23) * 0.06, 0.5 + Math.sin(t * 0.37 + 1.2) * 0.24];
}

export function SpotlightGradient({
  color1 = "#22d3ee",
  color2 = "#8b5cf6",
  backgroundColor = "#09090f",
  radius = 320,
  gridType = "dots",
  gridOpacity = 0.14,
  speed = 1,
  height = 360,
  borderRadius = 20,
  children,
  className = "",
  style,
}: SpotlightGradientProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPref();
  const inView = useInView(rootRef);
  const safeSpeed = Math.max(0, speed);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || reduced || !inView) return;
    const start = driftPoint(0);
    const cur = { x: start[0], y: start[1] };
    const pointer = { x: 0.5, y: 0.5, active: false };
    let t = 0;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt * safeSpeed;
      let tx: number;
      let ty: number;
      if (pointer.active) {
        tx = pointer.x;
        ty = pointer.y;
      } else {
        const p = driftPoint(t);
        tx = p[0];
        ty = p[1];
      }
      const ease = 1 - Math.pow(pointer.active ? 0.0008 : 0.04, dt);
      cur.x += (tx - cur.x) * ease;
      cur.y += (ty - cur.y) * ease;
      el.style.setProperty("--mf-sg-x", `${(cur.x * 100).toFixed(2)}%`);
      el.style.setProperty("--mf-sg-y", `${(cur.y * 100).toFixed(2)}%`);
      raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) / rect.width;
      pointer.y = (e.clientY - rect.top) / rect.height;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [reduced, inView, safeSpeed]);

  const gridClass = gridType === "lines" ? styles.lines : gridType === "dots" ? styles.dots : "";
  const styleVars = {
    "--mf-sg-bg": backgroundColor,
    "--mf-sg-c1": color1,
    "--mf-sg-c2": color2,
    "--mf-sg-r": `${Math.max(40, radius)}px`,
    "--mf-sg-grid": String(Math.max(0, Math.min(1, gridOpacity))),
    height: `${height}px`,
    borderRadius: `${borderRadius}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={styleVars} className={`${styles.root} ${className}`.trim()}>
      {gridClass ? <div aria-hidden="true" className={`${styles.grid} ${gridClass}`} /> : null}
      <div aria-hidden="true" className={styles.spot} />
      {gridClass ? <div aria-hidden="true" className={`${styles.grid} ${styles.lit} ${gridClass}`} /> : null}
      <div aria-hidden="true" className={styles.vignette} />
      <div className={styles.content}>
        {children ?? (
          <div className={styles.copy}>
            <h3 className={styles.title}>Spotlight Gradient</h3>
            <p className={styles.subtitle}>Move your cursor to steer the light across the grid.</p>
          </div>
        )}
      </div>
    </div>
  );
}
