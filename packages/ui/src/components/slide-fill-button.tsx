"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/slide-fill-button.module.css";

export interface SlideFillButtonProps {
  /** Button label (ignored when children are provided) */
  label?: string;
  /** Custom button content */
  children?: React.ReactNode;
  /** Edge the fill slides in from */
  direction?: "left" | "right" | "up" | "down";
  /** Fill color */
  fillColor?: string;
  /** Label color while filled */
  fillTextColor?: string;
  /** Fill transition duration in seconds */
  duration?: number;
  /** Disable the button */
  disabled?: boolean;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Optional className */
  className?: string;
}

const OFFSETS: Record<NonNullable<SlideFillButtonProps["direction"]>, { x: string; y: string }> = {
  left: { x: "-101%", y: "0%" },
  right: { x: "101%", y: "0%" },
  up: { x: "0%", y: "101%" },
  down: { x: "0%", y: "-101%" },
};

export function SlideFillButton({
  label = "Get started",
  children,
  direction = "left",
  fillColor = "#f4f4f6",
  fillTextColor = "#09090b",
  duration = 0.35,
  disabled = false,
  onClick,
  className = "",
}: SlideFillButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const active = !disabled && (hovered || focused);
  const from = OFFSETS[direction] ?? OFFSETS.left;

  const handleFocus = (event: React.FocusEvent<HTMLButtonElement>) => {
    let visible = true;
    try {
      visible = event.currentTarget.matches(":focus-visible");
    } catch {
      visible = true;
    }
    setFocused(visible);
  };

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onPointerEnter={(e) => e.pointerType !== "touch" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={handleFocus}
      onBlur={() => setFocused(false)}
      data-active={active || undefined}
      style={
        {
          "--mf-sf-fill": fillColor,
          "--mf-sf-fill-text": fillTextColor,
          "--mf-sf-duration": `${prefersReducedMotion ? 0 : duration}s`,
        } as React.CSSProperties
      }
      className={`${styles.root} ${className}`.trim()}
    >
      <motion.span
        aria-hidden="true"
        className={styles.fill}
        initial={false}
        animate={active ? { x: "0%", y: "0%" } : from}
        transition={transition}
      />
      <span className={styles.label}>{children ?? label}</span>
    </button>
  );
}
