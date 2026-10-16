"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/number-stepper.module.css";

export interface NumberStepperProps {
  /** Controlled value */
  value?: number;
  /** Initial value when uncontrolled */
  defaultValue?: number;
  /** Called with the next (clamped) value */
  onValueChange?: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Increment per step (decimals set the display precision) */
  step?: number;
  /** Visible label (also the accessible name) */
  label?: string;
  /** Text appended after the number, e.g. " kg" */
  suffix?: string;
  /** Visual style */
  variant?: "outline" | "soft";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Accent color of the buttons and focus ring */
  accentColor?: string;
  /** Keep stepping while a button is held down */
  holdToRepeat?: boolean;
  /** Disable the control */
  disabled?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

function decimalsOf(n: number): number {
  const s = String(n);
  const i = s.indexOf(".");
  return i === -1 ? 0 : Math.min(6, s.length - i - 1);
}

export function NumberStepper({
  value: valueProp,
  defaultValue = 2,
  onValueChange,
  min = 0,
  max = 12,
  step = 1,
  label = "Guests",
  suffix = "",
  variant = "outline",
  size = "md",
  accentColor = "#6366f1",
  holdToRepeat = true,
  disabled = false,
  className = "",
  style,
}: NumberStepperProps) {
  const reduce = useReducedMotion();
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const inc = step > 0 ? step : 1;
  const precision = decimalsOf(inc);
  const clamp = React.useCallback((n: number) => Math.min(hi, Math.max(lo, Number(n.toFixed(precision)))), [hi, lo, precision]);
  const [inner, setInner] = React.useState(() => clamp(defaultValue));
  const value = valueProp !== undefined ? clamp(valueProp) : inner;
  const [dir, setDir] = React.useState(1);
  const valueRef = React.useRef(value);
  valueRef.current = value;
  const timer = React.useRef<number | undefined>(undefined);
  const labelId = React.useId();

  const set = React.useCallback(
    (next: number) => {
      const v = clamp(next);
      if (v === valueRef.current) return false;
      setDir(v > valueRef.current ? 1 : -1);
      valueRef.current = v;
      if (valueProp === undefined) setInner(v);
      onValueChange?.(v);
      return true;
    },
    [clamp, onValueChange, valueProp],
  );

  const stopRepeat = React.useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  React.useEffect(() => stopRepeat, [stopRepeat]);

  const startRepeat = (sign: 1 | -1) => {
    if (disabled) return;
    set(valueRef.current + sign * inc);
    if (!holdToRepeat) return;
    let delay = 420;
    const tick = () => {
      if (!set(valueRef.current + sign * inc)) return stopRepeat();
      delay = Math.max(40, delay * 0.82);
      timer.current = window.setTimeout(tick, delay);
    };
    timer.current = window.setTimeout(tick, delay);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const big = inc * Math.max(1, Math.round((hi - lo) / inc / 10));
    const map: Record<string, number | undefined> = {
      ArrowUp: value + inc,
      ArrowRight: value + inc,
      ArrowDown: value - inc,
      ArrowLeft: value - inc,
      PageUp: value + big,
      PageDown: value - big,
      Home: lo,
      End: hi,
    };
    const next = map[e.key];
    if (next === undefined) return;
    e.preventDefault();
    set(next);
  };

  const text = value.toFixed(precision);
  const chars = text.split("");
  const bindHold = (sign: 1 | -1) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      startRepeat(sign);
    },
    onPointerUp: stopRepeat,
    onPointerLeave: stopRepeat,
    onPointerCancel: stopRepeat,
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      // Keyboard / assistive-tech activation (detail 0) — pointer presses are handled on pointerdown.
      if (e.detail === 0) set(valueRef.current + sign * inc);
    },
  });

  const roll = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 34 };

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      data-variant={variant}
      data-size={size}
      data-disabled={disabled ? "" : undefined}
      style={{ "--mf-ns-accent": accentColor, ...style } as React.CSSProperties}
    >
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <div className={styles.control}>
        <button type="button" tabIndex={-1} aria-label={`Decrease ${label}`} className={styles.btn} disabled={disabled || value <= lo} {...bindHold(-1)}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
            <path d="M5 12h14" />
          </svg>
        </button>
        <div
          role="spinbutton"
          tabIndex={disabled ? -1 : 0}
          aria-labelledby={labelId}
          aria-valuenow={value}
          aria-valuemin={lo}
          aria-valuemax={hi}
          aria-valuetext={`${text}${suffix}`}
          aria-disabled={disabled || undefined}
          className={styles.display}
          onKeyDown={onKeyDown}
        >
          <span className={styles.digits} aria-hidden="true">
            {chars.map((ch, i) => {
              const place = chars.length - i;
              return (
                <span key={place} className={styles.cell}>
                  <AnimatePresence initial={false} custom={dir} mode="popLayout">
                    <motion.span
                      key={ch}
                      custom={dir}
                      className={styles.digit}
                      variants={{
                        enter: (d: number) => ({ y: reduce ? 0 : `${d * 70}%`, opacity: 0 }),
                        center: { y: "0%", opacity: 1 },
                        exit: (d: number) => ({ y: reduce ? 0 : `${d * -70}%`, opacity: 0 }),
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={roll}
                    >
                      {ch}
                    </motion.span>
                  </AnimatePresence>
                </span>
              );
            })}
            {suffix && <span className={styles.suffix}>{suffix}</span>}
          </span>
        </div>
        <button type="button" tabIndex={-1} aria-label={`Increase ${label}`} className={styles.btn} disabled={disabled || value >= hi} {...bindHold(1)}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
