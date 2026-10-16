"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import styles from "../styles/holo-tilt-card.module.css";

export interface HoloTiltCardProps {
  /** Card title */
  title?: string;
  /** Supporting subtitle */
  subtitle?: string;
  /** Maximum tilt angle in degrees */
  maxTilt?: number;
  /** Holographic foil opacity (0.05 to 0.5) */
  holoOpacity?: number;
  /** CSS perspective distance in pixels */
  perspective?: number;
  /** Optional children */
  children?: React.ReactNode;
  /** Optional className */
  className?: string;
}

export function HoloTiltCard({
  title = "Holographic Foil Surface",
  subtitle = "Pointer coordinates drive both 3D perspective pitch/roll and spectral diffraction angle.",
  maxTilt = 14,
  holoOpacity = 0.24,
  perspective = 920,
  children,
  className = "",
}: HoloTiltCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const rawRx = useMotionValue(0);
  const rawRy = useMotionValue(0);
  const rotateX = useSpring(rawRx, { stiffness: 240, damping: 22 });
  const rotateY = useSpring(rawRy, { stiffness: 240, damping: 22 });
  const [holoState, setHoloState] = React.useState({ x: 50, y: 50, angle: 125, active: false });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rawRx.set((0.5 - py) * maxTilt * 2);
    rawRy.set((px - 0.5) * maxTilt * 2);
    setHoloState({
      x: px * 100,
      y: py * 100,
      angle: 110 + (px - 0.5) * 90,
      active: true,
    });
  };

  const handlePointerLeave = () => {
    rawRx.set(0);
    rawRy.set(0);
    setHoloState((prev) => ({ ...prev, active: false }));
  };

  return (
    <div style={{ perspective: `${perspective}px` }} className={styles.stage}>
      <motion.div
        ref={ref}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        className={`${styles.card} ${className}`.trim()}
      >
        <div
          aria-hidden="true"
          className={styles.holoLayer}
          style={{
            opacity: holoState.active && !prefersReducedMotion ? holoOpacity : 0.06,
            backgroundImage: `linear-gradient(${holoState.angle}deg, rgba(56,189,248,0.55) 0%, rgba(168,85,247,0.55) 35%, rgba(244,114,182,0.5) 68%, rgba(52,211,153,0.55) 100%)`,
            backgroundPosition: `${holoState.x}% ${holoState.y}%`,
          }}
        />
        <div
          aria-hidden="true"
          className={styles.specularGlare}
          style={{
            opacity: holoState.active && !prefersReducedMotion ? 0.18 : 0,
            background: `radial-gradient(circle at ${holoState.x}% ${holoState.y}%, rgba(255,255,255,0.9), transparent 60%)`,
          }}
        />
        <div className={styles.depthContent}>
          <span className={styles.badge}>3D Holographic Depth</span>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>{subtitle}</p>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
