"use client";

import * as React from "react";
import styles from "../styles/fluid-mesh-background.module.css";

export interface FluidMeshBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional foreground headline */
  headline?: string;
  /** Primary mesh color */
  colorA?: string;
  /** Secondary mesh color */
  colorB?: string;
  /** Tertiary mesh color */
  colorC?: string;
  /** Orbit cycle duration in seconds */
  speed?: number;
  /** Field opacity (0.1 to 0.6) */
  intensity?: number;
}

export function FluidMeshBackground({
  headline = "Fluid Multi-Field Mesh Backdrop",
  colorA = "#38bdf8",
  colorB = "#818cf8",
  colorC = "#e4e4e7",
  speed = 14,
  intensity = 0.28,
  children,
  className = "",
  ...rest
}: FluidMeshBackgroundProps) {
  const customVars = {
    "--mf-fm-a": colorA,
    "--mf-fm-b": colorB,
    "--mf-fm-c": colorC,
    "--mf-fm-speed": `${speed}s`,
    "--mf-fm-opacity": intensity,
  } as React.CSSProperties;

  return (
    <div style={customVars} className={`${styles.stage} ${className}`.trim()} {...rest}>
      <div aria-hidden="true" className={styles.meshLayer}>
        <div className={`${styles.field} ${styles.fieldA}`} />
        <div className={`${styles.field} ${styles.fieldB}`} />
        <div className={`${styles.field} ${styles.fieldC}`} />
      </div>
      <div className={styles.foreground}>
        {children ?? <h3 className={styles.headline}>{headline}</h3>}
      </div>
    </div>
  );
}
