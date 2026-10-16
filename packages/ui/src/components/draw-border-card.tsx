"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/draw-border-card.module.css";

export interface DrawBorderCardProps {
  /** Card heading (ignored when children are provided) */
  title?: string;
  /** Card body copy (ignored when children are provided) */
  body?: string;
  /** Custom card content */
  children?: React.ReactNode;
  /** Stroke draw duration in seconds */
  duration?: number;
  /** Stroke color */
  strokeColor?: string;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Card corner radius in pixels (shared by the card and the stroke) */
  radius?: number;
  /** Optional className */
  className?: string;
}

export function DrawBorderCard({
  title = "Draw Border Card",
  body = "Hover or focus the card and a single stroke traces its outline, matched exactly to the corner radius.",
  children,
  duration = 0.8,
  strokeColor = "#38bdf8",
  strokeWidth = 2,
  radius = 16,
  className = "",
}: DrawBorderCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const active = hovered || focused;

  return (
    <article
      tabIndex={0}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      data-active={active || undefined}
      style={{ "--mf-db-radius": `${radius}px` } as React.CSSProperties}
      className={`${styles.root} ${className}`.trim()}
    >
      <svg className={styles.outline} aria-hidden="true">
        <motion.rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx={radius}
          ry={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={false}
          animate={
            prefersReducedMotion
              ? { pathLength: 1, opacity: active ? 1 : 0 }
              : { pathLength: active ? 1 : 0, opacity: active ? 1 : 0 }
          }
          transition={
            prefersReducedMotion
              ? { duration: 0.15 }
              : {
                  pathLength: { duration, ease: [0.65, 0, 0.35, 1] },
                  opacity: { duration: 0.12, delay: active ? 0 : duration * 0.6 },
                }
          }
        />
      </svg>
      <div className={styles.content}>
        {children ?? (
          <>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.body}>{body}</p>
          </>
        )}
      </div>
    </article>
  );
}
