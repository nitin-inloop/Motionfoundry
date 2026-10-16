"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/loading-button.module.css";

type Phase = "idle" | "loading" | "success";

export interface LoadingButtonProps {
  /** Idle label (ignored when children are provided) */
  label?: string;
  /** Custom idle content */
  children?: React.ReactNode;
  /** Text shown next to the spinner while loading */
  loadingLabel?: string;
  /** Text shown next to the check mark on success */
  successLabel?: string;
  /** Simulated work duration in milliseconds (used when onAction is not provided) */
  duration?: number;
  /** How long the success state is held before returning to idle, in milliseconds */
  successHold?: number;
  /** Disable the button */
  disabled?: boolean;
  /** Click handler, called when a new cycle starts */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Async work that drives the loading state instead of the timer; rejection returns to idle */
  onAction?: () => Promise<unknown>;
  /** Optional className */
  className?: string;
}

function Spinner() {
  return (
    <svg className={styles.spinner} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LoadingButton({
  label = "Deploy to production",
  children,
  loadingLabel = "Deploying",
  successLabel = "Deployed",
  duration = 1600,
  successHold = 1400,
  disabled = false,
  onClick,
  onAction,
  className = "",
}: LoadingButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = React.useState<Phase>("idle");
  const phaseRef = React.useRef<Phase>("idle");
  const timers = React.useRef<number[]>([]);
  const mounted = React.useRef(false);

  React.useEffect(() => {
    mounted.current = true;
    const pending = timers.current;
    return () => {
      mounted.current = false;
      pending.forEach((id) => window.clearTimeout(id));
      pending.length = 0;
    };
  }, []);

  const go = (next: Phase) => {
    if (!mounted.current) return;
    phaseRef.current = next;
    setPhase(next);
  };

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const succeed = () => {
    go("success");
    later(() => go("idle"), successHold);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (phaseRef.current !== "idle" || disabled) return;
    onClick?.(event);
    go("loading");
    if (onAction) {
      onAction().then(succeed, () => go("idle"));
    } else {
      later(succeed, duration);
    }
  };

  const content =
    phase === "loading" ? (
      <>
        <Spinner />
        {loadingLabel}
      </>
    ) : phase === "success" ? (
      <>
        <CheckIcon />
        {successLabel}
      </>
    ) : (
      children ?? label
    );

  return (
    <motion.button
      type="button"
      layout={!prefersReducedMotion}
      disabled={disabled}
      aria-busy={phase === "loading"}
      aria-live="polite"
      onClick={handleClick}
      data-phase={phase}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      className={`${styles.root} ${className}`.trim()}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={phase}
          className={styles.content}
          initial={prefersReducedMotion ? { opacity: 0 } : { y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { y: -18, opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {content}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
