"use client";

import * as React from "react";
import styles from "../styles/orbiting-words.module.css";

export interface OrbitingWordsProps {
  /** Focal phrase in the center */
  centerPhrase?: string;
  /** Satellite labels orbiting the center */
  words?: string[];
  /** Orbit radius in pixels */
  radius?: number;
  /** Seconds per full revolution */
  duration?: number;
  /** Animated or static layout mode */
  mode?: "animated" | "static";
  /** Perspective pitch angle in degrees */
  tilt?: number;
  /** Optional className */
  className?: string;
}

const DEFAULT_WORDS = [
  "React 19",
  "TypeScript",
  "Motion 14",
  "CSS Modules",
  "CLI Registry",
  "MIT License",
];

export function OrbitingWords({
  centerPhrase = "MotionFoundry Core",
  words = DEFAULT_WORDS,
  radius = 108,
  duration = 18,
  mode = "animated",
  tilt = 22,
  className = "",
}: OrbitingWordsProps) {
  const safeWords = words.length > 0 ? words : DEFAULT_WORDS;
  const isStatic = mode === "static";

  return (
    <div
      style={
        {
          "--mf-orbit-radius": `${radius}px`,
          "--mf-orbit-duration": `${duration}s`,
          "--mf-orbit-tilt": `${tilt}deg`,
        } as React.CSSProperties
      }
      className={`${styles.stage} ${className}`.trim()}
    >
      <div className={styles.centerNode}>{centerPhrase}</div>
      <div
        aria-label={`Satellite capabilities: ${safeWords.join(", ")}`}
        className={`${styles.ring} ${isStatic ? styles.ringStatic : styles.ringAnimated}`}
      >
        {safeWords.map((word, idx) => {
          const angle = (360 / safeWords.length) * idx;
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius * 0.62;
          return (
            <span
              key={`${word}-${idx}`}
              style={{
                transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`,
              }}
              className={`${styles.wordTag} ${isStatic ? "" : styles.counterRotate}`.trim()}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}
