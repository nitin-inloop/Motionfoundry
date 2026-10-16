"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/badge.module.css";

export interface BadgeProps {
  /** Badge text (ignored when children are provided) */
  label?: string;
  /** Custom badge content */
  children?: React.ReactNode;
  /** Visual variant */
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Corner style */
  shape?: "pill" | "rounded";
  /** Show a leading status dot */
  dot?: boolean;
  /** Animate the dot with a soft radiating pulse */
  pulse?: boolean;
  /** Show a remove (x) button; the badge animates out when pressed */
  removable?: boolean;
  /** Called after the remove button is pressed */
  onRemove?: () => void;
  /** Fill color of the default variant */
  accentColor?: string;
  /** Pop in with a small spring on mount */
  animateIn?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

export function Badge({
  label = "In review",
  children,
  variant = "default",
  size = "md",
  shape = "pill",
  dot = true,
  pulse = true,
  removable = true,
  onRemove,
  accentColor = "#6366f1",
  animateIn = true,
  className = "",
  style,
}: BadgeProps) {
  const reduce = useReducedMotion();
  const [visible, setVisible] = React.useState(true);
  const text = typeof children === "string" ? children : label;

  const remove = () => {
    setVisible(false);
    onRemove?.();
  };

  return (
    <AnimatePresence initial={animateIn && !reduce}>
      {visible && (
        <motion.span
          key="badge"
          className={`${styles.root} ${className}`.trim()}
          data-variant={variant}
          data-size={size}
          data-shape={shape}
          style={{ "--mf-bd-accent": accentColor, ...style } as React.CSSProperties}
          initial={{ opacity: 0, scale: 0.8, y: 2 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: reduce ? 1 : 0.8 }}
          transition={reduce ? { duration: 0.1 } : { type: "spring", stiffness: 520, damping: 30 }}
        >
          {dot && (
            <span aria-hidden="true" className={styles.dot} data-pulse={pulse && !reduce ? "" : undefined} />
          )}
          <span className={styles.label}>{children ?? label}</span>
          {removable && (
            <button type="button" className={styles.remove} aria-label={`Remove ${text}`} onClick={remove}>
              <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
