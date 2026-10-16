"use client";

import * as React from "react";
import styles from "../styles/skeleton-shimmer.module.css";

export interface SkeletonShimmerProps {
  /** Number of body lines */
  lines?: number;
  /** Show the avatar + title block */
  avatar?: boolean;
  /** Avatar shape */
  avatarShape?: "rounded" | "circle";
  /** Wrap the placeholder in a bordered card */
  card?: boolean;
  /** Seconds per shimmer sweep */
  speed?: number;
  /** Placeholder block color (defaults to the theme's raised surface) */
  baseColor?: string;
  /** Shimmer highlight color */
  shimmerColor?: string;
  /** Corner radius of the bars in pixels */
  radius?: number;
  /** Width in pixels */
  width?: number;
  /** Accessible loading label */
  label?: string;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

// Deterministic widths so server and client markup match.
const LINE_WIDTHS = ["100%", "100%", "62%", "88%", "74%", "94%", "56%"];

export function SkeletonShimmer({
  lines = 3,
  avatar = true,
  avatarShape = "rounded",
  card = true,
  speed = 1.6,
  baseColor,
  shimmerColor = "rgba(255, 255, 255, 0.09)",
  radius = 6,
  width = 360,
  label = "Loading content",
  className = "",
  style,
}: SkeletonShimmerProps) {
  const count = Math.max(0, Math.min(7, Math.round(lines)));
  const widths = Array.from({ length: count }, (_, i) => (i === count - 1 && count > 1 ? "58%" : LINE_WIDTHS[i]));

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={`${styles.root} ${card ? styles.card : ""} ${className}`.trim()}
      style={
        {
          "--mf-sk-speed": `${Math.max(0.4, speed)}s`,
          "--mf-sk-shine": shimmerColor,
          "--mf-sk-radius": `${radius}px`,
          "--mf-sk-width": `${width}px`,
          ...(baseColor ? { "--mf-sk-base": baseColor } : null),
          ...style,
        } as React.CSSProperties
      }
    >
      {avatar && (
        <div className={styles.head} aria-hidden="true">
          <span className={`${styles.bar} ${styles.avatar} ${avatarShape === "circle" ? styles.circle : ""}`.trim()} />
          <span className={styles.titles}>
            <span className={styles.bar} style={{ width: "72%" }} />
            <span className={styles.bar} style={{ width: "44%" }} />
          </span>
        </div>
      )}
      {count > 0 && (
        <div className={styles.body} aria-hidden="true">
          {widths.map((w, i) => (
            <span key={i} className={styles.bar} style={{ width: w }} />
          ))}
        </div>
      )}
    </div>
  );
}
