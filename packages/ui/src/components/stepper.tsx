"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/stepper.module.css";

export interface StepperStep {
  /** Step title */
  title: string;
  /** Optional supporting line */
  description?: string;
}

export interface StepperProps {
  /** Steps to render */
  steps?: StepperStep[];
  /** Controlled active step index (0-based; steps.length means all complete) */
  activeStep?: number;
  /** Initial active step when uncontrolled */
  defaultStep?: number;
  /** Called with the next active step index */
  onStepChange?: (step: number) => void;
  /** Layout direction */
  orientation?: "horizontal" | "vertical";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Accent color of completed steps and the connector fill */
  accentColor?: string;
  /** Show step descriptions */
  showDescriptions?: boolean;
  /** Let users jump back to completed steps by clicking them */
  clickable?: boolean;
  /** Show the Back / Next demo buttons */
  showControls?: boolean;
  /** Label of the Next button */
  nextLabel?: string;
  /** Label of the Back button */
  backLabel?: string;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_STEPS: StepperStep[] = [
  { title: "Account", description: "Email and password" },
  { title: "Profile", description: "Name and avatar" },
  { title: "Workspace", description: "Invite your team" },
  { title: "Launch", description: "Review and go live" },
];

export function Stepper({
  steps = DEFAULT_STEPS,
  activeStep,
  defaultStep = 1,
  onStepChange,
  orientation = "horizontal",
  size = "md",
  accentColor = "#6366f1",
  showDescriptions = true,
  clickable = true,
  showControls = true,
  nextLabel = "Next",
  backLabel = "Back",
  className = "",
  style,
}: StepperProps) {
  const reduce = useReducedMotion();
  const [inner, setInner] = React.useState(defaultStep);
  const controlled = activeStep !== undefined;
  const count = steps.length;
  const current = Math.min(count, Math.max(0, Math.round(controlled ? activeStep : inner)));
  const done = current >= count;

  const go = (n: number) => {
    const next = Math.min(count, Math.max(0, n));
    if (next === current) return;
    if (!controlled) setInner(next);
    onStepChange?.(next);
  };

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 30 };

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      data-orientation={orientation}
      data-size={size}
      style={{ "--mf-stp-accent": accentColor, ...style } as React.CSSProperties}
    >
      <ol className={styles.list} aria-label="Progress">
        {steps.map((s, i) => {
          const state = i < current ? "complete" : i === current ? "current" : "upcoming";
          const canClick = clickable && i < current;
          const dotInner = (
            <AnimatePresence initial={false}>
              {state === "complete" ? (
                <motion.svg
                  key="check"
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ scale: reduce ? 1 : 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: reduce ? 1 : 0.4, opacity: 0 }}
                  transition={spring}
                >
                  <motion.path d="M5 12.5 10 17l9-10" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.08 }} />
                </motion.svg>
              ) : (
                <motion.span key="num" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.15 }}>
                  {i + 1}
                </motion.span>
              )}
            </AnimatePresence>
          );
          return (
            <li key={`${s.title}-${i}`} className={styles.step} data-state={state} aria-current={state === "current" ? "step" : undefined}>
              <div className={styles.rail}>
                {canClick ? (
                  <button type="button" className={styles.dot} onClick={() => go(i)} aria-label={`Go back to step ${i + 1}: ${s.title}`}>
                    {dotInner}
                  </button>
                ) : (
                  <span className={styles.dot}>{dotInner}</span>
                )}
                {i < count - 1 && (
                  <span aria-hidden="true" className={styles.line}>
                    <span className={styles.fill} data-filled={i < current ? "" : undefined} />
                  </span>
                )}
              </div>
              <div className={styles.text}>
                <span className={styles.title}>
                  {s.title}
                  <span className={styles.srOnly}>{state === "complete" ? " (completed)" : state === "current" ? " (current step)" : ""}</span>
                </span>
                {showDescriptions && s.description && <span className={styles.desc}>{s.description}</span>}
              </div>
            </li>
          );
        })}
      </ol>
      {showControls && (
        <div className={styles.controls}>
          <p className={styles.status} aria-live="polite">
            {done ? "All steps complete" : `Step ${current + 1} of ${count}: ${steps[current]?.title ?? ""}`}
          </p>
          <div className={styles.buttons}>
            <button type="button" className={styles.secondary} disabled={current === 0} onClick={() => go(current - 1)}>
              {backLabel}
            </button>
            <button type="button" className={styles.primary} onClick={() => go(done ? 0 : current + 1)}>
              {done ? "Start over" : current === count - 1 ? "Finish" : nextLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
