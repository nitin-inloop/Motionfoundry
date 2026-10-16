"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/kinetic-type.module.css";

export interface KineticTypeProps {
  /** Text string to animate */
  text: string;
  /** Coordinated motion preset */
  preset?: "elastic" | "wave" | "orbit" | "snap";
  /** Split granularity */
  splitBy?: "words" | "chars";
  /** Stagger interval in seconds */
  stagger?: number;
  /** Duration per token in seconds */
  duration?: number;
  /** Initial rotation angle in degrees */
  rotationIntensity?: number;
  /** Initial Gaussian blur in pixels */
  blurStrength?: number;
  /** Optional className */
  className?: string;
}

export function KineticType({
  text,
  preset = "elastic",
  splitBy = "words",
  stagger = 0.055,
  duration = 0.65,
  rotationIntensity = 14,
  blurStrength = 8,
  className = "",
}: KineticTypeProps) {
  const prefersReducedMotion = useReducedMotion();
  const tokens = React.useMemo(
    () => (splitBy === "chars" ? Array.from(text) : text.split(" ")),
    [text, splitBy]
  );

  if (prefersReducedMotion) {
    return <h2 className={`${styles.root} ${className}`.trim()}>{text}</h2>;
  }

  const getInitialState = (index: number) => {
    const sign = index % 2 === 0 ? 1 : -1;
    switch (preset) {
      case "wave":
        return {
          opacity: 0,
          y: 26 * sign,
          rotate: rotationIntensity * sign,
          scale: 0.86,
          filter: `blur(${blurStrength}px)`,
        };
      case "orbit":
        return {
          opacity: 0,
          x: -18 * sign,
          y: 22,
          rotate: rotationIntensity * 1.4,
          scale: 0.72,
          filter: `blur(${blurStrength}px)`,
        };
      case "snap":
        return {
          opacity: 0,
          y: 34,
          rotate: -rotationIntensity * 0.5,
          scale: 1.18,
          filter: `blur(${blurStrength}px)`,
        };
      case "elastic":
      default:
        return {
          opacity: 0,
          y: 28,
          rotate: rotationIntensity,
          scale: 0.8,
          filter: `blur(${blurStrength}px)`,
        };
    }
  };

  return (
    <h2 aria-label={text} className={`${styles.root} ${className}`.trim()}>
      <span aria-hidden="true" className={styles.stage}>
        {tokens.map((token, idx) => (
          <motion.span
            key={`${token}-${idx}`}
            initial={getInitialState(idx)}
            animate={{
              opacity: 1,
              x: 0,
              y: 0,
              rotate: 0,
              scale: 1,
              filter: "blur(0px)",
            }}
            transition={
              preset === "elastic"
                ? {
                    type: "spring",
                    stiffness: 260,
                    damping: 18,
                    delay: idx * stagger,
                  }
                : {
                    duration,
                    delay: idx * stagger,
                    ease: [0.16, 1, 0.3, 1],
                  }
            }
            className={styles.token}
          >
            {token === " " ? "\u00A0" : token}
            {splitBy === "words" && idx < tokens.length - 1 ? "\u00A0" : ""}
          </motion.span>
        ))}
      </span>
    </h2>
  );
}
