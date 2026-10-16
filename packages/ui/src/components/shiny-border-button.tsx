"use client";

import * as React from "react";
import styles from "../styles/shiny-border-button.module.css";

export interface ShinyBorderButtonProps {
  /** Button label (ignored when children are provided) */
  label?: string;
  /** Optional custom button content */
  children?: React.ReactNode;
  /** Seconds for the light beam to travel once around the border */
  duration?: number;
  /** Color of the travelling beam */
  beamColor?: string;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Disable the button and pause the beam */
  disabled?: boolean;
  /** Optional className */
  className?: string;
}

export function ShinyBorderButton({
  label = "Get early access",
  children,
  duration = 3,
  beamColor = "#38bdf8",
  onClick,
  disabled = false,
  className = "",
}: ShinyBorderButtonProps) {
  const styleVars = {
    "--mf-sb-duration": `${duration}s`,
    "--mf-sb-beam": beamColor,
  } as React.CSSProperties;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={styleVars}
      className={`${styles.root} ${className}`.trim()}
    >
      <span aria-hidden="true" className={styles.beam} />
      <span className={styles.inner}>{children ?? label}</span>
    </button>
  );
}
