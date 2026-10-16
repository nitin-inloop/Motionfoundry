"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/aurora-headline.module.css";

export interface AuroraHeadlineProps {
  /** Headline copy */
  text: string;
  /** Primary color stop */
  accentFrom?: string;
  /** Midpoint color stop */
  accentVia?: string;
  /** Terminal color stop */
  accentTo?: string;
  /** Gradient sweep speed in seconds */
  shimmerSpeed?: number;
  /** Stagger interval between words */
  stagger?: number;
  /** Optional className */
  className?: string;
}

export function AuroraHeadline({
  text,
  accentFrom = "#f4f4f6",
  accentVia = "#93c5fd",
  accentTo = "#c4b5fd",
  shimmerSpeed = 6,
  stagger = 0.06,
  className = "",
}: AuroraHeadlineProps) {
  const prefersReducedMotion = useReducedMotion();
  const words = React.useMemo(() => text.split(" "), [text]);

  const customVars = {
    "--mf-ah-from": accentFrom,
    "--mf-ah-via": accentVia,
    "--mf-ah-to": accentTo,
    "--mf-ah-speed": `${shimmerSpeed}s`,
  } as React.CSSProperties;

  return (
    <h1
      aria-label={text}
      style={customVars}
      className={`${styles.headline} ${className}`.trim()}
    >
      <span aria-hidden="true" className={styles.wordWrap}>
        {words.map((word, idx) => (
          <span key={`${word}-${idx}`} className={styles.mask}>
            <motion.span
              initial={prefersReducedMotion ? false : { y: "105%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{
                duration: 0.6,
                delay: prefersReducedMotion ? 0 : idx * stagger,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={styles.word}
            >
              {word}&nbsp;
            </motion.span>
          </span>
        ))}
      </span>
    </h1>
  );
}
