"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/star-rating.module.css";

export interface StarRatingProps {
  /** Controlled rating */
  value?: number;
  /** Initial rating when uncontrolled */
  defaultValue?: number;
  /** Called with the newly committed rating */
  onValueChange?: (value: number) => void;
  /** Number of stars */
  count?: number;
  /** Allow half-star ratings */
  allowHalf?: boolean;
  /** Display only (no interaction) */
  readOnly?: boolean;
  /** Clicking the current rating again resets it to 0 */
  allowClear?: boolean;
  /** Star size in pixels */
  size?: number;
  /** Gap between stars in pixels */
  gap?: number;
  /** Fill color of active stars */
  activeColor?: string;
  /** Accessible name (also shown as a caption when showLabel is true) */
  label?: string;
  /** Show the label above the stars */
  showLabel?: boolean;
  /** Show the numeric value next to the stars */
  showValue?: boolean;
  /** Disable interaction */
  disabled?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const STAR = "M12 2.75l2.83 5.73 6.32.92-4.57 4.46 1.08 6.3L12 17.18l-5.66 2.98 1.08-6.3L2.85 9.4l6.32-.92L12 2.75z";
const WORDS = ["No rating", "Terrible", "Poor", "Okay", "Good", "Excellent"];

export function StarRating({
  value: valueProp,
  defaultValue = 3.5,
  onValueChange,
  count = 5,
  allowHalf = true,
  readOnly = false,
  allowClear = true,
  size = 32,
  gap = 6,
  activeColor = "#f59e0b",
  label = "Rate this template",
  showLabel = true,
  showValue = true,
  disabled = false,
  className = "",
  style,
}: StarRatingProps) {
  const reduce = useReducedMotion();
  const id = React.useId();
  const total = Math.max(1, Math.round(count));
  const stepSize = allowHalf ? 0.5 : 1;
  const snap = (v: number) => Math.min(total, Math.max(0, Math.round(v / stepSize) * stepSize));
  const [inner, setInner] = React.useState(() => snap(defaultValue));
  const value = valueProp !== undefined ? snap(valueProp) : inner;
  const [hover, setHover] = React.useState<number | null>(null);
  const [pulse, setPulse] = React.useState(0);
  const interactive = !readOnly && !disabled;
  const shown = interactive && hover !== null ? hover : value;

  const commit = (v: number) => {
    const next = snap(allowClear && v === value ? 0 : v);
    if (valueProp === undefined) setInner(next);
    if (next !== value) onValueChange?.(next);
    setPulse((p) => p + 1);
  };

  const pointValue = (e: React.PointerEvent<HTMLElement> | React.MouseEvent<HTMLElement>, i: number) => {
    if (!allowHalf) return i + 1;
    const r = e.currentTarget.getBoundingClientRect();
    return e.clientX - r.left < r.width / 2 ? i + 0.5 : i + 1;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const map: Record<string, number> = { ArrowRight: stepSize, ArrowUp: stepSize, ArrowLeft: -stepSize, ArrowDown: -stepSize, PageUp: 1, PageDown: -1 };
    let next: number | null = null;
    if (e.key in map) next = snap(value + map[e.key]);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = total;
    else if (/^[0-9]$/.test(e.key) && Number(e.key) <= total) next = Number(e.key);
    if (next === null) return;
    e.preventDefault();
    if (valueProp === undefined) setInner(next);
    if (next !== value) onValueChange?.(next);
    setPulse((p) => p + 1);
  };

  const word = total === 5 ? WORDS[Math.ceil(shown)] : "";
  const valueWord = total === 5 && value > 0 ? `, ${WORDS[Math.ceil(value)]}` : "";
  const labelId = `${id}-label`;

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      data-readonly={readOnly ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      style={{ "--mf-sr-active": activeColor, "--mf-sr-size": `${size}px`, "--mf-sr-gap": `${gap}px`, ...style } as React.CSSProperties}
    >
      {showLabel && label && (
        <span id={labelId} className={styles.label}>
          {label}
        </span>
      )}
      <div className={styles.row}>
        <div
          className={styles.stars}
          role={readOnly ? "img" : "slider"}
          aria-label={readOnly ? `${label ? `${label}: ` : ""}Rated ${value} out of ${total} stars` : showLabel && label ? undefined : label || "Rating"}
          aria-labelledby={!readOnly && showLabel && label ? labelId : undefined}
          aria-valuemin={readOnly ? undefined : 0}
          aria-valuemax={readOnly ? undefined : total}
          aria-valuenow={readOnly ? undefined : value}
          aria-valuetext={readOnly ? undefined : `${value} out of ${total} stars${valueWord}`}
          aria-disabled={disabled || undefined}
          tabIndex={interactive ? 0 : undefined}
          onKeyDown={onKeyDown}
          onPointerLeave={() => setHover(null)}
        >
          {Array.from({ length: total }, (_, i) => {
            const fill = Math.max(0, Math.min(1, shown - i));
            const hovered = hover !== null && interactive && Math.ceil(hover) === i + 1;
            return (
              <motion.span
                key={`${i}-${pulse}`}
                aria-hidden="true"
                className={styles.star}
                initial={reduce || pulse === 0 || fill === 0 ? false : { scale: 0.6 }}
                animate={{ scale: hovered && !reduce ? 1.15 : 1 }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 14, delay: pulse > 0 && !hovered ? i * 0.035 : 0 }}
                onPointerMove={(e) => interactive && setHover(pointValue(e, i))}
                onClick={(e) => interactive && commit(pointValue(e, i))}
              >
                <svg className={styles.base} viewBox="0 0 24 24" width={size} height={size}>
                  <path d={STAR} />
                </svg>
                <span className={styles.fillClip} style={{ width: `${fill * 100}%` }}>
                  <svg className={styles.fill} viewBox="0 0 24 24" width={size} height={size}>
                    <path d={STAR} />
                  </svg>
                </span>
              </motion.span>
            );
          })}
        </div>
        {showValue && (
          <span className={styles.value} aria-hidden="true">
            <span className={styles.number}>{shown.toFixed(allowHalf ? 1 : 0)}</span>
            {word && <span className={styles.word}>{word}</span>}
          </span>
        )}
      </div>
    </div>
  );
}
