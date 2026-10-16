"use client";

import * as React from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import styles from "../styles/number-ticker.module.css";

export interface NumberTickerProps {
  /** Target value to count up to */
  value?: number;
  /** Starting value of the count */
  from?: number;
  /** Count duration in seconds */
  duration?: number;
  /** Number of fraction digits to display */
  decimals?: number;
  /** Text rendered before the number */
  prefix?: string;
  /** Text rendered after the number */
  suffix?: string;
  /** Optional className */
  className?: string;
}

function format(n: number, decimals: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function NumberTicker({
  value = 12480,
  from = 0,
  duration = 1.6,
  decimals = 0,
  prefix = "",
  suffix = "+",
  className = "",
}: NumberTickerProps) {
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const numRef = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(rootRef, { once: true, margin: "0px 0px -10% 0px" });
  const prefersReducedMotion = useReducedMotion();
  const finalText = format(value, decimals);

  React.useEffect(() => {
    const node = numRef.current;
    if (!node) return;
    if (prefersReducedMotion) {
      node.textContent = finalText;
      return;
    }
    if (!inView) {
      node.textContent = format(from, decimals);
      return;
    }
    const controls = animate(from, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = format(v, decimals);
      },
    });
    return () => controls.stop();
  }, [inView, value, from, duration, decimals, prefersReducedMotion, finalText]);

  return (
    <span
      ref={rootRef}
      role="img"
      aria-label={`${prefix}${finalText}${suffix}`}
      className={`${styles.root} ${className}`.trim()}
    >
      {prefix ? (
        <span aria-hidden="true" className={styles.affix}>
          {prefix}
        </span>
      ) : null}
      <span ref={numRef} aria-hidden="true" className={styles.number}>
        {finalText}
      </span>
      {suffix ? (
        <span aria-hidden="true" className={styles.affix}>
          {suffix}
        </span>
      ) : null}
    </span>
  );
}
