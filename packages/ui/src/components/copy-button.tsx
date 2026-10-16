"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/copy-button.module.css";

export interface CopyButtonProps {
  /** Text written to the clipboard */
  text?: string;
  /** Button label before copying */
  label?: string;
  /** Button label after a successful copy */
  copiedLabel?: string;
  /** Milliseconds before the button resets to its idle state */
  resetDelay?: number;
  /** Visual style */
  variant?: "default" | "outline" | "ghost";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Render the text in a code field beside the button */
  showValue?: boolean;
  /** Hide the visible label and show only the morphing icon */
  iconOnly?: boolean;
  /** Color of the check mark and copied state */
  accentColor?: string;
  /** Disable the button */
  disabled?: boolean;
  /** Called after the text has been copied */
  onCopy?: (text: string) => void;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function CopyButton({
  text = "npx motionfoundry add copy-button",
  label = "Copy",
  copiedLabel = "Copied",
  resetDelay = 2000,
  variant = "outline",
  size = "md",
  showValue = true,
  iconOnly = false,
  accentColor = "#22c55e",
  disabled = false,
  onCopy,
  className = "",
  style,
}: CopyButtonProps) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    if (disabled) return;
    const ok = await writeClipboard(text);
    if (!ok) return;
    setCopied(true);
    onCopy?.(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), Math.max(300, resetDelay));
  };

  const spring = reduce ? { duration: 0.1 } : { type: "spring" as const, stiffness: 520, damping: 28 };
  const iconMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, scale: 0.4, rotate: -45 }, animate: { opacity: 1, scale: 1, rotate: 0 }, exit: { opacity: 0, scale: 0.4, rotate: 45 } };

  return (
    <div
      className={[styles.root, styles[size], showValue ? styles.withValue : "", className].filter(Boolean).join(" ")}
      style={{ "--mf-cb-accent": accentColor, ...style } as React.CSSProperties}
      data-copied={copied || undefined}
    >
      {showValue ? (
        <code className={styles.value} title={text}>
          <span className={styles.prompt} aria-hidden="true">
            $
          </span>
          {text}
        </code>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={copy}
        aria-label={iconOnly || showValue ? (copied ? copiedLabel : `${label}${showValue ? " command" : ""}`) : undefined}
        className={`${styles.button} ${styles[variant]} ${iconOnly ? styles.iconOnly : ""}`.trim()}
      >
        <span className={styles.icon} aria-hidden="true">
          <AnimatePresence initial={false} mode="popLayout">
            {copied ? (
              <motion.svg key="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className={styles.check} {...iconMotion} transition={spring}>
                <motion.path d="M5 12.5l4.5 4.5L19 7" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.28, delay: reduce ? 0 : 0.06 }} />
              </motion.svg>
            ) : (
              <motion.svg key="copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...iconMotion} transition={spring}>
                <rect x="9" y="9" width="12" height="12" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </motion.svg>
            )}
          </AnimatePresence>
        </span>
        {iconOnly ? null : (
          <span className={styles.labelSlot} aria-hidden={showValue || undefined}>
            <span className={styles.sizer} aria-hidden="true">
              {label}
            </span>
            <span className={styles.sizer} aria-hidden="true">
              {copiedLabel}
            </span>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={copied ? "copied" : "idle"}
                className={styles.label}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(2px)" }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(2px)" }}
                transition={{ duration: reduce ? 0.1 : 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {copied ? copiedLabel : label}
              </motion.span>
            </AnimatePresence>
          </span>
        )}
      </button>
      <span className={styles.srOnly} role="status" aria-live="polite">
        {copied ? `${copiedLabel} to clipboard` : ""}
      </span>
    </div>
  );
}
