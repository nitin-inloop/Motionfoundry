"use client";

import * as React from "react";
import styles from "../styles/shimmer-text.module.css";

export interface ShimmerTextProps {
  /** Text the highlight sweeps across */
  text?: string;
  /** Duration of one sweep in seconds */
  duration?: number;
  /** Resting text color */
  baseColor?: string;
  /** Color of the moving highlight */
  shimmerColor?: string;
  /** Optional className */
  className?: string;
}

export function ShimmerText({
  text = "Generating your preview...",
  duration = 2.5,
  baseColor = "#71717a",
  shimmerColor = "#f4f4f6",
  className = "",
}: ShimmerTextProps) {
  const styleVars = {
    "--mf-sh-duration": `${duration}s`,
    "--mf-sh-base": baseColor,
    "--mf-sh-shine": shimmerColor,
  } as React.CSSProperties;

  return (
    <span style={styleVars} className={`${styles.root} ${className}`.trim()}>
      {text}
    </span>
  );
}
