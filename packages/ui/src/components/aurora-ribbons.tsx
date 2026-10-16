"use client";

import * as React from "react";
import styles from "../styles/aurora-ribbons.module.css";

export interface AuroraRibbonsProps {
  /** Primary ribbon color */
  color1?: string;
  /** Secondary ribbon color */
  color2?: string;
  /** Tertiary ribbon color */
  color3?: string;
  /** Night-sky color behind the ribbons */
  backgroundColor?: string;
  /** Animation speed multiplier (1 = default flow, 0 = paused) */
  speed?: number;
  /** Ribbon brightness / opacity (0–1.5) */
  intensity?: number;
  /** Blur applied to the ribbons, in px */
  blur?: number;
  /** Tilt of the ribbon field in degrees */
  angle?: number;
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

const VB_W = 1200;
const VB_H = 500;
const SEGMENTS = 48;

/** Each ribbon: base line (fraction of height), curtain height, wave frequencies, phase, flow speed, color index */
const RIBBONS = [
  { base: 0.5, tall: 190, f1: 2.1, f2: 4.7, a1: 46, a2: 16, phase: 0.0, flow: 0.32, color: 0 },
  { base: 0.6, tall: 150, f1: 1.6, f2: 5.3, a1: 38, a2: 14, phase: 1.9, flow: 0.26, color: 1 },
  { base: 0.42, tall: 120, f1: 2.7, f2: 3.9, a1: 30, a2: 18, phase: 3.4, flow: 0.38, color: 2 },
  { base: 0.66, tall: 110, f1: 1.3, f2: 6.1, a1: 26, a2: 10, phase: 4.6, flow: 0.22, color: 0 },
  { base: 0.36, tall: 90, f1: 3.1, f2: 4.2, a1: 22, a2: 12, phase: 5.8, flow: 0.42, color: 1 },
];

const rand = (n: number) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const STARS = Array.from({ length: 46 }, (_, i) => ({
  x: rand(i) * 100,
  y: rand(i + 101) * 70,
  r: 0.6 + rand(i + 203) * 1.1,
  o: 0.25 + rand(i + 307) * 0.6,
  d: 2 + rand(i + 409) * 4,
}));

function ribbonPath(index: number, t: number): string {
  const r = RIBBONS[index];
  const baseY = r.base * VB_H;
  const top: string[] = [];
  const bottom: string[] = [];
  for (let s = 0; s <= SEGMENTS; s++) {
    const u = s / SEGMENTS;
    const x = -100 + u * (VB_W + 200);
    const y =
      baseY +
      Math.sin(u * r.f1 * Math.PI + t * r.flow + r.phase) * r.a1 +
      Math.sin(u * r.f2 * Math.PI - t * r.flow * 1.6 + r.phase * 0.7) * r.a2;
    const h =
      r.tall *
      (0.55 + 0.45 * Math.sin(u * 3.3 * Math.PI + t * r.flow * 0.8 + r.phase * 1.3)) *
      (0.75 + 0.25 * Math.sin(u * 7.1 * Math.PI - t * r.flow * 1.2));
    bottom.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    top.push(`${x.toFixed(1)},${(y - h).toFixed(1)}`);
  }
  return `M${bottom.join(" L")} L${top.reverse().join(" L")} Z`;
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

export function AuroraRibbons({
  color1 = "#3dffa8",
  color2 = "#22d3ee",
  color3 = "#a855f7",
  backgroundColor = "#040714",
  speed = 1,
  intensity = 0.9,
  blur = 18,
  angle = -8,
  height = 360,
  borderRadius = 20,
  children,
  className = "",
  style,
}: AuroraRibbonsProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const pathRefs = React.useRef<Array<SVGPathElement | null>>([]);
  const timeRef = React.useRef(0);
  const reduced = useReducedMotionPref();
  const inView = useInView(rootRef);
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const colors = [color1, color2, color3];
  const safeSpeed = Math.max(0, speed);
  const running = !reduced && safeSpeed > 0 && inView;

  React.useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      timeRef.current += dt * safeSpeed;
      for (let i = 0; i < RIBBONS.length; i++) {
        const p = pathRefs.current[i];
        if (p) p.setAttribute("d", ribbonPath(i, timeRef.current));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, safeSpeed]);

  const styleVars = {
    "--mf-ar-bg": backgroundColor,
    "--mf-ar-blur": `${Math.max(0, blur)}px`,
    "--mf-ar-intensity": String(Math.max(0, Math.min(1.5, intensity))),
    "--mf-ar-angle": `${angle}deg`,
    "--mf-ar-glow": color1,
    "--mf-ar-state": running ? "running" : "paused",
    height: `${height}px`,
    borderRadius: `${borderRadius}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={styleVars} className={`${styles.root} ${className}`.trim()}>
      <div aria-hidden="true" className={styles.stars}>
        {STARS.map((s, i) => (
          <span
            key={i}
            className={styles.star}
            style={{
              left: `${s.x.toFixed(2)}%`,
              top: `${s.y.toFixed(2)}%`,
              width: `${s.r.toFixed(2)}px`,
              height: `${s.r.toFixed(2)}px`,
              opacity: Number(s.o.toFixed(2)),
              animationDuration: `${s.d.toFixed(2)}s`,
            }}
          />
        ))}
      </div>
      <div aria-hidden="true" className={styles.glow} />
      <svg
        aria-hidden="true"
        className={styles.ribbons}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          {colors.map((c, i) => (
            <linearGradient key={i} id={`${uid}-ar-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity="0" />
              <stop offset="50%" stopColor={c} stopOpacity="0.45" />
              <stop offset="88%" stopColor={c} stopOpacity="1" />
              <stop offset="100%" stopColor={c} stopOpacity="0.15" />
            </linearGradient>
          ))}
        </defs>
        {RIBBONS.map((r, i) => (
          <path
            key={i}
            ref={(el) => {
              pathRefs.current[i] = el;
            }}
            className={styles.ribbon}
            d={ribbonPath(i, 0)}
            fill={`url(#${uid}-ar-${r.color})`}
            style={{ opacity: i < 3 ? 1 : 0.6 }}
          />
        ))}
      </svg>
      <div aria-hidden="true" className={styles.horizon} />
      <div className={styles.content}>
        {children ?? (
          <div className={styles.copy}>
            <h3 className={styles.title}>Aurora Ribbons</h3>
            <p className={styles.subtitle}>Translucent curtains of light over a quiet night sky.</p>
          </div>
        )}
      </div>
    </div>
  );
}
