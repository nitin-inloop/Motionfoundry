"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/range-slider.module.css";

export interface RangeSliderProps {
  /** Controlled values: one number for a single thumb, two for a range */
  value?: number[];
  /** Initial values when uncontrolled (defaults to [20, 80] for a range, [50] otherwise) */
  defaultValue?: number[];
  /** Called continuously while values change */
  onValueChange?: (value: number[]) => void;
  /** Called when a drag or key interaction ends */
  onValueCommit?: (value: number[]) => void;
  /** Two thumbs (range) instead of one */
  range?: boolean;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Visible label (also the accessible name) */
  label?: string;
  /** Text before each value, e.g. "$" */
  prefix?: string;
  /** Text after each value, e.g. "%" */
  suffix?: string;
  /** When the value tooltip is shown */
  tooltip?: "always" | "active" | "never";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Fill, thumb ring and tooltip color */
  accentColor?: string;
  /** Disable the slider */
  disabled?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

export function RangeSlider({
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommit,
  range = true,
  min = 0,
  max = 1000,
  step = 10,
  label = "Price range",
  prefix = "$",
  suffix = "",
  tooltip = "active",
  size = "md",
  accentColor = "#6366f1",
  disabled = false,
  className = "",
  style,
}: RangeSliderProps) {
  const reduce = useReducedMotion();
  const lo = Math.min(min, max);
  const hi = Math.max(min, max) === lo ? lo + 1 : Math.max(min, max);
  const inc = step > 0 ? step : 1;
  const count = range ? 2 : 1;
  const snap = React.useCallback((n: number) => Math.min(hi, Math.max(lo, lo + Math.round((n - lo) / inc) * inc)), [hi, lo, inc]);
  const normalize = React.useCallback(
    (vals: number[] | undefined) => {
      const base = vals && vals.length ? vals : range ? [lo + (hi - lo) * 0.2, lo + (hi - lo) * 0.8] : [lo + (hi - lo) / 2];
      const out = (count === 2 ? [base[0], base[1] ?? base[0]] : [base[0]]).map(snap);
      return out.sort((a, b) => a - b);
    },
    [count, hi, lo, range, snap],
  );
  const [inner, setInner] = React.useState(() => normalize(defaultValue));
  const values = normalize(valueProp ?? inner);
  const valuesRef = React.useRef(values);
  valuesRef.current = values;
  const [active, setActive] = React.useState<number | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const thumbRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const labelId = React.useId();

  const pct = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const fmt = (v: number) => `${prefix}${Number(v.toFixed(6)).toLocaleString("en-US")}${suffix}`;

  const setThumb = (index: number, raw: number) => {
    const next = [...valuesRef.current];
    const lower = index === 1 ? next[0] : lo;
    const upper = index === 0 && count === 2 ? next[1] : hi;
    const v = Math.min(upper, Math.max(lower, snap(raw)));
    if (v === next[index]) return;
    next[index] = v;
    valuesRef.current = next;
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  const valueAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return lo;
    return lo + ((clientX - rect.left) / rect.width) * (hi - lo);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    const raw = valueAt(e.clientX);
    const cur = valuesRef.current;
    let index = 0;
    if (count === 2) {
      const d0 = Math.abs(raw - cur[0]);
      const d1 = Math.abs(raw - cur[1]);
      index = d0 === d1 ? (raw > cur[1] ? 1 : 0) : d1 < d0 ? 1 : 0;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(index);
    setDragging(true);
    thumbRefs.current[index]?.focus();
    setThumb(index, raw);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || active === null) return;
    setThumb(active, valueAt(e.clientX));
  };

  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);
    onValueCommit?.(valuesRef.current);
  };

  const onKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const v = valuesRef.current[index];
    const big = Math.max(inc, Math.round((hi - lo) / 10 / inc) * inc);
    const map: Record<string, number | undefined> = {
      ArrowRight: v + inc,
      ArrowUp: v + inc,
      ArrowLeft: v - inc,
      ArrowDown: v - inc,
      PageUp: v + big,
      PageDown: v - big,
      Home: lo,
      End: hi,
    };
    const next = map[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setThumb(index, next);
    onValueCommit?.(valuesRef.current);
  };

  const start = count === 2 ? pct(values[0]) : 0;
  const end = pct(values[count - 1]);
  const pop = reduce ? { duration: 0.08 } : { type: "spring" as const, stiffness: 520, damping: 30 };
  const names = count === 2 ? ["Minimum", "Maximum"] : [""];

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      data-size={size}
      data-dragging={dragging ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      style={{ "--mf-rs-accent": accentColor, ...style } as React.CSSProperties}
    >
      <div className={styles.header}>
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        <span className={styles.readout} aria-hidden="true">
          {values.map(fmt).join(" – ")}
        </span>
      </div>
      <div ref={trackRef} className={styles.track} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <div className={styles.rail} aria-hidden="true">
          <div className={styles.fill} style={{ left: `${start}%`, width: `${end - start}%` }} />
        </div>
        {values.map((v, i) => {
          const show = tooltip === "always" || (tooltip === "active" && active === i);
          return (
            <div
              key={i}
              ref={(el) => {
                thumbRefs.current[i] = el;
              }}
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-labelledby={names[i] ? undefined : labelId}
              aria-label={names[i] ? `${names[i]} ${label.toLowerCase()}` : undefined}
              aria-valuemin={i === 1 ? values[0] : lo}
              aria-valuemax={i === 0 && count === 2 ? values[1] : hi}
              aria-valuenow={v}
              aria-valuetext={fmt(v)}
              aria-orientation="horizontal"
              aria-disabled={disabled || undefined}
              className={styles.thumb}
              data-active={active === i ? "" : undefined}
              style={{ left: `${pct(v)}%`, zIndex: active === i ? 3 : 2 }}
              onKeyDown={onKeyDown(i)}
              onFocus={() => setActive(i)}
              onBlur={() => !dragging && setActive(null)}
              onPointerEnter={() => !dragging && tooltip === "active" && setActive(i)}
              onPointerLeave={() => !dragging && document.activeElement !== thumbRefs.current[i] && setActive(null)}
            >
              <AnimatePresence>
                {show && (
                  <motion.span
                    aria-hidden="true"
                    className={styles.tip}
                    initial={{ opacity: 0, y: reduce ? 0 : 6, scale: reduce ? 1 : 0.8, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                    exit={{ opacity: 0, y: reduce ? 0 : 4, scale: reduce ? 1 : 0.85, x: "-50%" }}
                    transition={pop}
                  >
                    {fmt(v)}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <div className={styles.scale} aria-hidden="true">
        <span>{fmt(lo)}</span>
        <span>{fmt(hi)}</span>
      </div>
    </div>
  );
}
