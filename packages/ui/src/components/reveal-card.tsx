"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/reveal-card.module.css";

export interface RevealCardProps {
  /** Card title, shown on the cover and the overlay */
  title?: string;
  /** Body copy revealed in the overlay */
  body?: string;
  /** Edge the overlay slides in from */
  revealFrom?: "bottom" | "top" | "left" | "right";
  /** Overlay background color */
  accentColor?: string;
  /** Extra overlay content (e.g. a link or button) rendered under the body */
  children?: React.ReactNode;
  /** Optional className */
  className?: string;
}

const HIDDEN: Record<NonNullable<RevealCardProps["revealFrom"]>, { x: string; y: string }> = {
  bottom: { x: "0%", y: "100%" },
  top: { x: "0%", y: "-100%" },
  left: { x: "-100%", y: "0%" },
  right: { x: "100%", y: "0%" },
};

export function RevealCard({
  title = "Reveal Card",
  body = "A spring-driven overlay slides in on hover or keyboard focus, carrying the detail without leaving the card.",
  revealFrom = "bottom",
  accentColor = "#38bdf8",
  children,
  className = "",
}: RevealCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const open = hovered || focused;
  const hidden = HIDDEN[revealFrom] ?? HIDDEN.bottom;

  return (
    <article
      tabIndex={0}
      aria-label={title}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      data-open={open || undefined}
      style={{ "--mf-rc-accent": accentColor } as React.CSSProperties}
      className={`${styles.root} ${className}`.trim()}
    >
      <div className={styles.cover} aria-hidden="true">
        <span className={styles.glyph}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <span className={styles.coverTitle}>{title}</span>
      </div>
      <motion.div
        className={styles.overlay}
        initial={false}
        animate={
          prefersReducedMotion
            ? { x: "0%", y: "0%", opacity: open ? 1 : 0 }
            : open
              ? { x: "0%", y: "0%", opacity: 1 }
              : { ...hidden, opacity: 1 }
        }
        transition={
          prefersReducedMotion ? { duration: 0.15 } : { type: "spring", stiffness: 300, damping: 30 }
        }
      >
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.body}>{body}</p>
        {children ? <div className={styles.extra}>{children}</div> : null}
      </motion.div>
    </article>
  );
}
