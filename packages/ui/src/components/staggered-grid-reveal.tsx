"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/staggered-grid-reveal.module.css";

export interface StaggeredGridRevealProps {
  /** Spatial stagger pattern */
  pattern?: "diagonal" | "linear" | "radial-center";
  /** Number of columns */
  columns?: number;
  /** Base stagger interval in seconds */
  stagger?: number;
  /** Cell transition duration in seconds */
  duration?: number;
  /** Optional custom cell labels */
  cells?: string[];
  /** Optional className */
  className?: string;
}

const DEFAULT_CELLS = [
  "01 // AST",
  "02 // ESM",
  "03 // CSS",
  "04 // CLI",
  "05 // A11Y",
  "06 // SSR",
];

export function StaggeredGridReveal({
  pattern = "diagonal",
  columns = 3,
  stagger = 0.055,
  duration = 0.48,
  cells = DEFAULT_CELLS,
  className = "",
}: StaggeredGridRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const safeCols = Math.min(Math.max(columns, 2), 4);
  const rows = Math.ceil(cells.length / safeCols);

  const computeDelay = (idx: number) => {
    if (prefersReducedMotion) return 0;
    const r = Math.floor(idx / safeCols);
    const c = idx % safeCols;
    if (pattern === "diagonal") {
      return (r + c) * stagger * 1.4;
    }
    if (pattern === "radial-center") {
      const centerR = (rows - 1) / 2;
      const centerC = (safeCols - 1) / 2;
      const dist = Math.hypot(r - centerR, c - centerC);
      return dist * stagger * 1.6;
    }
    return idx * stagger;
  };

  return (
    <div
      style={{ gridTemplateColumns: `repeat(${safeCols}, minmax(0, 1fr))` }}
      className={`${styles.grid} ${className}`.trim()}
    >
      {cells.map((label, idx) => (
        <motion.div
          key={`${label}-${idx}-${pattern}`}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration,
            delay: computeDelay(idx),
            ease: [0.16, 1, 0.3, 1],
          }}
          className={styles.cell}
        >
          <span className={styles.cellLabel}>{label}</span>
        </motion.div>
      ))}
    </div>
  );
}
