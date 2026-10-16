"use client";

import * as React from "react";
import styles from "../styles/bar-chart.module.css";

export interface BarChartProps {
  /** Category labels, one per bar */
  labels?: string[];
  /** Bar values (numbers, numeric strings, or a comma separated string), aligned with `labels` */
  values?: Array<number | string> | string;
  /** Bar direction */
  orientation?: "vertical" | "horizontal";
  /** Card title (also the chart's accessible name) */
  title?: string;
  /** Secondary line under the title */
  description?: string;
  /** Bar color */
  accentColor?: string;
  /** Text placed before every formatted value */
  valuePrefix?: string;
  /** Text placed after every formatted value */
  valueSuffix?: string;
  /** Show horizontal/vertical gridlines and the value axis */
  showGrid?: boolean;
  /** Show the value label at the end of each bar */
  showValues?: boolean;
  /** Corner radius of the bar ends in px */
  barRadius?: number;
  /** Fraction of each band left empty between bars (0–0.8) */
  barGap?: number;
  /** Delay between consecutive bars growing in, in ms */
  stagger?: number;
  /** Plot height in px */
  height?: number;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
const DEFAULT_VALUES = [186, 305, 237, 273, 209, 314, 342, 298];

function toNumbers(v: Array<number | string> | string): number[] {
  const arr = typeof v === "string" ? v.split(",") : v;
  return arr.map((x) => {
    const n = typeof x === "number" ? x : parseFloat(String(x).trim());
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  });
}

function niceScale(max: number, count = 4) {
  if (max <= 0) return { top: 1, ticks: [0, 1] };
  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw) ?? raw;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= top + step / 2; t += step) ticks.push(Math.round(t * 1000) / 1000);
  return { top, ticks };
}

function barPath(h: boolean, x: number, y: number, w: number, len: number, radius: number) {
  const r = Math.max(0, Math.min(radius, w / 2, len));
  if (h) return `M${x},${y}H${x + len - r}Q${x + len},${y} ${x + len},${y + r}V${y + w - r}Q${x + len},${y + w} ${x + len - r},${y + w}H${x}Z`;
  return `M${x},${y + len}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + len}Z`;
}

