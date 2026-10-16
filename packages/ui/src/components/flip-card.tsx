"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/flip-card.module.css";

export interface FlipCardProps {
  /** Custom front face content (overrides frontTitle/frontText) */
  front?: React.ReactNode;
  /** Custom back face content (overrides backTitle/backText) */
  back?: React.ReactNode;
  /** Front face heading used when `front` is not provided */
  frontTitle?: string;
  /** Front face text used when `front` is not provided */
  frontText?: string;
  /** Back face heading used when `back` is not provided */
  backTitle?: string;
  /** Back face text used when `back` is not provided */
  backText?: string;
  /** What flips the card with a pointer (Enter/Space always flips) */
  trigger?: "hover" | "click";
  /** Rotation axis */
  axis?: "y" | "x";
  /** Card width in pixels */
  width?: number;
  /** Card height in pixels */
  height?: number;
  /** Optional className */
  className?: string;
}

export function FlipCard({
  front,
  back,
  frontTitle = "Flip Card",
  frontText = "Hover, click or press Enter to turn me over.",
  backTitle = "Spring-driven 3D",
  backText = "Perspective, backface culling and a tuned spring. Press Enter again to flip back.",
  trigger = "hover",
  axis = "y",
  width = 288,
  height = 224,
  className = "",
}: FlipCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [flipped, setFlipped] = React.useState(false);
  const lastPointer = React.useRef("mouse");
  const rotateKey = axis === "x" ? "rotateX" : "rotateY";

  const onPointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    lastPointer.current = e.pointerType;
    if (trigger === "hover" && e.pointerType !== "touch") setFlipped(true);
  };
  const onPointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (trigger === "hover" && e.pointerType !== "touch") setFlipped(false);
  };
  const onClick = () => {
    if (trigger === "click" || lastPointer.current === "touch") setFlipped((f) => !f);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setFlipped((f) => !f);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-roledescription="flip card"
      onPointerEnter={onPointerEnter}
      onPointerDown={(e) => {
        lastPointer.current = e.pointerType;
      }}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
      onKeyDown={onKeyDown}
      style={
        {
          "--mf-fc-w": `${width}px`,
          "--mf-fc-h": `${height}px`,
        } as React.CSSProperties
      }
      className={`${styles.root} ${className}`.trim()}
    >
      <motion.div
        className={styles.inner}
        initial={false}
        animate={{ [rotateKey]: flipped ? 180 : 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 16 }}
      >
        <div className={`${styles.face} ${styles.front}`} aria-hidden={flipped}>
          {front ?? (
            <>
              <span className={styles.badge} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h3 className={styles.title}>{frontTitle}</h3>
              <p className={styles.text}>{frontText}</p>
            </>
          )}
        </div>
        <div
          className={`${styles.face} ${styles.back}`}
          aria-hidden={!flipped}
          style={{ transform: axis === "x" ? "rotateX(180deg)" : "rotateY(180deg)" }}
        >
          {back ?? (
            <>
              <h3 className={styles.title}>{backTitle}</h3>
              <p className={styles.text}>{backText}</p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
