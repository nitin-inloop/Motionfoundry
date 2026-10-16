"use client";

import * as React from "react";
import styles from "../styles/stat-card.module.css";

export interface StatCardProps {
  /** Metric name shown at the top of the card */
  title?: string;
  /** Final value the number counts up to */
  value?: number;
  /** Text before the number (e.g. "$") */
  prefix?: string;
  /** Text after the number (e.g. "%", "ms") */
  suffix?: string;
  /** Decimal places shown */
  decimals?: number;
  /** Change versus the previous period, in percent (negative = down) */
  delta?: number;
  /** Text after the delta badge */
  deltaLabel?: string;
  /** Treat a decrease as good (e.g. churn, latency) — flips the delta colors */
  invertDelta?: boolean;
  /** Sparkline data points (oldest first) */
  data?: number[];
  /** Show the sparkline */
  showSparkline?: boolean;
  /** Sparkline / accent color */
  accentColor?: string;
  /** Count-up and draw-in duration in milliseconds (0 = instant) */
  duration?: number;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_DATA = [32, 38, 35, 44, 41, 49, 47, 55, 52, 61, 58, 68];
const W = 280;
const H = 64;

function format(n: number, decimals: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function StatCard({
  title = "Monthly revenue",
  value = 48294,
  prefix = "$",
  suffix = "",
  decimals = 0,
  delta = 12.4,
  deltaLabel = "vs last month",
  invertDelta = false,
  data = DEFAULT_DATA,
  showSparkline = true,
  accentColor = "#6366f1",
  duration = 1400,
  className = "",
  style,
}: StatCardProps) {
  const id = React.useId().replace(/:/g, "");
  const dec = Math.max(0, Math.min(4, Math.floor(decimals)));
  const [shown, setShown] = React.useState(0);
  const [reduce, setReduce] = React.useState(false);

  React.useEffect(() => {
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduce(r);
    if (r || duration <= 0) {
      setShown(value);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / duration);
      setShown(value * (1 - Math.pow(1 - t, 4)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const up = delta >= 0;
  const good = invertDelta ? !up : up;
  const pts = data.length > 1 ? data : [0, 0];
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const coords = pts.map((v, i) => [8 + (i / (pts.length - 1)) * (W - 16), H - 6 - ((v - min) / span) * (H - 12)] as const);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W - 8} ${H} L8 ${H} Z`;
  const last = coords[coords.length - 1] ?? [W, H / 2];
  const final = `${prefix}${format(value, dec)}${suffix}`;

  return (
    <section
      aria-label={title}
      className={`${styles.root} ${className}`.trim()}
      data-animate={!reduce && duration > 0 ? "" : undefined}
      style={{ "--mf-stc-accent": accentColor, "--mf-stc-dur": `${Math.max(0, duration)}ms`, ...style } as React.CSSProperties}
    >
      <div className={styles.head}>
        <span className={styles.title}>{title}</span>
        <span className={styles.badge} data-good={good ? "" : undefined}>
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
            {up ? <path d="M7 17 17 7M9 7h8v8" /> : <path d="M7 7l10 10M17 9v8H9" />}
          </svg>
          <span className={styles.srOnly}>{up ? "Up" : "Down"}</span>
          {Math.abs(delta).toFixed(1)}%
        </span>
      </div>
      <p className={styles.value}>
        <span className={styles.srOnly}>{final}</span>
        <span aria-hidden="true">
          {prefix}
          {format(shown, dec)}
          {suffix}
        </span>
      </p>
      {deltaLabel && <p className={styles.sub}>{`${up ? "+" : "−"}${Math.abs(delta).toFixed(1)}% ${deltaLabel}`}</p>}
      {showSparkline && (
        <div className={styles.sparkWrap}>
          <svg
            role="img"
            aria-label={`Trend over ${pts.length} periods, from ${format(pts[0] ?? 0, 0)} to ${format(pts[pts.length - 1] ?? 0, 0)}`}
            className={styles.spark}
            viewBox={`0 0 ${W} ${H}`}
          >
            <defs>
              <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentColor} stopOpacity="0.32" />
                <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className={styles.area} d={area} fill={`url(#${id}-fill)`} />
            <path className={styles.line} d={line} pathLength={1} fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span
            aria-hidden="true"
            className={styles.endDot}
            style={{ left: `${(last[0] / W) * 100}%`, top: `${(last[1] / H) * 100}%` } as React.CSSProperties}
          />
        </div>
      )}
    </section>
  );
}