export function BarChart({
  labels = DEFAULT_LABELS,
  values = DEFAULT_VALUES,
  orientation = "vertical",
  title = "Monthly revenue",
  description = "January – August 2026",
  accentColor = "#6366f1",
  valuePrefix = "$",
  valueSuffix = "k",
  showGrid = true,
  showValues = true,
  barRadius = 6,
  barGap = 0.32,
  stagger = 60,
  height = 260,
  className = "",
  style,
}: BarChartProps) {
  const id = React.useId();
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(600);
  const [active, setActive] = React.useState<number | null>(null);
  const [kbd, setKbd] = React.useState(false);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(200, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const nums = toNumbers(values);
  const n = Math.min(labels.length, nums.length);
  const data = Array.from({ length: n }, (_, i) => ({ label: labels[i], value: nums[i] }));
  const fmt = (v: number) => `${valuePrefix}${v.toLocaleString("en-US")}${valueSuffix}`;
  const horizontal = orientation === "horizontal";
  const longest = data.reduce((m, d) => Math.max(m, d.label.length), 0);
  const m = horizontal
    ? { t: 8, r: showValues ? 52 : 16, b: showGrid ? 26 : 8, l: Math.min(140, 14 + longest * 7) }
    : { t: showValues ? 22 : 10, r: 8, b: 28, l: showGrid ? 44 : 8 };
  const iw = Math.max(10, width - m.l - m.r);
  const ih = Math.max(10, height - m.t - m.b);
  const { top, ticks } = niceScale(data.reduce((mx, d) => Math.max(mx, d.value), 0));
  const band = (horizontal ? ih : iw) / Math.max(1, n);
  const gap = Math.min(0.8, Math.max(0, barGap));
  const thick = band * (1 - gap);
  const span = horizontal ? iw : ih;

  const geo = data.map((d, i) => {
    const len = (d.value / top) * span;
    const off = i * band + (band - thick) / 2;
    return horizontal
      ? { x: m.l, y: m.t + off, len, cx: m.l + len, cy: m.t + off + thick / 2 }
      : { x: m.l + off, y: m.t + ih - len, len, cx: m.l + off + thick / 2, cy: m.t + ih - len };
  });

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!n) return;
    const cur = active ?? -1;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(n - 1, cur + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(0, cur - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else if (e.key === "Escape") return setActive(null);
    if (next < 0) return;
    e.preventDefault();
    setKbd(true);
    setActive(next);
  };

  const tip = active !== null ? geo[active] : null;
  const tipData = active !== null ? data[active] : null;

  return (
    <figure
      className={`${styles.root} ${className}`.trim()}
      data-orientation={orientation}
      style={{ "--mf-bc-accent": accentColor, "--mf-bc-stagger": `${Math.max(0, stagger)}ms`, ...style } as React.CSSProperties}
    >
      {(title || description) && (
        <figcaption className={styles.head}>
          {title && <span id={`${id}-t`} className={styles.title}>{title}</span>}
          {description && <span className={styles.desc}>{description}</span>}
        </figcaption>
      )}
      <div
        ref={wrapRef}
        className={styles.plot}
        tabIndex={0}
        role="group"
        aria-label={`${title || "Bar chart"}. Use arrow keys to inspect bars.`}
        onKeyDown={onKeyDown}
        onBlur={() => kbd && setActive(null)}
        onPointerLeave={() => setActive(null)}
      >
        <svg width={width} height={height} className={styles.svg} aria-hidden="true">
          {showGrid &&
            ticks.map((t) => {
              const p = (t / top) * span;
              return horizontal ? (
                <g key={t}>
                  <line className={styles.grid} x1={m.l + p} x2={m.l + p} y1={m.t} y2={m.t + ih} />
                  <text className={styles.tick} x={m.l + p} y={height - 8} textAnchor="middle">{t.toLocaleString("en-US")}</text>
                </g>
              ) : (
                <g key={t}>
                  <line className={styles.grid} x1={m.l} x2={m.l + iw} y1={m.t + ih - p} y2={m.t + ih - p} />
                  <text className={styles.tick} x={m.l - 8} y={m.t + ih - p} textAnchor="end" dominantBaseline="middle">{t.toLocaleString("en-US")}</text>
                </g>
              );
            })}
          {horizontal ? (
            <line className={styles.axis} x1={m.l} x2={m.l} y1={m.t} y2={m.t + ih} />
          ) : (
            <line className={styles.axis} x1={m.l} x2={m.l + iw} y1={m.t + ih} y2={m.t + ih} />
          )}
          {data.map((d, i) => {
            const g = geo[i];
            return (
              <g key={`${d.label}-${i}`} style={{ "--i": i } as React.CSSProperties}>
                <rect
                  className={styles.hit}
                  x={horizontal ? m.l : m.l + i * band}
                  y={horizontal ? m.t + i * band : m.t}
                  width={horizontal ? iw : band}
                  height={horizontal ? band : ih}
                  onPointerEnter={() => {
                    setKbd(false);
                    setActive(i);
                  }}
                />
                <path
                  className={styles.bar}
                  data-dim={active !== null && active !== i ? "" : undefined}
                  d={barPath(horizontal, g.x, g.y, thick, g.len, barRadius)}
                />
                {showValues && (
                  <text
                    className={styles.value}
                    x={horizontal ? g.cx + 6 : g.cx}
                    y={horizontal ? g.cy : g.cy - 7}
                    textAnchor={horizontal ? "start" : "middle"}
                    dominantBaseline={horizontal ? "middle" : "auto"}
                  >
                    {fmt(d.value)}
                  </text>
                )}
                <text
                  className={styles.label}
                  x={horizontal ? m.l - 8 : g.cx}
                  y={horizontal ? g.cy : m.t + ih + 18}
                  textAnchor={horizontal ? "end" : "middle"}
                  dominantBaseline={horizontal ? "middle" : "auto"}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
        {tip && tipData && (
          <div
            className={styles.tooltip}
            data-side={horizontal ? "right" : "top"}
            style={{ left: tip.cx, top: tip.cy } as React.CSSProperties}
            aria-hidden="true"
          >
            <span className={styles.tipLabel}>{tipData.label}</span>
            <span className={styles.tipValue}>
              <i className={styles.swatch} />
              {fmt(tipData.value)}
            </span>
          </div>
        )}
        <span className={styles.srOnly} aria-live="polite">
          {kbd && tipData ? `${tipData.label}: ${fmt(tipData.value)}` : ""}
        </span>
      </div>
      <table className={styles.srOnly}>
        <caption>{title || "Bar chart data"}</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={`${d.label}-${i}`}>
              <th scope="row">{d.label}</th>
              <td>{fmt(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
