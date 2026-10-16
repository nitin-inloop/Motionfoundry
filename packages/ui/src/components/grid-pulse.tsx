"use client";

import * as React from "react";
import styles from "../styles/grid-pulse.module.css";

export interface GridPulseProps {
  /** Number of grid columns */
  cols?: number;
  /** Number of grid rows */
  rows?: number;
  /** Cell pulse color */
  pulseColor?: string;
  /** Pulse cycle duration in seconds */
  duration?: number;
  /** Foreground content rendered above the grid */
  children?: React.ReactNode;
  /** Optional className merged onto the root */
  className?: string;
}

const rand = (n: number) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

export function GridPulse({
  cols = 12,
  rows = 6,
  pulseColor = "#38bdf8",
  duration = 3,
  children,
  className = "",
}: GridPulseProps) {
  const c = Math.max(1, Math.round(cols));
  const r = Math.max(1, Math.round(rows));
  const styleVars = {
    "--mf-gp-color": pulseColor,
    "--mf-gp-duration": `${duration > 0 ? duration : 3}s`,
    "--mf-gp-cols": c,
    "--mf-gp-rows": r,
  } as React.CSSProperties;

  return (
    <div style={styleVars} className={`${styles.root} ${className}`.trim()}>
      <div aria-hidden="true" className={styles.grid}>
        {Array.from({ length: c * r }, (_, i) => (
          <span
            key={i}
            className={styles.cell}
            style={{ "--mf-gp-delay": `-${(rand(i) * 6).toFixed(2)}s` } as React.CSSProperties}
          />
        ))}
      </div>
      <div className={styles.content}>
        {children ?? (
          <div className={styles.copy}>
            <h3 className={styles.title}>Grid Pulse</h3>
            <p className={styles.subtitle}>
              {c} × {r} cells, CSS-only
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
