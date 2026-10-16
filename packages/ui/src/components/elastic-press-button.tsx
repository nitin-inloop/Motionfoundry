"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/elastic-press-button.module.css";

/** Native button attributes whose names collide with Motion's animation and gesture handlers. */
type MotionConflictingKeys = "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd";

export interface ElasticPressButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, MotionConflictingKeys> {
  /** Button label */
  label?: string;
  /** Scale factor during active press */
  pressScale?: number;
  /** Spring stiffness for recovery */
  elasticity?: number;
  /** Border visual treatment */
  borderStyle?: "specular" | "solid" | "minimal";
  /** Loading state */
  loading?: boolean;
}

export function ElasticPressButton({
  children,
  label = "Commit Production Release",
  pressScale = 0.91,
  elasticity = 380,
  borderStyle = "specular",
  loading = false,
  disabled = false,
  className = "",
  ...rest
}: ElasticPressButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const isInactive = disabled || loading;

  return (
    <motion.button
      type="button"
      disabled={isInactive}
      aria-busy={loading}
      whileHover={prefersReducedMotion || isInactive ? undefined : { scale: 1.03, y: -1 }}
      whileTap={
        prefersReducedMotion || isInactive
          ? undefined
          : { scaleX: 1 + (1 - pressScale) * 0.45, scaleY: pressScale }
      }
      transition={{ type: "spring", stiffness: elasticity, damping: 14, mass: 0.45 }}
      className={`${styles.button} ${styles[borderStyle]} ${isInactive ? styles.disabled : ""} ${className}`.trim()}
      {...rest}
    >
      {loading && <span aria-hidden="true" className={styles.spinner} />}
      <span>{loading ? "Processing..." : children ?? label}</span>
    </motion.button>
  );
}
