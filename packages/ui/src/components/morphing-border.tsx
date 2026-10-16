"use client";

import * as React from "react";
import styles from "../styles/morphing-border.module.css";

export interface MorphingBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Heading text */
  title?: string;
  /** Supporting copy */
  subtitle?: string;
  /** Primary traveling beam color */
  primaryColor?: string;
  /** Secondary traveling beam color */
  secondaryColor?: string;
  /** Orbit cycle duration in seconds */
  speed?: number;
  /** Corner radius in pixels */
  borderRadius?: number;
  /** Border thickness in pixels */
  borderWidth?: number;
}

export function MorphingBorder({
  title = "Traveling Perimeter Outline",
  subtitle = "Continuous conic beam paired with subtle corner-radius modulation and zero layout thrashing.",
  primaryColor = "#f4f4f6",
  secondaryColor = "#60a5fa",
  speed = 4.2,
  borderRadius = 14,
  borderWidth = 1.5,
  children,
  className = "",
  ...rest
}: MorphingBorderProps) {
  const customStyle = {
    "--mf-mb-primary": primaryColor,
    "--mf-mb-secondary": secondaryColor,
    "--mf-mb-speed": `${speed}s`,
    "--mf-mb-radius": `${borderRadius}px`,
    "--mf-mb-width": `${borderWidth}px`,
  } as React.CSSProperties;

  return (
    <div style={customStyle} className={`${styles.outer} ${className}`.trim()} {...rest}>
      <div aria-hidden="true" className={styles.travelingBeam} />
      <div className={styles.inner}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.subtitle}>{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
