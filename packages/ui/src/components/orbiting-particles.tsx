"use client";

import * as React from "react";
import styles from "../styles/orbiting-particles.module.css";

export interface OrbitingParticlesProps {
  /** Number of orbiting particles */
  particleCount?: number;
  /** Angular speed multiplier */
  orbitSpeed?: number;
  /** Ellipse eccentricity ratio */
  eccentricity?: number;
  /** Particle color */
  particleColor?: string;
  /** Optional center caption */
  label?: string;
  /** Optional className */
  className?: string;
}

export function OrbitingParticles({
  particleCount = 34,
  orbitSpeed = 0.65,
  eccentricity = 0.55,
  particleColor = "#e4e4e7",
  label = "Orbital Depth Particle Field",
  className = "",
}: OrbitingParticlesProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const offsetRef = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let rafId = 0;
    const count = Math.min(Math.max(particleCount, 10), 80);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();

    const particles = Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2,
      radius: 36 + ((i * 19) % 110),
      speed: (0.004 + (i % 5) * 0.0018) * orbitSpeed,
      size: 1.1 + (i % 3) * 0.65,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2 + offsetRef.current.x;
      const cy = canvas.height / 2 + offsetRef.current.y;

      for (const p of particles) {
        if (!prefersReduced) {
          p.angle += p.speed;
        }
        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius * eccentricity;
        const depth = (Math.sin(p.angle) + 1) * 0.5; // 0 (back) to 1 (front)

        ctx.beginPath();
        ctx.arc(x, y, p.size * (0.65 + depth * 0.65), 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.globalAlpha = 0.2 + depth * 0.65;
        ctx.fill();
      }

      if (!prefersReduced) {
        rafId = window.requestAnimationFrame(render);
      }
    };

    render();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(rafId);
    };
  }, [particleCount, orbitSpeed, eccentricity, particleColor]);

  return (
    <div
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        offsetRef.current = {
          x: ((e.clientX - rect.left) / rect.width - 0.5) * 28,
          y: ((e.clientY - rect.top) / rect.height - 0.5) * 18,
        };
      }}
      onPointerLeave={() => {
        offsetRef.current = { x: 0, y: 0 };
      }}
      className={`${styles.stage} ${className}`.trim()}
    >
      <canvas ref={canvasRef} aria-hidden="true" className={styles.canvas} />
      <span className={styles.caption}>{label}</span>
    </div>
  );
}
