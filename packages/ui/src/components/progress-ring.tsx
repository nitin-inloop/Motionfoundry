"use client";

import * as React from "react";
import styles from "../styles/progress-ring.module.css";

export interface ProgressRingProps {
  /** Current progress, clamped between 0 and `max` */
  value?: number;
  /** Value that represents a full ring */
  max?: number;
  /** Outer diameter in pixels */
  size?: number;
  /** Stroke thickness in pixels */
  thickness?: number;
  /** Progress stroke color */
  color?: string;
  /** Second color for a gradient stroke (used when `gradient` is true) */
  color2?: string;
  /** Blend `color` into `color2` along the arc */
  gradient?: boolean;
  /** Track color (defaults to the theme border color) */
  trackColor?: string;
  /** Caption shown under the number */
  label?: string;
  /** Show the numeric percentage in the center */
  showValue?: boolean;
  /** Round the ends of the progress arc */
  roundedCaps?: boolean;
  /** Tween duration in milliseconds (0 = instant) */
  duration?: number;
  /** Optional custom center content (replaces the number + caption) */
  children?: React.ReactNode;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function ProgressRing({
  value = 72,
  max = 100,
  size = 168,
  thickness = 12,
  color = "#6366f1",
  color2 = "#22d3ee",
  gradient = true,
  trackColor,
  label = "Storage used",
  showValue = true,
  roundedCaps = true,
  duration = 1200,
  children,
  className = "",
  style,
}: ProgressRingProps) {
  const id = React.useId().replace(/:/g, "");
  const safeMax = max > 0 ? max : 100;
  const target = Math.min(safeMax, Math.max(0, value));
  const [shown, setShown] = React.useState(0);
  const shownRef = React.useRef(0);

  React.useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = shownRef.current;
    if (reduce || duration <= 0 || from === target) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / duration);
      const v = from + (target - from) * easeOutCubic(t);
      shownRef.current = v;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  const stroke = Math.max(1, Math.min(thickness, size / 2 - 1));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = shown / safeMax;
  const offset = c * (1 - pct);
  const percent = Math.round(pct * 100);
  const strokeColor = gradient ? `url(#${id}-g)` : color;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={Math.round(target)}
      aria-valuetext={`${Math.round((target / safeMax) * 100)}%`}
      aria-label={label || "Progress"}
      className={`${styles.root} ${className}`.trim()}
      style={{ "--mf-pr-size": `${size}px`, "--mf-pr-color": color, ...style } as React.CSSProperties}
    >
      <svg aria-hidden="true" className={styles.svg} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gradient && (
          <defs>
            <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color2} />
            </linearGradient>
          </defs>
        )}
        <circle
          className={styles.track}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          style={trackColor ? { stroke: trackColor } : undefined}
        />
        <circle
          className={styles.bar}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap={roundedCaps && pct > 0.002 ? "round" : "butt"}
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className={styles.center}>
        {children ?? (
          <>
            {showValue && (
              <span className={styles.value}>
                {percent}
                <span className={styles.unit}>%</span>
              </span>
            )}
            {label && <span className={styles.label}>{label}</span>}
          </>
        )}
      </div>
    </div>
  );
}
