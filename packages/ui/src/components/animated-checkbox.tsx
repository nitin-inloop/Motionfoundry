"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/animated-checkbox.module.css";

export interface AnimatedCheckboxProps {
  /** Controlled checked state */
  checked?: boolean;
  /** Initial state when uncontrolled */
  defaultChecked?: boolean;
  /** Called with the next state when toggled */
  onCheckedChange?: (checked: boolean) => void;
  /** Visible label (also the accessible name) */
  label?: string;
  /** Draw a strike-through line across the label when checked */
  strikeThrough?: boolean;
  /** Box fill color when checked */
  accentColor?: string;
  /** Disable interaction */
  disabled?: boolean;
  /** Optional className */
  className?: string;
}

export function AnimatedCheckbox({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label = "Ship the release notes",
  strikeThrough = true,
  accentColor = "#38bdf8",
  disabled = false,
  className = "",
}: AnimatedCheckboxProps) {
  const prefersReducedMotion = useReducedMotion();
  const [inner, setInner] = React.useState(defaultChecked);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : inner;

  const toggle = () => {
    if (disabled) return;
    const next = !on;
    if (!isControlled) setInner(next);
    onCheckedChange?.(next);
  };

  const ease = [0.65, 0, 0.35, 1] as const;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={label ? undefined : "Checkbox"}
      disabled={disabled}
      onClick={toggle}
      data-state={on ? "checked" : "unchecked"}
      style={{ "--mf-ac-accent": accentColor } as React.CSSProperties}
      className={`${styles.root} ${className}`.trim()}
    >
      <motion.span
        aria-hidden="true"
        className={styles.box}
        initial={false}
        animate={prefersReducedMotion ? { scale: 1 } : { scale: on ? [1, 0.82, 1.06, 1] : 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
      >
        <svg viewBox="0 0 24 24" className={styles.icon}>
          <motion.path
            d="M5 12.5 L10 17.5 L19 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
            transition={{
              pathLength: { duration: prefersReducedMotion ? 0 : 0.3, ease, delay: on && !prefersReducedMotion ? 0.06 : 0 },
              opacity: { duration: prefersReducedMotion ? 0 : 0.05, delay: on ? 0 : 0.25 },
            }}
          />
        </svg>
      </motion.span>
      {label ? (
        <span className={styles.label}>
          {label}
          {strikeThrough ? (
            <motion.span
              aria-hidden="true"
              className={styles.strike}
              initial={false}
              animate={{ scaleX: on ? 1 : 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease, delay: on && !prefersReducedMotion ? 0.15 : 0 }}
            />
          ) : null}
        </span>
      ) : null}
    </button>
  );
}
