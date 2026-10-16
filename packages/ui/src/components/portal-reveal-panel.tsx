"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import styles from "../styles/portal-reveal-panel.module.css";

export interface PortalRevealPanelProps {
  /** Panel heading */
  title?: string;
  /** Clip-path origin coordinate */
  origin?: "center" | "top-left" | "bottom-right" | "top-right";
  /** Reveal duration in seconds */
  duration?: number;
  /** Child stagger delay in seconds */
  staggerChildren?: number;
  /** Initial or controlled open state */
  isOpen?: boolean;
  /** Optional className */
  className?: string;
}

const ORIGIN_MAP: Record<string, string> = {
  center: "50% 50%",
  "top-left": "8% 12%",
  "bottom-right": "92% 88%",
  "top-right": "92% 12%",
};

export function PortalRevealPanel({
  title = "Radial Clip-Path Iris Portal",
  origin = "center",
  duration = 0.65,
  staggerChildren = 0.08,
  isOpen: isOpenProp = true,
  className = "",
}: PortalRevealPanelProps) {
  const [open, setOpen] = React.useState(isOpenProp);
  const prefersReducedMotion = useReducedMotion();
  const regionId = React.useId();

  React.useEffect(() => {
    setOpen(isOpenProp);
  }, [isOpenProp]);

  const coord = ORIGIN_MAP[origin] ?? "50% 50%";

  return (
    <div className={`${styles.wrapper} ${className}`.trim()}>
      <div className={styles.toolbar}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={regionId}
          onClick={() => setOpen((prev) => !prev)}
          className={styles.toggleBtn}
        >
          {open ? "Close Portal Panel" : "Open Portal Panel"}
        </button>
        <span className={styles.originBadge}>origin: {origin}</span>
      </div>

      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            id={regionId}
            key={origin}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { clipPath: `circle(0% at ${coord})`, opacity: 0.4 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { clipPath: `circle(150% at ${coord})`, opacity: 1 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { clipPath: `circle(0% at ${coord})`, opacity: 0 }
            }
            transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
            className={styles.panel}
          >
            <h4 className={styles.title}>{title}</h4>
            <div className={styles.metricsGrid}>
              {["Clip-Path Compositor", "Staggered Children", "Clean Unmount"].map(
                (item, idx) => (
                  <motion.div
                    key={item}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * staggerChildren + 0.12, duration: 0.35 }}
                    className={styles.chip}
                  >
                    {item}
                  </motion.div>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
