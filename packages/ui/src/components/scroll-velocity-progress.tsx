"use client";

import * as React from "react";
import styles from "../styles/scroll-velocity-progress.module.css";

export interface ScrollVelocityProgressProps {
  /** Scroll completion percentage (0 to 100) */
  progress?: number;
  /** Velocity multiplier (0 to 4) */
  velocity?: number;
  /** Orientation mode */
  orientation?: "horizontal" | "vertical";
  /** Bar accent color */
  accentColor?: string;
  /** Optional className */
  className?: string;
}

export function ScrollVelocityProgress({
  progress = 64,
  velocity = 1.8,
  orientation = "horizontal",
  accentColor = "#38bdf8",
  className = "",
}: ScrollVelocityProgressProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const thickness = Math.min(12, 4 + velocity * 1.6);

  return (
    <div className={`${styles.card} ${className}`.trim()}>
      <div className={styles.metaRow}>
        <span className={styles.label}>SCROLL VELOCITY TELEMETRY</span>
        <span className={styles.readout}>
          {clampedProgress}% • {velocity.toFixed(1)}x vel
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="Page scroll progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clampedProgress)}
        className={orientation === "vertical" ? styles.trackVertical : styles.trackHorizontal}
        style={
          orientation === "vertical"
            ? { width: `${thickness}px` }
            : { height: `${thickness}px` }
        }
      >
        <div
          className={styles.fill}
          style={
            orientation === "vertical"
              ? {
                  height: `${clampedProgress}%`,
                  width: "100%",
                  backgroundColor: accentColor,
                  boxShadow: `0 0 ${Math.round(velocity * 6)}px ${accentColor}`,
                }
              : {
                  width: `${clampedProgress}%`,
                  height: "100%",
                  backgroundColor: accentColor,
                  boxShadow: `0 0 ${Math.round(velocity * 6)}px ${accentColor}`,
                }
          }
        />
      </div>
    </div>
  );
}
