"use client";

import * as React from "react";
import styles from "../styles/liquid-blob.module.css";

export interface LiquidBlobProps {
  /** Foreground label */
  label?: string;
  /** Primary gradient stop */
  colorPrimary?: string;
  /** Secondary gradient stop */
  colorSecondary?: string;
  /** Morph cycle duration in seconds */
  morphSpeed?: number;
  /** Diameter in pixels */
  size?: number;
  /** Optional className */
  className?: string;
}

export function LiquidBlob({
  label = "Organic SVG Path Morph",
  colorPrimary = "#60a5fa",
  colorSecondary = "#a855f7",
  morphSpeed = 9,
  size = 168,
  className = "",
}: LiquidBlobProps) {
  const customStyle = {
    "--mf-blob-a": colorPrimary,
    "--mf-blob-b": colorSecondary,
    "--mf-blob-speed": `${morphSpeed}s`,
    "--mf-blob-size": `${size}px`,
  } as React.CSSProperties;

  return (
    <div style={customStyle} className={`${styles.stage} ${className}`.trim()}>
      <div aria-hidden="true" className={styles.blob} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
