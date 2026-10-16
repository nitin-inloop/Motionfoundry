"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/toggle-switch.module.css";

export interface ToggleSwitchProps {
  /** Controlled on/off state */
  checked?: boolean;
  /** Initial state when uncontrolled */
  defaultChecked?: boolean;
  /** Called with the next state when toggled */
  onCheckedChange?: (checked: boolean) => void;
  /** Visible label (also the accessible name) */
  label?: string;
  /** Switch size */
  size?: "sm" | "md" | "lg";
  /** Track color when on */
  accentColor?: string;
  /** Disable interaction */
  disabled?: boolean;
  /** Optional className */
  className?: string;
}

const SIZES = {
  sm: { w: 36, h: 20 },
  md: { w: 48, h: 26 },
  lg: { w: 60, h: 32 },
} as const;

const PAD = 3;

export function ToggleSwitch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label = "Reduce motion",
  size = "md",
  accentColor = "#38bdf8",
  disabled = false,
  className = "",
}: ToggleSwitchProps) {
  const prefersReducedMotion = useReducedMotion();
  const [inner, setInner] = React.useState(defaultChecked);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : inner;
  const dims = SIZES[size] ?? SIZES.md;
  const thumb = dims.h - PAD * 2;

  const toggle = () => {
    if (disabled) return;
    const next = !on;
    if (!isControlled) setInner(next);
    onCheckedChange?.(next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label ? undefined : "Toggle"}
      disabled={disabled}
      onClick={toggle}
      data-state={on ? "on" : "off"}
      style={
        {
          "--mf-ts-accent": accentColor,
          "--mf-ts-w": `${dims.w}px`,
          "--mf-ts-h": `${dims.h}px`,
          "--mf-ts-thumb": `${thumb}px`,
          "--mf-ts-pad": `${PAD}px`,
        } as React.CSSProperties
      }
      className={`${styles.root} ${styles[size] ?? ""} ${className}`.trim()}
    >
      <span className={styles.track} aria-hidden="true">
        <motion.span
          className={styles.thumb}
          initial={false}
          animate={{ x: on ? dims.w - dims.h : 0, scale: 1 }}
          whileTap={prefersReducedMotion || disabled ? undefined : { scale: 0.9 }}
          transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 700, damping: 32 }}
        />
      </span>
      {label ? <span className={styles.label}>{label}</span> : null}
    </button>
  );
}
