"use client";

import * as React from "react";
import styles from "../styles/glyph-cascade.module.css";

export interface GlyphCascadeProps {
  /** Target string to reveal */
  text: string;
  /** Direction of character resolution */
  direction?: "ltr" | "rtl" | "center";
  /** Interval in ms between scramble frames */
  scrambleSpeed?: number;
  /** Scramble iterations per character */
  cascadeStep?: number;
  /** Blur radius in px for unresolved glyphs */
  blurAmount?: number;
  /** Cipher character pool */
  charset?: string;
  /** Optional className */
  className?: string;
}

export function GlyphCascade({
  text,
  direction = "ltr",
  scrambleSpeed = 32,
  cascadeStep = 2,
  blurAmount = 6,
  charset = "01/#%&*+<>ΔΛΞ",
  className = "",
}: GlyphCascadeProps) {
  const [step, setStep] = React.useState(0);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const chars = React.useMemo(() => Array.from(text), [text]);
  const maxSteps = chars.length * Math.max(1, cascadeStep);

  React.useEffect(() => {
    if (reducedMotion) {
      setStep(maxSteps);
      return;
    }
    setStep(0);
    const timer = window.setInterval(() => {
      setStep((prev) => {
        if (prev >= maxSteps) {
          window.clearInterval(timer);
          return maxSteps;
        }
        return prev + 1;
      });
    }, scrambleSpeed);
    return () => window.clearInterval(timer);
  }, [text, direction, scrambleSpeed, maxSteps, reducedMotion]);

  const isCharResolved = (index: number) => {
    if (reducedMotion || step >= maxSteps) return true;
    const total = chars.length;
    let orderIndex = index;
    if (direction === "rtl") {
      orderIndex = total - 1 - index;
    } else if (direction === "center") {
      const mid = (total - 1) / 2;
      orderIndex = Math.abs(index - mid) * 1.8;
    }
    return step >= orderIndex * cascadeStep;
  };

  return (
    <span className={`${styles.root} ${className}`.trim()}>
      <span className={styles.srOnly}>{text}</span>
      <span aria-hidden="true" className={styles.glyphTrack}>
        {chars.map((ch, idx) => {
          if (ch === " ") {
            return <span key={idx} className={styles.space}>&nbsp;</span>;
          }
          const resolved = isCharResolved(idx);
          const pool = charset.length > 0 ? charset : "01X#";
          const cipherChar = pool[(idx * 7 + step) % pool.length];
          return (
            <span
              key={idx}
              className={`${styles.glyph} ${resolved ? styles.resolved : styles.scrambling}`}
              style={
                resolved
                  ? undefined
                  : ({
                      filter: `blur(${ Math.max(0, blurAmount * 0.5) }px)`,
                    } as React.CSSProperties)
              }
            >
              {resolved ? ch : cipherChar}
            </span>
          );
        })}
      </span>
    </span>
  );
}
