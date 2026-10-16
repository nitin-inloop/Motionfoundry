"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/segmented-control.module.css";

export interface SegmentedControlProps {
  /** Segment labels (each label is also its value) */
  options?: string[];
  /** Controlled selected value */
  value?: string;
  /** Initial selected value when uncontrolled */
  defaultValue?: string;
  /** Called with the newly selected value */
  onValueChange?: (value: string) => void;
  /** Accessible name of the control (rendered as a visible caption when showLabel is true) */
  label?: string;
  /** Show the label as a caption above the control */
  showLabel?: boolean;
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Thumb style: a raised neutral pill (iOS) or a solid accent pill */
  variant?: "neutral" | "accent";
  /** Accent color used by the accent variant and focus tint */
  accentColor?: string;
  /** Stretch to fill the container width */
  fullWidth?: boolean;
  /** Spring stiffness of the sliding thumb */
  stiffness?: number;
  /** Disable the whole control */
  disabled?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_OPTIONS = ["Daily", "Weekly", "Monthly", "Yearly"];

export function SegmentedControl({
  options = DEFAULT_OPTIONS,
  value: valueProp,
  defaultValue,
  onValueChange,
  label = "Billing period",
  showLabel = false,
  size = "md",
  variant = "neutral",
  accentColor = "#6366f1",
  fullWidth = false,
  stiffness = 520,
  disabled = false,
  className = "",
  style,
}: SegmentedControlProps) {
  const reduce = useReducedMotion();
  const id = React.useId();
  const [inner, setInner] = React.useState<string | undefined>(defaultValue ?? options[1] ?? options[0]);
  const controlled = valueProp !== undefined;
  const selected = controlled ? valueProp : inner;
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const [pressed, setPressed] = React.useState<number | null>(null);

  const selectedIndex = Math.max(0, options.indexOf(selected ?? ""));

  const select = (i: number) => {
    const v = options[i];
    if (v === undefined || disabled) return;
    if (!controlled) setInner(v);
    if (v !== selected) onValueChange?.(v);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = options.length;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    select(next);
    refs.current[next]?.focus();
  };

  const transition = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: Math.max(50, stiffness), damping: 36, mass: 0.9 };

  return (
    <div
      className={`${styles.root} ${styles[size] ?? ""} ${fullWidth ? styles.full : ""} ${className}`.trim()}
      data-variant={variant}
      style={{ "--mf-sc-accent": accentColor, ...style } as React.CSSProperties}
    >
      {showLabel && label && (
        <span id={`${id}-label`} className={styles.caption}>
          {label}
        </span>
      )}
      <div
        role="radiogroup"
        aria-labelledby={showLabel && label ? `${id}-label` : undefined}
        aria-label={showLabel && label ? undefined : label || "Options"}
        aria-disabled={disabled || undefined}
        className={styles.track}
      >
        {options.map((opt, i) => {
          const active = i === selectedIndex;
          return (
            <button
              key={`${opt}-${i}`}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              disabled={disabled}
              data-state={active ? "on" : "off"}
              className={styles.segment}
              onClick={() => select(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              onPointerDown={() => setPressed(i)}
              onPointerUp={() => setPressed(null)}
              onPointerLeave={() => setPressed(null)}
            >
              {active && (
                <motion.span
                  aria-hidden="true"
                  layoutId={`${id}-thumb`}
                  className={styles.thumb}
                  initial={false}
                  animate={{ scale: pressed === i && !reduce ? 0.95 : 1 }}
                  transition={transition}
                />
              )}
              {i > 0 && <span aria-hidden="true" className={styles.divider} data-hidden={active || i - 1 === selectedIndex ? "true" : "false"} />}
              <span className={styles.text}>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
