"use client";

import * as React from "react";
import styles from "../styles/infinite-marquee.module.css";

export interface InfiniteMarqueeProps {
  /** String items to display in the marquee */
  items?: string[];
  /** Scroll direction */
  direction?: "left" | "right";
  /** Loop cycle duration in seconds */
  speed?: number;
  /** Gap between items in pixels */
  gap?: number;
  /** Pause animation on pointer hover */
  pauseOnHover?: boolean;
  /** Optional className */
  className?: string;
}

const DEFAULT_ITEMS = [
  "KineticType",
  "GlyphCascade",
  "LiquidGlassCard",
  "HoloTiltCard",
  "MagneticDock",
  "MorphingCommandPalette",
];

export function InfiniteMarquee({
  items = DEFAULT_ITEMS,
  direction = "left",
  speed = 22,
  gap = 14,
  pauseOnHover = true,
  className = "",
}: InfiniteMarqueeProps) {
  const safeItems = items.length > 0 ? items : DEFAULT_ITEMS;
  const styleVars = {
    "--mf-mq-speed": `${speed}s`,
    "--mf-mq-gap": `${gap}px`,
    "--mf-mq-dir": direction === "right" ? "reverse" : "normal",
  } as React.CSSProperties;

  return (
    <div
      style={styleVars}
      className={`${styles.viewport} ${pauseOnHover ? styles.pauseOnHover : ""} ${className}`.trim()}
    >
      <div className={styles.track}>
        {safeItems.map((item, idx) => (
          <span key={`primary-${idx}`} className={styles.pill}>
            {item}
          </span>
        ))}
      </div>
      <div aria-hidden="true" className={styles.track}>
        {safeItems.map((item, idx) => (
          <span key={`clone-${idx}`} className={styles.pill}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
