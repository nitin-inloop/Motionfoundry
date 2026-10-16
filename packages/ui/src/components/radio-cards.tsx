"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/radio-cards.module.css";

export interface RadioCardOption {
  /** Unique value of the option */
  value: string;
  /** Main label */
  label: string;
  /** Secondary line under the label */
  description?: string;
  /** Short meta text shown on the right (e.g. a price) */
  meta?: string;
  /** Disable just this option */
  disabled?: boolean;
}

export interface RadioCardsProps {
  /** Options to render as cards */
  options?: RadioCardOption[];
  /** Controlled selected value */
  value?: string;
  /** Initial selected value when uncontrolled */
  defaultValue?: string;
  /** Called with the newly selected value */
  onValueChange?: (value: string) => void;
  /** Visible group label (accessible name of the radiogroup) */
  label?: string;
  /** Number of grid columns */
  columns?: number;
  /** Card size preset */
  size?: "sm" | "md" | "lg";
  /** Accent color for the highlight border and check */
  accentColor?: string;
  /** Show option descriptions */
  showDescriptions?: boolean;
  /** Slide the highlight border between cards instead of fading it */
  slidingHighlight?: boolean;
  /** Disable the whole group */
  disabled?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_OPTIONS: RadioCardOption[] = [
  { value: "starter", label: "Starter", description: "For side projects and prototypes.", meta: "$0/mo" },
  { value: "pro", label: "Pro", description: "Unlimited projects and priority builds.", meta: "$19/mo" },
  { value: "team", label: "Team", description: "Shared workspaces, roles and SSO.", meta: "$49/mo" },
];

export function RadioCards({
  options = DEFAULT_OPTIONS,
  value: valueProp,
  defaultValue,
  onValueChange,
  label = "Choose a plan",
  columns = 3,
  size = "md",
  accentColor = "#6366f1",
  showDescriptions = true,
  slidingHighlight = true,
  disabled = false,
  className = "",
  style,
}: RadioCardsProps) {
  const reduce = useReducedMotion();
  const groupId = React.useId();
  const [inner, setInner] = React.useState<string | undefined>(defaultValue ?? options[1]?.value ?? options[0]?.value);
  const controlled = valueProp !== undefined;
  const selected = controlled ? valueProp : inner;
  const refs = React.useRef<Array<HTMLDivElement | null>>([]);

  const enabled = options.map((o) => !disabled && !o.disabled);
  const selectedIndex = options.findIndex((o) => o.value === selected);
  const firstEnabled = enabled.indexOf(true);
  const tabStop = selectedIndex >= 0 && enabled[selectedIndex] ? selectedIndex : firstEnabled;

  const select = (i: number) => {
    const opt = options[i];
    if (!opt || !enabled[i]) return;
    if (!controlled) setInner(opt.value);
    if (opt.value !== selected) onValueChange?.(opt.value);
  };

  const move = (from: number, dir: 1 | -1 | "first" | "last") => {
    const n = options.length;
    let i = dir === "first" ? -1 : dir === "last" ? n : from;
    const step = dir === "first" ? 1 : dir === "last" ? -1 : dir;
    for (let k = 0; k < n; k++) {
      i = (i + step + n) % n;
      if (enabled[i]) {
        select(i);
        refs.current[i]?.focus();
        return;
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, i: number) => {
    const keys: Record<string, 1 | -1 | "first" | "last"> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: "first", End: "last" };
    if (e.key in keys) {
      e.preventDefault();
      move(i, keys[e.key]);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      select(i);
    }
  };

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 500, damping: 38 };
  const cols = Math.max(1, Math.min(4, Math.round(columns)));

  return (
    <div
      className={`${styles.root} ${styles[size] ?? ""} ${className}`.trim()}
      style={{ "--mf-rc-accent": accentColor, "--mf-rc-cols": cols, ...style } as React.CSSProperties}
    >
      {label && (
        <div id={`${groupId}-label`} className={styles.groupLabel}>
          {label}
        </div>
      )}
      <div role="radiogroup" aria-labelledby={label ? `${groupId}-label` : undefined} aria-label={label ? undefined : "Options"} aria-disabled={disabled || undefined} className={styles.grid}>
        {options.map((opt, i) => {
          const checked = opt.value === selected;
          const descId = opt.description && showDescriptions ? `${groupId}-d${i}` : undefined;
          return (
            <div
              key={opt.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="radio"
              aria-checked={checked}
              aria-disabled={!enabled[i] || undefined}
              aria-describedby={descId}
              tabIndex={i === tabStop ? 0 : -1}
              data-state={checked ? "checked" : "unchecked"}
              className={styles.card}
              onClick={() => select(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {checked &&
                (slidingHighlight ? (
                  <motion.span aria-hidden="true" layoutId={`${groupId}-ring`} className={styles.ring} transition={spring} />
                ) : (
                  <motion.span aria-hidden="true" className={styles.ring} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0 : 0.18 }} />
                ))}
              <span className={styles.head}>
                <span className={styles.title}>{opt.label}</span>
                <span className={styles.indicator} aria-hidden="true">
                  <motion.svg viewBox="0 0 16 16" width="12" height="12" initial={false} animate={{ scale: checked ? 1 : 0.4, opacity: checked ? 1 : 0 }} transition={spring}>
                    <motion.path
                      d="M3.5 8.5l3 3 6-7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={false}
                      animate={{ pathLength: checked ? 1 : 0 }}
                      transition={reduce ? { duration: 0 } : { duration: 0.25, ease: "easeOut", delay: checked ? 0.05 : 0 }}
                    />
                  </motion.svg>
                </span>
              </span>
              {descId && (
                <span id={descId} className={styles.description}>
                  {opt.description}
                </span>
              )}
              {opt.meta && <span className={styles.meta}>{opt.meta}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
