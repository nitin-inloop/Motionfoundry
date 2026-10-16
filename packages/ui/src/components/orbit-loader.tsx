"use client";

import * as React from "react";
import styles from "../styles/orbit-loader.module.css";

export interface OrbitLoaderProps {
  /** Loader diameter in pixels */
  size?: number;
  /** Outer orbit period in seconds (inner orbit runs at twice this, reversed) */
  duration?: number;
  /** Accent color for the core and leading satellite */
  color?: string;
  /** Accessible label announced by assistive technology */
  label?: string;
  /** Optional className merged onto the root */
  className?: string;
}

export function OrbitLoader({
  size = 72,
  duration = 1.4,
  color = "#38bdf8",
  label = "Loading",
  className = "",
}: OrbitLoaderProps) {
  const styleVars = {
    "--mf-ol-size": `${size}px`,
    "--mf-ol-duration": `${duration > 0 ? duration : 1.4}s`,
    "--mf-ol-color": color,
  } as React.CSSProperties;

  return (
    <div role="status" aria-label={label} style={styleVars} className={`${styles.root} ${className}`.trim()}>
      <span aria-hidden="true" className={styles.core} />
      <span aria-hidden="true" className={`${styles.ring} ${styles.outer}`}>
        <span className={`${styles.dot} ${styles.accentDot}`} />
      </span>
      <span aria-hidden="true" className={`${styles.ring} ${styles.inner}`}>
        <span className={styles.dot} />
      </span>
    </div>
  );
}
