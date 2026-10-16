"use client";

import * as React from "react";
import styles from "../styles/beam-lines.module.css";

export interface BeamLinesProps {
  /** Number of vertical guide lines */
  lines?: number;
  /** Beam glow color */
  beamColor?: string;
  /** Speed multiplier (1 = base 2.5–4.5s per sweep) */
  speed?: number;
  /** Foreground content rendered above the beams */
  children?: React.ReactNode;
  /** Optional className merged onto the root */
  className?: string;
}

const rand = (n: number) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

export function BeamLines({
  lines = 8,
  beamColor = "#38bdf8",
  speed = 1,
  children,
  className = "",
}: BeamLinesProps) {
  const safeSpeed = speed > 0 ? speed : 1;
  const total = Math.max(0, Math.round(lines));
  const styleVars = { "--mf-bl-color": beamColor } as React.CSSProperties;

  return (
    <div style={styleVars} className={`${styles.root} ${className}`.trim()}>
      <div aria-hidden="true" className={styles.field}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={styles.line} style={{ left: `${((i + 1) / (total + 1)) * 100}%` }}>
            <span
              className={styles.beam}
              style={{
                animationDuration: `${((2.5 + rand(i) * 2) / safeSpeed).toFixed(2)}s`,
                animationDelay: `-${(rand(i + 1) * 3).toFixed(2)}s`,
              }}
            />
          </div>
        ))}
      </div>
      <div className={styles.content}>
        {children ?? (
          <div className={styles.copy}>
            <span className={styles.eyebrow}>Signal</span>
            <h3 className={styles.title}>Beams in the grid</h3>
          </div>
        )}
      </div>
    </div>
  );
}
