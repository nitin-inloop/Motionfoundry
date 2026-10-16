"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";
import styles from "../styles/parallax-depth-scene.module.css";

export interface ParallaxDepthSceneProps {
  /** Foreground card title */
  title?: string;
  /** Maximum translation in pixels */
  depthMultiplier?: number;
  /** Spring damping */
  damping?: number;
  /** Render deep background grid layer */
  showGridLayer?: boolean;
  /** Optional className */
  className?: string;
}

export function ParallaxDepthScene({
  title = "Tri-Plane Depth Composition",
  depthMultiplier = 22,
  damping = 22,
  showGridLayer = true,
  className = "",
}: ParallaxDepthSceneProps) {
  const prefersReducedMotion = useReducedMotion();
  const normX = useMotionValue(0);
  const normY = useMotionValue(0);

  const smoothX = useSpring(normX, { stiffness: 200, damping });
  const smoothY = useSpring(normY, { stiffness: 200, damping });

  const bgX = useTransform(smoothX, (v) => v * -depthMultiplier * 0.4);
  const bgY = useTransform(smoothY, (v) => v * -depthMultiplier * 0.4);
  const midX = useTransform(smoothX, (v) => v * depthMultiplier * 0.65);
  const midY = useTransform(smoothY, (v) => v * depthMultiplier * 0.65);
  const fgX = useTransform(smoothX, (v) => v * depthMultiplier);
  const fgY = useTransform(smoothY, (v) => v * depthMultiplier);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || e.pointerType === "touch") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    normX.set(nx * 2);
    normY.set(ny * 2);
  };

  const handlePointerLeave = () => {
    normX.set(0);
    normY.set(0);
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`${styles.scene} ${className}`.trim()}
    >
      {showGridLayer && (
        <motion.div
          aria-hidden="true"
          style={{ x: prefersReducedMotion ? 0 : bgX, y: prefersReducedMotion ? 0 : bgY }}
          className={styles.bgLayer}
        />
      )}
      <motion.div
        aria-hidden="true"
        style={{ x: prefersReducedMotion ? 0 : midX, y: prefersReducedMotion ? 0 : midY }}
        className={styles.midLayer}
      >
        <span className={styles.planeLabel}>Z-PLANE // MIDGROUND (0.65x)</span>
      </motion.div>
      <motion.div
        style={{ x: prefersReducedMotion ? 0 : fgX, y: prefersReducedMotion ? 0 : fgY }}
        className={styles.fgLayer}
      >
        <span className={styles.planeLabel}>Z-PLANE // FOREGROUND (1.0x)</span>
        <h4 className={styles.title}>{title}</h4>
      </motion.div>
    </div>
  );
}
