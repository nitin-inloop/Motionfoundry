"use client";

import * as React from "react";
import styles from "../styles/gradient-orbs.module.css";

export interface GradientOrbsProps {
  /** First orb color */
  color1?: string;
  /** Second orb color */
  color2?: string;
  /** Third orb color */
  color3?: string;
  /** Surface color behind the orbs */
  backgroundColor?: string;
  /** Number of orbs (2–12) */
  orbCount?: number;
  /** Float speed multiplier (1 = default, 0 = paused) */
  speed?: number;
  /** Blur radius applied to the orbs, in px */
  blur?: number;
  /** Orbs drift toward the pointer with depth-based parallax */
  followPointer?: boolean;
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

const rand = (n: number) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const MAX_SHIFT_PX = 70;

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

export function GradientOrbs({
  color1 = "#fb7185",
  color2 = "#818cf8",
  color3 = "#2dd4bf",
  backgroundColor = "#07070d",
  orbCount = 6,
  speed = 1,
  blur = 28,
  followPointer = true,
  height = 360,
  borderRadius = 20,
  children,
  className = "",
  style,
}: GradientOrbsProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const orbRefs = React.useRef<Array<HTMLSpanElement | null>>([]);
  const reduced = useReducedMotionPref();
  const inView = useInView(rootRef);
  const count = Math.max(2, Math.min(12, Math.round(orbCount)));
  const safeSpeed = Math.max(0, speed);
  const running = !reduced && safeSpeed > 0 && inView;

  const orbs = React.useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const depth = 0.25 + rand(i + 11) * 0.75;
        return {
          x: 10 + rand(i + 1) * 80,
          y: 12 + rand(i + 2) * 76,
          size: 80 + depth * 150,
          depth,
          color: [color1, color2, color3][i % 3],
          dur: 9 + rand(i + 3) * 9,
          delay: rand(i + 4) * 10,
          dx: (rand(i + 5) - 0.5) * 90,
          dy: (rand(i + 6) - 0.5) * 70,
        };
      }),
    [count, color1, color2, color3],
  );

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || !followPointer || reduced) return;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let raf = 0;
    const apply = () => {
      for (let i = 0; i < orbs.length; i++) {
        const node = orbRefs.current[i];
        if (!node) continue;
        const d = orbs[i].depth;
        node.style.transform = `translate3d(${(cur.x * d * MAX_SHIFT_PX).toFixed(2)}px, ${(cur.y * d * MAX_SHIFT_PX).toFixed(2)}px, 0)`;
      }
    };
    const step = () => {
      // critically-damped-style lerp toward the pointer target
      cur.x += (target.x - cur.x) * 0.07;
      cur.y += (target.y - cur.y) * 0.07;
      apply();
      if (Math.abs(target.x - cur.x) > 0.001 || Math.abs(target.y - cur.y) > 0.001) {
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
      target.x = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
      target.y = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
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
  }, [followPointer, reduced, orbs]);

  const styleVars = {
    "--mf-go-bg": backgroundColor,
    "--mf-go-blur": `${Math.max(0, blur)}px`,
    "--mf-go-state": running ? "running" : "paused",
    height: `${height}px`,
    borderRadius: `${borderRadius}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} style={styleVars} className={`${styles.root} ${className}`.trim()}>
      <div aria-hidden="true" className={styles.field}>
        {orbs.map((o, i) => (
          <span
            key={i}
            ref={(node) => {
              orbRefs.current[i] = node;
            }}
            className={styles.anchor}
            style={{ left: `${o.x.toFixed(2)}%`, top: `${o.y.toFixed(2)}%` }}
          >
            <span
              className={styles.orb}
              style={
                {
                  width: `${o.size.toFixed(0)}px`,
                  height: `${o.size.toFixed(0)}px`,
                  background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${o.color} 55%, #ffffff) 0%, ${o.color} 28%, color-mix(in srgb, ${o.color} 70%, transparent) 50%, transparent 72%)`,
                  opacity: Number((0.45 + o.depth * 0.45).toFixed(2)),
                  filter: `blur(calc(var(--mf-go-blur, 28px) * ${(1.25 - o.depth * 0.6).toFixed(2)}))`,
                  animationDuration: `${(o.dur / (safeSpeed > 0 ? safeSpeed : 1)).toFixed(2)}s`,
                  animationDelay: `-${o.delay.toFixed(2)}s`,
                  "--mf-go-dx": `${o.dx.toFixed(1)}px`,
                  "--mf-go-dy": `${o.dy.toFixed(1)}px`,
                } as React.CSSProperties
              }
            />
          </span>
        ))}
      </div>
      <div aria-hidden="true" className={styles.vignette} />
      <div className={styles.content}>
        {children ?? (
          <div className={styles.copy}>
            <h3 className={styles.title}>Gradient Orbs</h3>
            <p className={styles.subtitle}>Glowing spheres that float and lean toward your cursor.</p>
          </div>
        )}
      </div>
    </div>
  );
}
