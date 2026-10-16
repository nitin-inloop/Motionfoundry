"use client";

import * as React from "react";
import styles from "../styles/constellation-card.module.css";

export interface ConstellationCardProps {
  /** Card heading */
  title?: string;
  /** Card description */
  description?: string;
  /** Number of constellation vertices (capped at 48) */
  nodeCount?: number;
  /** Maximum distance in pixels for connecting lines */
  linkDistance?: number;
  /** Drift velocity multiplier */
  nodeSpeed?: number;
  /** Optional children */
  children?: React.ReactNode;
  /** Optional className */
  className?: string;
}

export function ConstellationCard({
  title = "Distributed Telemetry Mesh",
  description = "Capped node network responds to pointer coordinates while maintaining sub-millisecond frame budgets.",
  nodeCount = 24,
  linkDistance = 88,
  nodeSpeed = 0.4,
  children,
  className = "",
}: ConstellationCardProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const pointerRef = React.useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let rafId = 0;
    const safeCount = Math.min(Math.max(nodeCount, 8), 48);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();

    const nodes = Array.from({ length: safeCount }, (_, i) => ({
      x: ((i * 67) % 100) * 0.01 * (canvas.width || 360),
      y: ((i * 43) % 100) * 0.01 * (canvas.height || 200),
      vx: ((((i * 31) % 9) - 4) || 1) * 0.14 * nodeSpeed,
      vy: ((((i * 59) % 9) - 4) || -1) * 0.14 * nodeSpeed,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (!prefersReduced) {
          a.x += a.vx;
          a.y += a.vy;
          if (a.x < 0 || a.x > canvas.width) a.vx *= -1;
          if (a.y < 0 || a.y > canvas.height) a.vy *= -1;
        }
        ctx.beginPath();
        ctx.arc(a.x, a.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(244, 244, 246, 0.65)";
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < linkDistance) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(228, 228, 231, ${(1 - dist / linkDistance) * 0.2})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        if (pointerRef.current.x !== null && pointerRef.current.y !== null) {
          const pDist = Math.hypot(a.x - pointerRef.current.x, a.y - pointerRef.current.y);
          if (pDist < linkDistance * 1.3) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(pointerRef.current.x, pointerRef.current.y);
            ctx.strokeStyle = `rgba(244, 244, 246, ${(1 - pDist / (linkDistance * 1.3)) * 0.42})`;
            ctx.stroke();
          }
        }
      }

      if (!prefersReduced) {
        rafId = window.requestAnimationFrame(draw);
      }
    };

    draw();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(rafId);
    };
  }, [nodeCount, linkDistance, nodeSpeed]);

  return (
    <div
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        pointerRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }}
      onPointerLeave={() => {
        pointerRef.current = { x: null, y: null };
      }}
      className={`${styles.card} ${className}`.trim()}
    >
      <canvas ref={canvasRef} aria-hidden="true" className={styles.canvas} />
      <div className={styles.content}>
        <span className={styles.badge}>Constellation Network</span>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        {children}
      </div>
    </div>
  );
}
