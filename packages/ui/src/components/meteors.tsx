"use client";

import * as React from "react";
import styles from "../styles/meteors.module.css";

export interface MeteorsProps {
  /** Number of meteors in the shower */
  count?: number;
  /** Speed multiplier (1 = base 2–5s fall per meteor) */
  speed?: number;
  /** Travel direction in degrees, clockwise from pointing right (135 = down-left) */
  angle?: number;
  /** Meteor head and trail color */
  meteorColor?: string;
  /** Foreground content rendered above the shower */
  children?: React.ReactNode;
  /** Optional className merged onto the root */
  className?: string;
}

const rand = (n: number) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

export function Meteors({
  count = 14,
  speed = 1,
  angle = 135,
  meteorColor = "#38bdf8",
  children,
  className = "",
}: MeteorsProps) {
  const safeSpeed = speed > 0 ? speed : 1;
  const total = Math.max(0, Math.round(count));
  const styleVars = {
    "--mf-mt-color": meteorColor,
    "--mf-mt-angle": `${angle}deg`,
  } as React.CSSProperties;

  return (
    <div style={styleVars} className={`${styles.root} ${className}`.trim()}>
      <div aria-hidden="true" className={styles.sky}>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={styles.meteor}
            style={{
              left: `${(rand(i) * 130 - 10).toFixed(2)}%`,
              top: `${(rand(i + 7) * 50 - 15).toFixed(2)}%`,
              animationDuration: `${((2 + rand(i + 1) * 3) / safeSpeed).toFixed(2)}s`,
              animationDelay: `-${(rand(i + 2) * 5).toFixed(2)}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.content}>
        {children ?? (
          <div className={styles.copy}>
            <h3 className={styles.title}>Meteor Shower</h3>
            <p className={styles.subtitle}>Pure CSS streaks with deterministic timing.</p>
          </div>
        )}
      </div>
    </div>
  );
}
