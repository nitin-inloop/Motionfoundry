"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/blur-in-text.module.css";

export interface BlurInTextProps {
  /** Text to reveal word by word */
  text?: string;
  /** Per-word animation duration in seconds */
  duration?: number;
  /** Delay between consecutive words in seconds */
  stagger?: number;
  /** Initial blur radius in pixels */
  blur?: number;
  /** Semantic element to render */
  as?: "h1" | "h2" | "h3" | "p";
  /** Optional className */
  className?: string;
}

export function BlurInText({
  text = "Motion that feels considered, not decorated.",
  duration = 0.6,
  stagger = 0.08,
  blur = 12,
  as = "h2",
  className = "",
}: BlurInTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const words = text.split(" ").filter(Boolean);
  const Tag = as;

  return (
    <Tag aria-label={text} className={`${styles.root} ${className}`.trim()}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          aria-hidden="true"
          className={styles.word}
          initial={prefersReducedMotion ? false : { opacity: 0, filter: `blur(${blur}px)`, y: 8 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration, delay: i * stagger, ease: "easeOut" }}
        >
          {word}
          {i < words.length - 1 ? " " : null}
        </motion.span>
      ))}
    </Tag>
  );
}
