"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/like-button.module.css";

export interface LikeButtonProps {
  /** Controlled liked state */
  liked?: boolean;
  /** Initial liked state when uncontrolled */
  defaultLiked?: boolean;
  /** Called with the next liked state */
  onLikedChange?: (liked: boolean) => void;
  /** Like count excluding the current user's like */
  count?: number;
  /** Show the rolling counter */
  showCount?: boolean;
  /** Accessible label of the button */
  label?: string;
  /** Icon shape */
  icon?: "heart" | "star" | "thumb";
  /** Visual style */
  variant?: "pill" | "ghost" | "icon";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Color of the filled icon and particles */
  accentColor?: string;
  /** Number of burst particles (0 disables the burst) */
  particleCount?: number;
  /** Disable the button */
  disabled?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const ICONS = {
  heart: "M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z",
  star: "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z",
  thumb: "M7 10v11M2 12v7a2 2 0 0 0 2 2h12.4a2 2 0 0 0 2-1.6l1.4-7A2 2 0 0 0 17.8 10H14V5a3 3 0 0 0-3-3l-4 8H4a2 2 0 0 0-2 2z",
} as const;

const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const fmt = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : n.toLocaleString("en-US"));

export function LikeButton({
  liked: likedProp,
  defaultLiked = false,
  onLikedChange,
  count = 128,
  showCount = true,
  label = "Like",
  icon = "heart",
  variant = "pill",
  size = "md",
  accentColor = "#f43f5e",
  particleCount = 12,
  disabled = false,
  className = "",
  style,
}: LikeButtonProps) {
  const reduce = useReducedMotion();
  const [inner, setInner] = React.useState(defaultLiked);
  const liked = likedProp ?? inner;
  const [burst, setBurst] = React.useState(0);
  const total = Math.max(0, count) + (liked ? 1 : 0);
  const withCount = showCount && variant !== "icon";

  const toggle = () => {
    if (disabled) return;
    const next = !liked;
    if (likedProp === undefined) setInner(next);
    if (next) setBurst((b) => b + 1);
    onLikedChange?.(next);
  };

  const n = Math.max(0, Math.min(32, Math.round(particleCount)));
  const particles = Array.from({ length: n }, (_, i) => {
    const angle = (i / Math.max(1, n)) * Math.PI * 2 + rand(i) * 0.4;
    const dist = 22 + rand(i + 50) * 14;
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, s: 3 + rand(i + 99) * 3, alt: i % 3 === 0 };
  });

  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={withCount ? `${label}, ${total.toLocaleString("en-US")}` : label}
      disabled={disabled}
      onClick={toggle}
      data-liked={liked || undefined}
      className={[styles.root, styles[variant], styles[size], className].filter(Boolean).join(" ")}
      style={{ "--mf-lb-accent": accentColor, ...style } as React.CSSProperties}
    >
      <span className={styles.iconWrap} aria-hidden="true">
        {!reduce && burst > 0 && liked ? (
          <span key={`b-${burst}`} className={styles.burst}>
            <motion.span
              className={styles.ring}
              initial={{ scale: 0.2, opacity: 0.9 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
            {particles.map((p, i) => (
              <motion.span
                key={i}
                className={`${styles.particle} ${p.alt ? styles.alt : ""}`.trim()}
                style={{ width: p.s, height: p.s, marginLeft: -p.s / 2, marginTop: -p.s / 2 }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{ x: p.x, y: p.y, scale: [0, 1.2, 0], opacity: [1, 1, 0] }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.04 }}
              />
            ))}
          </span>
        ) : null}
        <motion.svg
          viewBox="0 0 24 24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={reduce ? { scale: 1 } : liked ? { scale: [1, 0.7, 1.25, 1] } : { scale: [1, 0.85, 1] }}
          transition={{ duration: reduce ? 0 : liked ? 0.45 : 0.25, ease: "easeOut" }}
        >
          <path d={ICONS[icon] ?? ICONS.heart} />
        </motion.svg>
      </span>
      {withCount ? (
        <span className={styles.count} aria-hidden="true">
          <AnimatePresence initial={false} mode="popLayout" custom={liked}>
            <motion.span
              key={total}
              className={styles.num}
              custom={liked}
              variants={{
                enter: (up: boolean) => (reduce ? { opacity: 0 } : { y: up ? "100%" : "-100%", opacity: 0 }),
                center: { y: "0%", opacity: 1 },
                exit: (up: boolean) => (reduce ? { opacity: 0 } : { y: up ? "-100%" : "100%", opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={reduce ? { duration: 0.1 } : { type: "spring", stiffness: 500, damping: 32 }}
            >
              {fmt(total)}
            </motion.span>
          </AnimatePresence>
        </span>
      ) : null}
    </button>
  );
}
