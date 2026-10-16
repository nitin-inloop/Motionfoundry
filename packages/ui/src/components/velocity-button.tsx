"use client";

import * as React from "react";
import styles from "../styles/velocity-button.module.css";

export interface VelocityButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button label */
  label?: string;
  /** Energy trail color */
  trailColor?: string;
  /** Maximum opacity multiplier (0.15 to 0.85) */
  trailIntensity?: number;
  /** Decay duration in milliseconds */
  decayMs?: number;
}

export function VelocityButton({
  children,
  label = "Execute Edge Deployment",
  trailColor = "#38bdf8",
  trailIntensity = 0.45,
  decayMs = 260,
  className = "",
  ...rest
}: VelocityButtonProps) {
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const lastPoint = React.useRef<{ x: number; y: number; t: number } | null>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();

    let stretch = 1;
    let angle = 0;
    if (lastPoint.current) {
      const dx = x - lastPoint.current.x;
      const dy = y - lastPoint.current.y;
      const dt = Math.max(8, now - lastPoint.current.t);
      const speed = Math.min(2.4, Math.hypot(dx, dy) / dt);
      stretch = 1 + speed * 0.65;
      angle = Math.atan2(dy, dx) * (180 / Math.PI);
    }
    lastPoint.current = { x, y, t: now };

    el.style.setProperty("--mf-vel-x", `${x}px`);
    el.style.setProperty("--mf-vel-y", `${y}px`);
    el.style.setProperty("--mf-vel-stretch", stretch.toFixed(2));
    el.style.setProperty("--mf-vel-angle", `${angle.toFixed(1)}deg`);
    el.style.setProperty("--mf-vel-opacity", String(trailIntensity));
  };

  const handlePointerLeave = () => {
    lastPoint.current = null;
    btnRef.current?.style.setProperty("--mf-vel-opacity", "0");
  };

  return (
    <button
      ref={btnRef}
      type="button"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={
        {
          "--mf-vel-color": trailColor,
          "--mf-vel-decay": `${decayMs}ms`,
        } as React.CSSProperties
      }
      className={`${styles.button} ${className}`.trim()}
      {...rest}
    >
      <span aria-hidden="true" className={styles.energyTrail} />
      <span className={styles.content}>{children ?? label}</span>
    </button>
  );
}
