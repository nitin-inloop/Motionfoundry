"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/alert-dialog.module.css";

export interface AlertDialogProps {
  /** Controlled open state */
  open?: boolean;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean;
  /** Called whenever the dialog requests to open or close */
  onOpenChange?: (open: boolean) => void;
  /** Called when the confirm action is pressed (the dialog then closes) */
  onConfirm?: () => void;
  /** Called when the dialog is dismissed with Cancel or Escape */
  onCancel?: () => void;
  /** Label of the trigger button */
  triggerLabel?: string;
  /** Dialog title (accessible name) */
  title?: string;
  /** Explanation of the consequences (accessible description) */
  description?: string;
  /** Label of the confirm action */
  confirmLabel?: string;
  /** Label of the cancel action (focused by default) */
  cancelLabel?: string;
  /** Destructive styling (red) or neutral styling (accent) for the confirm action */
  variant?: "destructive" | "default";
  /** Accent color used by the default variant */
  accentColor?: string;
  /** Color used by the destructive variant */
  destructiveColor?: string;
  /** Show the warning icon next to the title */
  showIcon?: boolean;
  /** Backdrop blur in pixels */
  backdropBlur?: number;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const THEME_TOKENS = ["--mf-bg", "--mf-fg", "--mf-surface", "--mf-surface-raised", "--mf-muted", "--mf-subtle", "--mf-border", "--mf-border-strong", "--mf-accent"];
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

function readThemeVars(el: Element | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!el) return out;
  const cs = getComputedStyle(el);
  for (const t of THEME_TOKENS) {
    const v = cs.getPropertyValue(t).trim();
    if (v) out[t] = v;
  }
  return out;
}

export function AlertDialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onConfirm,
  onCancel,
  triggerLabel = "Delete account",
  title = "Are you absolutely sure?",
  description = "This action cannot be undone. This will permanently delete your account and remove your data from our servers.",
  confirmLabel = "Yes, delete account",
  cancelLabel = "Cancel",
  variant = "destructive",
  accentColor = "#6366f1",
  destructiveColor = "#ef4444",
  showIcon = true,
  backdropBlur = 4,
  className = "",
  style,
}: AlertDialogProps) {
  const reduce = useReducedMotion();
  const [inner, setInner] = React.useState(defaultOpen);
  const open = openProp !== undefined ? openProp : inner;
  const setOpen = React.useCallback(
    (v: boolean) => {
      if (openProp === undefined) setInner(v);
      onOpenChange?.(v);
    },
    [openProp, onOpenChange],
  );
  const cancelRef = React.useRef(() => {});
  cancelRef.current = () => {
    onCancel?.();
    setOpen(false);
  };
  const [mounted, setMounted] = React.useState(false);
  const [themeVars, setThemeVars] = React.useState<Record<string, string>>({});
  const [nudge, setNudge] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const cancelBtnRef = React.useRef<HTMLButtonElement>(null);
  const wasOpen = React.useRef(false);
  const id = React.useId();
  const tone = variant === "destructive" ? destructiveColor : accentColor;

  React.useEffect(() => setMounted(true), []);
  useIsoLayoutEffect(() => {
    if (open) setThemeVars(readThemeVars(rootRef.current));
  }, [open]);

  React.useEffect(() => {
    if (!nudge) return;
    const t = window.setTimeout(() => setNudge(false), 320);
    return () => window.clearTimeout(t);
  }, [nudge]);

  React.useEffect(() => {
    if (!open) {
      if (wasOpen.current) triggerRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const body = document.body;
    const prev = [body.style.overflow, body.style.paddingRight];
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      cancelRef.current();
    };
    document.addEventListener("keydown", onKey);
    const raf = requestAnimationFrame(() => (cancelBtnRef.current ?? panelRef.current)?.focus());
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      body.style.overflow = prev[0];
      body.style.paddingRight = prev[1];
    };
  }, [open]);

  const trapFocus = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!nodes.length) return e.preventDefault();
    const [first, last] = [nodes[0], nodes[nodes.length - 1]];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <div ref={rootRef} className={`${styles.root} ${className}`.trim()} style={{ "--mf-ad-tone": tone, ...style } as React.CSSProperties}>
      <button ref={triggerRef} type="button" aria-haspopup="dialog" aria-expanded={open} data-variant={variant} className={styles.trigger} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className={styles.layer} style={{ ...themeVars, "--mf-ad-tone": tone, "--mf-ad-blur": `${Math.max(0, backdropBlur)}px` } as React.CSSProperties}>
                <motion.div aria-hidden="true" className={styles.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0.1 : 0.2 }} />
                <div
                  className={styles.center}
                  onPointerDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    e.preventDefault();
                    if (!reduce) setNudge(true);
                    cancelBtnRef.current?.focus();
                  }}
                >
                  <motion.div
                    ref={panelRef}
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby={`${id}-title`}
                    aria-describedby={`${id}-desc`}
                    tabIndex={-1}
                    data-nudge={nudge ? "" : undefined}
                    className={styles.panel}
                    onKeyDown={trapFocus}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }}
                    animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 4 }}
                    transition={reduce ? { duration: 0.1 } : { duration: 0.22, ease }}
                  >
                    <div className={styles.content}>
                      {showIcon && (
                        <span aria-hidden="true" className={styles.icon}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01" />
                          </svg>
                        </span>
                      )}
                      <div className={styles.text}>
                        <h2 id={`${id}-title`} className={styles.title}>
                          {title}
                        </h2>
                        <p id={`${id}-desc`} className={styles.description}>
                          {description}
                        </p>
                      </div>
                    </div>
                    <div className={styles.footer}>
                      <button ref={cancelBtnRef} type="button" className={styles.cancel} onClick={() => cancelRef.current()}>
                        {cancelLabel}
                      </button>
                      <button
                        type="button"
                        className={styles.confirm}
                        onClick={() => {
                          onConfirm?.();
                          setOpen(false);
                        }}
                      >
                        {confirmLabel}
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
