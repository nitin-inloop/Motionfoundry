"use client";

import * as React from "react";
import styles from "../styles/hold-to-confirm.module.css";

export interface HoldToConfirmProps {
  /** Idle label */
  label?: string;
  /** Label shown while holding */
  holdingLabel?: string;
  /** Label shown once confirmed */
  confirmedLabel?: string;
  /** Milliseconds the button must be held */
  holdDuration?: number;
  /** Milliseconds after confirming before it resets (0 = stay confirmed) */
  resetAfter?: number;
  /** Visual style of the progress */
  fillStyle?: "fill" | "bar";
  /** Visual style of the button */
  variant?: "solid" | "outline";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Color of the progress fill */
  accentColor?: string;
  /** Show the leading icon */
  showIcon?: boolean;
  /** Vibrate on confirm where supported */
  haptics?: boolean;
  /** Disable the button */
  disabled?: boolean;
  /** Called once the hold completes */
  onConfirm?: () => void;
  /** Called when a hold is released early */
  onCancel?: () => void;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

type Phase = "idle" | "holding" | "confirmed";
const RELEASE_MS = 320;

function Glyph({ done }: { done: boolean }) {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={done ? "M5 12.5l4.5 4.5L19 7" : "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"} />
    </svg>
  );
}

export function HoldToConfirm({
  label = "Hold to delete",
  holdingLabel = "Keep holding…",
  confirmedLabel = "Deleted",
  holdDuration = 1500,
  resetAfter = 2200,
  fillStyle = "fill",
  variant = "outline",
  size = "md",
  accentColor = "#ef4444",
  showIcon = true,
  haptics = true,
  disabled = false,
  onConfirm,
  onCancel,
  className = "",
  style,
}: HoldToConfirmProps) {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const progress = React.useRef(0);
  const holding = React.useRef(false);
  const raf = React.useRef(0);
  const last = React.useRef(0);
  const resetTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintId = React.useId();
  const cbs = React.useRef({ onConfirm, onCancel });
  cbs.current = { onConfirm, onCancel };

  const paint = (p: number) => btnRef.current?.style.setProperty("--mf-htc-p", p.toFixed(4));

  const tick = React.useCallback(
    (now: number) => {
      const dt = Math.min(64, now - last.current);
      last.current = now;
      const dur = Math.max(200, holdDuration);
      progress.current = holding.current ? progress.current + dt / dur : progress.current - dt / RELEASE_MS;
      if (progress.current >= 1) {
        progress.current = 1;
        holding.current = false;
        paint(1);
        setPhase("confirmed");
        if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(30);
        cbs.current.onConfirm?.();
        if (resetAfter > 0) {
          resetTimer.current = setTimeout(() => {
            progress.current = 0;
            paint(0);
            setPhase("idle");
          }, resetAfter);
        }
        return;
      }
      if (progress.current <= 0) {
        progress.current = 0;
        paint(0);
        return;
      }
      paint(progress.current);
      raf.current = requestAnimationFrame(tick);
    },
    [holdDuration, resetAfter, haptics],
  );

  const run = () => {
    cancelAnimationFrame(raf.current);
    last.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  };

  const start = () => {
    if (disabled || phase === "confirmed" || holding.current) return;
    holding.current = true;
    setPhase("holding");
    run();
  };

  const release = () => {
    if (!holding.current) return;
    holding.current = false;
    setPhase("idle");
    cbs.current.onCancel?.();
    run();
  };

  React.useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const text = phase === "confirmed" ? confirmedLabel : phase === "holding" ? holdingLabel : label;
  const inner = (
    <>
      {showIcon ? <Glyph done={phase === "confirmed"} /> : null}
      <span>{text}</span>
    </>
  );

  return (
    <div className={`${styles.root} ${className}`.trim()} style={{ "--mf-htc-accent": accentColor, ...style } as React.CSSProperties}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-describedby={hintId}
        aria-disabled={phase === "confirmed" || undefined}
        data-phase={phase}
        data-fill={fillStyle}
        className={[styles.button, styles[variant], styles[size]].filter(Boolean).join(" ")}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          start();
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerMove={(e) => {
          if (!holding.current) return;
          const r = e.currentTarget.getBoundingClientRect();
          if (e.clientX < r.left - 16 || e.clientX > r.right + 16 || e.clientY < r.top - 16 || e.clientY > r.bottom + 16) release();
        }}
        onKeyDown={(e) => {
          if (e.key !== " " && e.key !== "Enter") return;
          e.preventDefault();
          if (!e.repeat) start();
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") release();
        }}
        onBlur={release}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span className={styles.track} aria-hidden="true">
          <span className={styles.fill} />
        </span>
        {[label, holdingLabel, confirmedLabel].map((t, i) => (
          <span key={i} className={`${styles.content} ${styles.sizer}`} aria-hidden="true">
            {showIcon ? <Glyph done={false} /> : null}
            <span>{t}</span>
          </span>
        ))}
        <span className={styles.content}>{inner}</span>
        <span className={styles.overlay} aria-hidden="true">
          {inner}
        </span>
      </button>
      <span id={hintId} className={styles.srOnly}>
        Press and hold, or hold Space or Enter, to confirm.
      </span>
      <span className={styles.srOnly} role="status" aria-live="polite">
        {phase === "confirmed" ? confirmedLabel : ""}
      </span>
    </div>
  );
}
