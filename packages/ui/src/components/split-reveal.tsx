"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/split-reveal.module.css";

export interface SplitRevealProps {
  /** Text revealed word by word from behind a mask */
  text?: string;
  /** Delay between consecutive words in seconds */
  stagger?: number;
  /** Per-word reveal duration in seconds */
  duration?: number;
  /** Direction words travel in from */
  direction?: "up" | "down";
  /** Optional className */
  className?: string;
}

export function SplitReveal({
  text = "Every pixel earns its place.",
  stagger = 0.1,
  duration = 0.6,
  direction = "up",
  className = "",
}: SplitRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const words = text.split(" ").filter(Boolean);
  const offset = direction === "up" ? "110%" : "-110%";

  return (
    <span className={`${styles.root} ${className}`.trim()}>
      <span className={styles.srOnly}>{text}</span>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} aria-hidden="true" className={styles.mask}>
          <motion.span
            className={styles.word}
            initial={prefersReducedMotion ? false : { y: offset }}
            animate={{ y: 0 }}
            transition={{ delay: i * stagger, duration, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
