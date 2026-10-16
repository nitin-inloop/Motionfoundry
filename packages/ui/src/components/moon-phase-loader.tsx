"use client";

import * as React from "react";
import styles from "../styles/moon-phase-loader.module.css";

export interface MoonPhaseLoaderProps {
  /** Moon diameter in pixels */
  size?: number;
  /** Seconds for one full cycle of phases */
  duration?: number;
  /** Lit moon color */
  color?: string;
  /** Shadow disc color (match your background) */
  shadowColor?: string;
  /** Soft glow around the lit moon */
  glow?: boolean;
  /** Clip the shadow to the moon so only the lit shape shows */
  clip?: boolean;
  /** Accessible loading label */
  label?: string;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

export function MoonPhaseLoader({
  size = 72,
  duration = 2.4,
  color = "#ff8a1f",
  shadowColor = "#0b0a09",
  glow = true,
  clip = false,
  label = "Loading",
  className = "",
  style,
}: MoonPhaseLoaderProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`${styles.root} ${clip ? styles.clip : ""} ${glow ? styles.glow : ""} ${className}`.trim()}
      style={
        {
          "--mf-mp-size": `${size}px`,
          "--mf-mp-duration": `${Math.max(0.4, duration)}s`,
          "--mf-mp-color": color,
          "--mf-mp-shadow": shadowColor,
          ...style,
        } as React.CSSProperties
      }
    >
      <span className={styles.moon} aria-hidden="true">
        <span className={styles.shadow} />
      </span>
    </div>
  );
}
