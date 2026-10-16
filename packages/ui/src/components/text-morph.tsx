"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import styles from "../styles/text-morph.module.css";

export interface TextMorphProps {
  /** Leading static text */
  prefix?: string;
  /** Array of phrases to morph through */
  phrases?: string[];
  /** Cycle interval in milliseconds */
  interval?: number;
  /** Enable automatic cycling */
  autoplay?: boolean;
  /** Render interactive prev/next buttons */
  manualControls?: boolean;
  /** Optical blur radius during transition */
  blurTransition?: number;
  /** Optional className */
  className?: string;
}

const DEFAULT_PHRASES = [
  "zero-jank layouts",
  "120Hz spring physics",
  "Next.js App Router",
  "accessible motion",
];

export function TextMorph({
  prefix = "Engineered for",
  phrases = DEFAULT_PHRASES,
  interval = 2400,
  autoplay = true,
  manualControls = true,
  blurTransition = 6,
  className = "",
}: TextMorphProps) {
  const safePhrases = phrases.length > 0 ? phrases : DEFAULT_PHRASES;
  const [index, setIndex] = React.useState(0);
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (!autoplay || prefersReducedMotion || safePhrases.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % safePhrases.length);
    }, interval);
    return () => window.clearInterval(id);
  }, [autoplay, interval, safePhrases.length, prefersReducedMotion]);

  const currentPhrase = safePhrases[index % safePhrases.length];

  return (
    <div className={`${styles.wrapper} ${className}`.trim()}>
      <div className={styles.sentenceRow} aria-live="polite">
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <motion.span layout className={styles.morphPill}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={currentPhrase}
              initial={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 0, y: 14, filter: `blur(${blurTransition}px)` }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -14, filter: `blur(${blurTransition}px)` }
              }
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className={styles.phrase}
            >
              {currentPhrase}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </div>
      {manualControls && (
        <div className={styles.controls}>
          <button
            type="button"
            onClick={() =>
              setIndex((prev) => (prev - 1 + safePhrases.length) % safePhrases.length)
            }
            aria-label="Previous phrase"
            className={styles.stepBtn}
          >
            ← Prev
          </button>
          <span className={styles.counter}>
            {(index % safePhrases.length) + 1}/{safePhrases.length}
          </span>
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev + 1) % safePhrases.length)}
            aria-label="Next phrase"
            className={styles.stepBtn}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
