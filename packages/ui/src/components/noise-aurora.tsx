"use client";

import * as React from "react";
import styles from "../styles/noise-aurora.module.css";

export interface NoiseAuroraProps {
  /** Foreground label */
  label?: string;
  /** SVG noise grain opacity */
  grainOpacity?: number;
  /** Ribbon drift cycle speed in seconds */
  auroraSpeed?: number;
  /** Aurora ribbon opacity */
  ribbonOpacity?: number;
  /** Optional children */
  children?: React.ReactNode;
  /** Optional className */
  className?: string;
}

export function NoiseAurora({
  label = "Procedural Film-Grain Aurora",
  grainOpacity = 0.16,
  auroraSpeed = 16,
  ribbonOpacity = 0.34,
  children,
  className = "",
}: NoiseAuroraProps) {
  const filterId = React.useId();

  return (
    <div
      style={
        {
          "--mf-na-speed": `${auroraSpeed}s`,
          "--mf-na-ribbon": ribbonOpacity,
          "--mf-na-grain": grainOpacity,
        } as React.CSSProperties
      }
      className={`${styles.container} ${className}`.trim()}
    >
      <div aria-hidden="true" className={styles.ribbonLayer} />
      <svg aria-hidden="true" className={styles.noiseSvg}>
        <filter id={filterId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves={3}
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} />
      </svg>
      <div className={styles.foreground}>
        {children ?? <span className={styles.badge}>{label}</span>}
      </div>
    </div>
  );
}
