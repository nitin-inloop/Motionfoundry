"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import styles from "../styles/magnetic-button.module.css";

/** Native button attributes whose names collide with Motion's animation and gesture handlers. */
type MotionConflictingKeys = "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd";

export interface MagneticButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, MotionConflictingKeys> {
  /** Button label */
  label?: string;
  /** Attraction strength multiplier */
  strength?: number;
  /** Return spring stiffness */
  stiffness?: number;
  /** Return spring damping */
  damping?: number;
  /** Hover scale multiplier */
  hoverScale?: number;
  /** Visual variant */
  variant?: "solid" | "outline" | "ghost";
}

export function MagneticButton({
  children,
  label = "Explore 24 Components",
  strength = 0.36,
  stiffness = 230,
  damping = 18,
  hoverScale = 1.04,
  variant = "solid",
  className = "",
  ...rest
}: MagneticButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness, damping, mass: 0.4 });
  const y = useSpring(rawY, { stiffness, damping, mass: 0.4 });

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (prefersReducedMotion || e.pointerType === "touch" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * strength;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * strength;
    rawX.set(dx);
    rawY.set(dy);
  };

  const handlePointerLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      whileHover={prefersReducedMotion ? undefined : { scale: hoverScale }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
      style={{
        x: prefersReducedMotion ? 0 : x,
        y: prefersReducedMotion ? 0 : y,
      }}
      className={`${styles.button} ${styles[variant]} ${className}`.trim()}
      {...rest}
    >
      <span className={styles.label}>{children ?? label}</span>
    </motion.button>
  );
}
