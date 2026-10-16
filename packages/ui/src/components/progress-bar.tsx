"use client";

import * as React from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import styles from "../styles/progress-bar.module.css";

export interface ProgressBarProps {
  /** Current value */
  value?: number;
  /** Maximum value */
  max?: number;
  /** Label shown above the bar (empty hides the header) */
  label?: string;
  /** Show the percentage readout */
  showValue?: boolean;
  /** Fill color */
  color?: string;
  /** Track color */
  trackColor?: string;
  /** Bar thickness in pixels */
  height?: number;
  /** Moving sheen across the fill */
  sheen?: boolean;
  /** Spring stiffness — lower is bouncier and slower */
  stiffness?: number;
  /** Demo mode: keep moving between sample values to show the spring */
  autoPlay?: boolean;
  /** Width in pixels */
  width?: number;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEMO_VALUES = [65, 28, 92, 46];

export function ProgressBar({
  value = 65,
  max = 100,
  label = "Progress",
  showValue = true,
  color = "#ff8a1f",
  trackColor,
  height = 10,
  sheen = true,
  stiffness = 120,
  autoPlay = false,
  width = 360,
  className = "",
  style,
}: ProgressBarProps) {
  const reduceMotion = useReducedMotion();
  const labelId = React.useId();
  const [demoIndex, setDemoIndex] = React.useState(-1);
  const shown = autoPlay && demoIndex >= 0 ? (DEMO_VALUES[demoIndex] / 100) * max : value;
  const pct = max > 0 ? Math.min(100, Math.max(0, (shown / max) * 100)) : 0;

  const raw = useMotionValue(0);
  const spring = useSpring(raw, { stiffness, damping: Math.max(8, stiffness / 9), mass: 0.9 });
  const widthPct = useTransform(spring, (v) => `${Math.min(100, Math.max(0, v))}%`);
  const readout = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (reduceMotion) {
      raw.jump(pct);
      spring.jump(pct);
    } else raw.set(pct);
    // Count the readout along with the spring.
    const controls = animate(Number(readout.current?.dataset.value ?? 0), pct, {
      duration: reduceMotion ? 0 : 0.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (readout.current) {
          readout.current.textContent = `${Math.round(v)}%`;
          readout.current.dataset.value = String(v);
        }
      },
    });
    return () => controls.stop();
  }, [pct, reduceMotion, raw, spring]);

  React.useEffect(() => {
    if (!autoPlay || reduceMotion) return;
    setDemoIndex(0);
    const id = window.setInterval(() => setDemoIndex((i) => (i + 1) % DEMO_VALUES.length), 1800);
    return () => window.clearInterval(id);
  }, [autoPlay, reduceMotion]);

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      style={
        {
          "--mf-pb-color": color,
          "--mf-pb-height": `${height}px`,
          "--mf-pb-width": `${width}px`,
          ...(trackColor ? { "--mf-pb-track": trackColor } : null),
          ...style,
        } as React.CSSProperties
      }
    >
      {(label || showValue) && (
        <div className={styles.header}>
          <span id={labelId}>{label}</span>
          {showValue && (
            <span ref={readout} className={styles.value} aria-hidden="true" data-value="0">
              0%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-labelledby={label ? labelId : undefined}
        aria-label={label ? undefined : "Progress"}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(shown)}
        aria-valuetext={`${Math.round(pct)}%`}
        className={styles.track}
      >
        <motion.div className={styles.fill} style={{ width: widthPct }}>
          {sheen && !reduceMotion && <span className={styles.sheen} aria-hidden="true" />}
        </motion.div>
      </div>
    </div>
  );
}
