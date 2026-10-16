"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/floating-input.module.css";

export interface FloatingInputProps {
  /** Controlled value */
  value?: string;
  /** Initial value when uncontrolled */
  defaultValue?: string;
  /** Called with the next value on every edit (and with "" when cleared) */
  onValueChange?: (value: string) => void;
  /** Floating label text (also the accessible name) */
  label?: string;
  /** Native input type */
  type?: "text" | "email" | "url" | "tel" | "search";
  /** Helper text shown under the field */
  helperText?: string;
  /** Error message shown (instead of the helper) when `invalid` is true */
  errorText?: string;
  /** Marks the field invalid: red ring, aria-invalid and the error message */
  invalid?: boolean;
  /** Visual style */
  variant?: "outline" | "filled" | "underline";
  /** Field height preset */
  size?: "sm" | "md" | "lg";
  /** Color of the focus ring and floated label */
  accentColor?: string;
  /** Show a clear (x) button when the field has a value */
  clearable?: boolean;
  /** Disable the field */
  disabled?: boolean;
  /** Mark as required (adds an asterisk and aria-required) */
  required?: boolean;
  /** Native name attribute for forms */
  name?: string;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

export function FloatingInput({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  label = "Email address",
  type = "email",
  helperText = "We'll only use this to send you receipts.",
  errorText = "Please enter a valid email address.",
  invalid = false,
  variant = "outline",
  size = "md",
  accentColor = "#6366f1",
  clearable = true,
  disabled = false,
  required = false,
  name,
  className = "",
  style,
}: FloatingInputProps) {
  const reduce = useReducedMotion();
  const [inner, setInner] = React.useState(defaultValue);
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : inner;
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const id = React.useId();
  const msgId = `${id}-msg`;
  const message = invalid ? errorText : helperText;
  const floated = focused || value.length > 0;

  const setValue = (next: string) => {
    if (!controlled) setInner(next);
    onValueChange?.(next);
  };

  const clear = () => {
    setValue("");
    inputRef.current?.focus();
  };

  const fade = reduce ? { duration: 0.1 } : { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      data-variant={variant}
      data-size={size}
      data-floated={floated ? "" : undefined}
      data-focused={focused ? "" : undefined}
      data-invalid={invalid ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      style={{ "--mf-fi-accent": accentColor, ...style } as React.CSSProperties}
    >
      <div className={styles.field}>
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={type}
          value={value}
          disabled={disabled}
          required={required}
          aria-required={required || undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={message ? msgId : undefined}
          placeholder=" "
          autoComplete="off"
          className={styles.input}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && clearable && value) {
              e.preventDefault();
              clear();
            }
          }}
        />
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && (
            <span aria-hidden="true" className={styles.req}>
              *
            </span>
          )}
        </label>
        <span aria-hidden="true" className={styles.bar} />
        <AnimatePresence initial={false}>
          {clearable && value && !disabled && (
            <motion.button
              key="clear"
              type="button"
              aria-label={`Clear ${label}`}
              className={styles.clear}
              onClick={clear}
              initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
              transition={fade}
            >
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <div className={styles.msgSlot} id={msgId} aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {message && (
            <motion.p
              key={invalid ? "error" : "helper"}
              className={invalid ? `${styles.msg} ${styles.error}` : styles.msg}
              initial={{ opacity: 0, y: reduce ? 0 : -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -4 }}
              transition={fade}
            >
              {invalid && (
                <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16.5v.01" />
                </svg>
              )}
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
