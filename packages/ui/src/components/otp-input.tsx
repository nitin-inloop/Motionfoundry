"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/otp-input.module.css";

export interface OtpInputProps {
  /** Number of characters in the code */
  length?: number;
  /** Controlled value */
  value?: string;
  /** Initial value when uncontrolled */
  defaultValue?: string;
  /** Called with the sanitized value on every change */
  onValueChange?: (value: string) => void;
  /** Called once every slot is filled */
  onComplete?: (value: string) => void;
  /** Accepted characters */
  mode?: "numeric" | "alphanumeric";
  /** Insert a separator after every N slots (0 disables) */
  groupSize?: number;
  /** Render dots instead of the typed characters */
  mask?: boolean;
  /** Visible label above the slots (also the accessible name) */
  label?: string;
  /** Slot size preset */
  size?: "sm" | "md" | "lg";
  /** Accent color of the active slot, caret and completion glow */
  accentColor?: string;
  /** Show the error state */
  invalid?: boolean;
  /** Disable the field */
  disabled?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

function sanitize(raw: string, mode: "numeric" | "alphanumeric", length: number): string {
  const clean = mode === "numeric" ? raw.replace(/\D/g, "") : raw.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return clean.slice(0, length);
}

export function OtpInput({
  length = 6,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onComplete,
  mode = "numeric",
  groupSize = 3,
  mask = false,
  label = "Verification code",
  size = "md",
  accentColor = "#6366f1",
  invalid = false,
  disabled = false,
  className = "",
  style,
}: OtpInputProps) {
  const reduce = useReducedMotion();
  const count = Math.max(1, Math.min(12, Math.round(length)));
  const [inner, setInner] = React.useState(() => sanitize(defaultValue, mode, count));
  const controlled = valueProp !== undefined;
  const value = controlled ? sanitize(valueProp, mode, count) : inner;
  const [focused, setFocused] = React.useState(false);
  const [cursor, setCursor] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const id = React.useId();
  const complete = value.length === count;
  const active = Math.min(cursor, value.length, count - 1);

  const commit = (raw: string) => {
    const next = sanitize(raw, mode, count);
    if (next === value) return;
    if (!controlled) setInner(next);
    onValueChange?.(next);
    if (next.length === count) onComplete?.(next);
  };

  const syncCursor = () => {
    const el = inputRef.current;
    if (el) setCursor(el.selectionStart ?? el.value.length);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const pos = e.key === "Home" ? 0 : e.key === "End" ? value.length : Math.max(0, Math.min(value.length, active + (e.key === "ArrowLeft" ? -1 : 1)));
      el.setSelectionRange(pos, pos);
      setCursor(pos);
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && el.selectionStart === el.selectionEnd && active < value.length) {
      // Typing over an existing slot replaces it and advances.
      e.preventDefault();
      const ch = sanitize(e.key, mode, 1);
      if (!ch) return;
      commit(value.slice(0, active) + ch + value.slice(active + 1));
      const pos = Math.min(active + 1, count);
      requestAnimationFrame(() => el.setSelectionRange(pos, pos));
      setCursor(pos);
    } else if (e.key === "Backspace" && el.selectionStart === el.selectionEnd && active < value.length && value.length === count) {
      // On a full code, Backspace clears the highlighted slot and everything after it.
      e.preventDefault();
      commit(value.slice(0, active));
      setCursor(active);
    }
  };

  const groups = groupSize > 0 && groupSize < count ? groupSize : 0;
  const pop = reduce ? { duration: 0.08 } : { type: "spring" as const, stiffness: 600, damping: 28 };

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      data-size={size}
      data-invalid={invalid ? "" : undefined}
      data-complete={complete && !invalid ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      style={{ "--mf-otp-accent": accentColor, ...style } as React.CSSProperties}
    >
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <span id={`${id}-hint`} className={styles.srOnly}>
        {`${count} ${mode === "numeric" ? "digits" : "characters"}`}
      </span>
      <div className={styles.slots}>
        <input
          ref={inputRef}
          id={id}
          className={styles.input}
          value={value}
          maxLength={count}
          disabled={disabled}
          inputMode={mode === "numeric" ? "numeric" : "text"}
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={invalid || undefined}
          aria-describedby={`${id}-hint`}
          onChange={(e) => {
            commit(e.target.value);
            setCursor(sanitize(e.target.value, mode, count).length);
          }}
          onSelect={syncCursor}
          onKeyDown={onKeyDown}
          onFocus={() => {
            setFocused(true);
            setCursor(value.length);
          }}
          onBlur={() => setFocused(false)}
        />
        {Array.from({ length: count }, (_, i) => {
          const ch = value[i];
          const isActive = focused && i === active;
          return (
            <React.Fragment key={i}>
              {groups > 0 && i > 0 && i % groups === 0 && <span aria-hidden="true" className={styles.sep} />}
              <div aria-hidden="true" className={styles.slot} data-active={isActive ? "" : undefined} data-filled={ch ? "" : undefined}>
                <AnimatePresence initial={false}>
                  {ch && (
                    <motion.span
                      key={ch + i}
                      className={styles.char}
                      initial={{ opacity: 0, y: reduce ? 0 : 8, scale: reduce ? 1 : 0.6 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: reduce ? 1 : 0.6, transition: { duration: 0.1 } }}
                      transition={pop}
                    >
                      {mask ? "•" : ch}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && !ch && <span className={styles.caret} />}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
