"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/password-input.module.css";

export interface PasswordInputProps {
  /** Controlled value */
  value?: string;
  /** Initial value when uncontrolled */
  defaultValue?: string;
  /** Called with the next value on every edit */
  onValueChange?: (value: string) => void;
  /** Controlled visibility (true shows the plain text) */
  visible?: boolean;
  /** Initial visibility when uncontrolled */
  defaultVisible?: boolean;
  /** Called when the show/hide toggle is pressed */
  onVisibleChange?: (visible: boolean) => void;
  /** Visible label (also the accessible name) */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum length used by the length rule */
  minLength?: number;
  /** Show the animated strength meter */
  showStrength?: boolean;
  /** Show the rule checklist */
  showRules?: boolean;
  /** Field size preset */
  size?: "sm" | "md" | "lg";
  /** Focus ring and toggle accent color */
  accentColor?: string;
  /** Disable the field */
  disabled?: boolean;
  /** Native name attribute for forms */
  name?: string;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const LEVELS = [
  { label: "Too weak", color: "#ef4444" },
  { label: "Weak", color: "#f97316" },
  { label: "Fair", color: "#eab308" },
  { label: "Good", color: "#84cc16" },
  { label: "Strong", color: "#22c55e" },
] as const;

function getRules(value: string, minLength: number) {
  return [
    { id: "len", text: `At least ${minLength} characters`, met: value.length >= minLength },
    { id: "case", text: "Upper and lower case letters", met: /[a-z]/.test(value) && /[A-Z]/.test(value) },
    { id: "num", text: "At least one number", met: /\d/.test(value) },
    { id: "sym", text: "At least one symbol", met: /[^A-Za-z0-9\s]/.test(value) },
  ];
}

export function PasswordInput({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  visible: visibleProp,
  defaultVisible = false,
  onVisibleChange,
  label = "Password",
  placeholder = "Create a strong password",
  minLength = 8,
  showStrength = true,
  showRules = true,
  size = "md",
  accentColor = "#6366f1",
  disabled = false,
  name,
  className = "",
  style,
}: PasswordInputProps) {
  const reduce = useReducedMotion();
  const [inner, setInner] = React.useState(defaultValue);
  const value = valueProp !== undefined ? valueProp : inner;
  const [innerVisible, setInnerVisible] = React.useState(defaultVisible);
  const visible = visibleProp !== undefined ? visibleProp : innerVisible;
  const id = React.useId();
  const rules = getRules(value, Math.max(1, minLength));
  const metCount = rules.filter((r) => r.met).length;
  const score = value.length === 0 ? 0 : Math.min(4, metCount + (value.length >= minLength + 4 && metCount >= 3 ? 1 : 0));
  const level = LEVELS[score];
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 320, damping: 30 };

  const toggleVisible = () => {
    const next = !visible;
    if (visibleProp === undefined) setInnerVisible(next);
    onVisibleChange?.(next);
  };

  const describedBy = [showStrength ? `${id}-strength` : "", showRules ? `${id}-rules` : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      data-size={size}
      data-disabled={disabled ? "" : undefined}
      style={{ "--mf-pw-accent": accentColor, "--mf-pw-level": level.color, ...style } as React.CSSProperties}
    >
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.field}>
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="new-password"
          spellCheck={false}
          aria-describedby={describedBy}
          className={styles.input}
          onChange={(e) => {
            if (valueProp === undefined) setInner(e.target.value);
            onValueChange?.(e.target.value);
          }}
        />
        <button
          type="button"
          className={styles.toggle}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={id}
          disabled={disabled}
          onClick={toggleVisible}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            <motion.circle cx="12" cy="12" r="3" initial={false} animate={{ scale: visible ? 1 : 0.6, opacity: visible ? 1 : 0.5 }} transition={spring} />
            <motion.path d="M4 4l16 16" initial={false} animate={{ pathLength: visible ? 0 : 1, opacity: visible ? 0 : 1 }} transition={reduce ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }} />
          </svg>
        </button>
      </div>
      {showStrength && (
        <div className={styles.strength}>
          <div className={styles.meter} aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={styles.segment}>
                <motion.span className={styles.fill} initial={false} animate={{ scaleX: score > i ? 1 : 0 }} transition={{ ...spring, delay: reduce ? 0 : i * 0.04 }} />
              </span>
            ))}
          </div>
          <span id={`${id}-strength`} className={styles.levelText} aria-live="polite">
            {value.length === 0 ? "Enter a password" : level.label}
          </span>
        </div>
      )}
      {showRules && (
        <ul id={`${id}-rules`} className={styles.rules}>
          {rules.map((r) => (
            <li key={r.id} className={styles.rule} data-met={r.met ? "" : undefined}>
              <span className={styles.check} aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={false} animate={{ pathLength: r.met ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }} />
                </svg>
              </span>
              {r.text}
              <span className={styles.srOnly}>{r.met ? " (met)" : " (not met)"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
