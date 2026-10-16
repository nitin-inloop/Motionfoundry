"use client";

import * as React from "react";
import styles from "../styles/sparkline.module.css";

export interface SparklineProps {
  /** Data points (numbers, numeric strings, or a comma separated string) */
  values?: Array<number | string> | string;
  /** Metric name shown in the card header (also the accessible name) */
  label?: string;
  /** "card" wraps the line in a KPI card with a big readout; "bare" renders only the line and a small readout chip */
  variant?: "card" | "bare";
  /** Line, dot and gradient color */
  accentColor?: string;
  /** Line interpolation */
  curve?: "smooth" | "linear";
  /** Fill the area under the line with a fading gradient */
  showArea?: boolean;
  /** Show a pulsing dot on the last point */
  showDot?: boolean;
  /** Line thickness in px */
  strokeWidth?: number;
  /** Draw-in duration in ms */
  duration?: number;
  /** Chart width in px */
  width?: number;
  /** Chart height in px */
  height?: number;
  /** Text placed before formatted values */
  valuePrefix?: string;
  /** Text placed after formatted values */
  valueSuffix?: string;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_VALUES = [42, 45, 41, 48, 52, 49, 55, 53, 58, 62, 57, 64, 61, 67, 72, 69, 75, 78, 74, 81, 86, 83, 89, 94];

function toNumbers(v: Array<number | string> | string): number[] {
  const arr = typeof v === "string" ? v.split(",") : v;
  return arr.map((x) => (typeof x === "number" ? x : parseFloat(String(x).trim()))).filter((n) => Number.isFinite(n));
}

function linePath(pts: Array<[number, number]>, smooth: boolean) {
  if (!pts.length) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i];
    if (!smooth) {
      d += `L${x},${y}`;
      continue;
    }
    const p0 = pts[i - 2] ?? pts[i - 1];
    const p1 = pts[i - 1];
    const p2 = pts[i + 1] ?? pts[i];
    const c1x = p1[0] + (x - p0[0]) / 6;
    const c1y = p1[1] + (y - p0[1]) / 6;
    const c2x = x - (p2[0] - p1[0]) / 6;
    const c2y = y - (p2[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${x},${y}`;
  }
  return d;
}

export function Sparkline({
  values = DEFAULT_VALUES,
  label = "Weekly signups",
  variant = "card",
  accentColor = "#6366f1",
  curve = "smooth",
  showArea = true,
  showDot = true,
  strokeWidth = 2,
  duration = 1200,
  width = 260,
  height = 64,
  valuePrefix = "",
  valueSuffix = "",
  className = "",
  style,
}: SparklineProps) {
  const gid = `mf-sl-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [active, setActive] = React.useState<number | null>(null);
  const nums = toNumbers(values);
  const data = nums.length > 1 ? nums : nums.length === 1 ? [nums[0], nums[0]] : [0, 0];
  const n = data.length;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = Math.max(strokeWidth, 4) + 1;
  const range = max - min || 1;
  const pts = data.map((v, i): [number, number] => [
    +(pad + (i / (n - 1)) * (width - pad * 2)).toFixed(2),
    +(pad + (1 - (v - min) / range) * (height - pad * 2)).toFixed(2),
  ]);
  const d = linePath(pts, curve === "smooth");
  const area = `${d}L${pts[n - 1][0]},${height}L${pts[0][0]},${height}Z`;
  const last = data[n - 1];
  const first = data[0];
  const shown = active !== null ? data[active] : last;
  const delta = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;
  const fmt = (v: number) => `${valuePrefix}${v.toLocaleString("en-US")}${valueSuffix}`;
  const end = pts[n - 1];
  const ap = active !== null ? pts[active] : null;

  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / Math.max(1, r.width)) * width;
    const i = Math.round(((x - pad) / Math.max(1, width - pad * 2)) * (n - 1));
    setActive(Math.max(0, Math.min(n - 1, i)));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const cur = active ?? n - 1;
    let next = -1;
    if (e.key === "ArrowRight") next = Math.min(n - 1, cur + 1);
    else if (e.key === "ArrowLeft") next = Math.max(0, cur - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else if (e.key === "Escape") return setActive(null);
    if (next < 0) return;
    e.preventDefault();
    setActive(next);
  };

  const summary = `${label}: ${n} points from ${fmt(first)} to ${fmt(last)}, low ${fmt(min)}, high ${fmt(max)}`;

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      data-variant={variant}
      style={{ "--mf-sl-accent": accentColor, "--mf-sl-dur": `${Math.max(0, duration)}ms`, ...style } as React.CSSProperties}
    >
      {variant === "card" && (
        <div className={styles.head}>
          <span className={styles.label}>{label}</span>
          <div className={styles.readoutRow}>
            <span className={styles.big}>{fmt(shown)}</span>
            {active === null ? (
              <span className={styles.delta} data-trend={delta >= 0 ? "up" : "down"}>
                {delta >= 0 ? "+" : ""}
                {delta.toFixed(1)}%
              </span>
            ) : (
              <span className={styles.point}>
                Point {active + 1} of {n}
              </span>
            )}
          </div>
        </div>
      )}
      <div
        className={styles.chart}
        tabIndex={0}
        role="img"
        aria-label={`${summary}. Use arrow keys to read values.`}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className={styles.svg}
          aria-hidden="true"
          onPointerMove={pick}
          onPointerDown={pick}
          onPointerLeave={() => setActive(null)}
        >
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          {showArea && <path className={styles.area} d={area} fill={`url(#${gid})`} />}
          <path className={styles.line} d={d} pathLength={1} strokeWidth={strokeWidth} />
          {ap && (
            <g className={styles.cursor}>
              <line x1={ap[0]} x2={ap[0]} y1={0} y2={height} className={styles.guide} />
              <circle cx={ap[0]} cy={ap[1]} r={strokeWidth + 2.5} className={styles.hoverDot} />
            </g>
          )}
          {showDot && !ap && (
            <g className={styles.endDot}>
              <circle cx={end[0]} cy={end[1]} r={strokeWidth + 5} className={styles.pulse} />
              <circle cx={end[0]} cy={end[1]} r={strokeWidth + 1.5} className={styles.dot} />
            </g>
          )}
        </svg>
        {variant === "bare" && (
          <span className={styles.chip} data-active={active !== null ? "" : undefined} aria-hidden="true">
            {fmt(shown)}
          </span>
        )}
      </div>
      <span className={styles.srOnly} aria-live="polite">
        {active !== null ? `Point ${active + 1}: ${fmt(data[active])}` : ""}
      </span>
    </div>
  );
}
