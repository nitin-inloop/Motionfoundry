"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/confetti-button.module.css";

export interface ConfettiButtonProps {
  /** Button label (ignored when children are provided) */
  label?: string;
  /** Optional custom button content */
  children?: React.ReactNode;
  /** Number of confetti pieces per burst */
  count?: number;
  /** Base travel distance of the burst in pixels */
  spread?: number;
  /** Primary confetti color */
  accentColor?: string;
  /** Secondary confetti color */
  secondaryColor?: string;
  /** Click handler, called on every press */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Optional className */
  className?: string;
}

const BURST_MS = 1000;

export function ConfettiButton({
  label = "Celebrate",
  children,
  count = 16,
  spread = 70,
  accentColor = "#38bdf8",
  secondaryColor = "#a78bfa",
  onClick,
  className = "",
}: ConfettiButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const [bursts, setBursts] = React.useState<number[]>([]);
  const nextId = React.useRef(0);
  const timers = React.useRef(new Set<ReturnType<typeof setTimeout>>());

  React.useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (prefersReducedMotion) return;
    const id = nextId.current++;
    setBursts((b) => [...b, id]);
    const t = setTimeout(() => {
      timers.current.delete(t);
      setBursts((b) => b.filter((x) => x !== id));
    }, BURST_MS);
    timers.current.add(t);
  };

  const pieces = Math.max(1, Math.round(count));

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
      className={`${styles.root} ${className}`.trim()}
    >
      <span className={styles.label}>{children ?? label}</span>
      {bursts.map((id) => (
        <span key={id} aria-hidden="true" className={styles.burst}>
          {Array.from({ length: pieces }, (_, i) => {
            const angle = (i / pieces) * Math.PI * 2;
            const distance = spread * (0.85 + (i % 3) * 0.3);
            return (
              <motion.span
                key={i}
                className={styles.piece}
                style={{ backgroundColor: i % 2 ? accentColor : secondaryColor }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                animate={{
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                  opacity: 0,
                  rotate: 270,
                  scale: 0.6,
                }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            );
          })}
        </span>
      ))}
    </motion.button>
  );
}
