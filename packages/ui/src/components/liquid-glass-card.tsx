"use client";

import * as React from "react";
import styles from "../styles/liquid-glass-card.module.css";

export interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card title */
  title?: string;
  /** Supporting copy */
  description?: string;
  /** Backdrop blur radius in pixels */
  blurPx?: number;
  /** Pointer rim highlight intensity */
  rimIntensity?: number;
  /** Translucent background tint */
  surfaceTint?: string;
}

export function LiquidGlassCard({
  title = "Layered Specular Translucency",
  description = "Combines CSS backdrop-filter blur, pointer-tracked rim illumination, and subtle surface sheen with graceful browser fallbacks.",
  blurPx = 16,
  rimIntensity = 0.26,
  surfaceTint = "rgba(24, 24, 32, 0.72)",
  children,
  className = "",
  ...rest
}: LiquidGlassCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mf-lg-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mf-lg-y", `${e.clientY - rect.top}px`);
    el.style.setProperty("--mf-lg-active", "1");
  };

  const handlePointerLeave = () => {
    cardRef.current?.style.setProperty("--mf-lg-active", "0");
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={
        {
          "--mf-lg-blur": `${blurPx}px`,
          "--mf-lg-rim": rimIntensity,
          "--mf-lg-tint": surfaceTint,
        } as React.CSSProperties
      }
      className={`${styles.card} ${className}`.trim()}
      {...rest}
    >
      <div aria-hidden="true" className={styles.specularSheen} />
      <div aria-hidden="true" className={styles.edgeHighlight} />
      <div className={styles.inner}>
        <span className={styles.eyebrow}>CSS Translucency + Rim Sheen</span>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        {children}
      </div>
    </div>
  );
}
