"use client";

import * as React from "react";
import styles from "../styles/pulse-loader.module.css";

export interface PulseLoaderProps {
  /** Loader diameter in pixels */
  size?: number;
  /** Duration of one ring expansion in seconds */
  duration?: number;
  /** Number of staggered rings */
  rings?: number;
  /** Ring and core color */
  color?: string;
  /** Accessible label announced by assistive technology */
  label?: string;
  /** Optional className merged onto the root */
  className?: string;
}

export function PulseLoader({
  size = 64,
  duration = 1.8,
  rings = 3,
  color = "#38bdf8",
  label = "Loading",
  className = "",
}: PulseLoaderProps) {
  const total = Math.max(1, Math.round(rings));
  const safeDuration = duration > 0 ? duration : 1.8;
  const styleVars = {
    "--mf-pl-size": `${size}px`,
    "--mf-pl-duration": `${safeDuration}s`,
    "--mf-pl-color": color,
  } as React.CSSProperties;

  return (
    <div role="status" aria-label={label} style={styleVars} className={`${styles.root} ${className}`.trim()}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={styles.ring}
          style={
            {
              animationDelay: `-${((i * safeDuration) / total).toFixed(3)}s`,
              "--mf-pl-static": ((i + 1) / total).toFixed(3),
            } as React.CSSProperties
          }
        />
      ))}
      <span aria-hidden="true" className={styles.core} />
    </div>
  );
}
