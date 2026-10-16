"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/rotating-words.module.css";

export interface RotatingWordsProps {
  /** Static text rendered before the rotating word */
  prefix?: string;
  /** Words cycled in place */
  words?: string[];
  /** Milliseconds each word stays visible */
  interval?: number;
  /** Color of the rotating word */
  accentColor?: string;
  /** Optional className */
  className?: string;
}

const DEFAULT_WORDS = ["faster", "smoother", "bolder", "today"];

export function RotatingWords({
  prefix = "Ship",
  words = DEFAULT_WORDS,
  interval = 2000,
  accentColor = "#38bdf8",
  className = "",
}: RotatingWordsProps) {
  const prefersReducedMotion = useReducedMotion();
  const list = words.length > 0 ? words : DEFAULT_WORDS;
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (prefersReducedMotion || list.length < 2) return;
    const id = setInterval(() => setIndex((n) => (n + 1) % list.length), interval);
    return () => clearInterval(id);
  }, [list.length, interval, prefersReducedMotion]);

  const current = list[index % list.length];
  const label = `${prefix ? `${prefix} ` : ""}${list.join(", ")}`;

  return (
    <span
      style={{ "--mf-rw-accent": accentColor } as React.CSSProperties}
      className={`${styles.root} ${className}`.trim()}
    >
      <span className={styles.srOnly}>{label}</span>
      <span aria-hidden="true" className={styles.visual}>
        {prefix ? <span className={styles.prefix}>{prefix}</span> : null}
        <span className={styles.slot}>
          {list.map((word, i) => (
            <span key={`sizer-${i}`} className={styles.sizer}>
              {word}
            </span>
          ))}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={`${index}-${current}`}
              className={styles.word}
              initial={prefersReducedMotion ? false : { y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { y: "-100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {current}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
    </span>
  );
}
