"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/dialog.module.css";

export interface DialogProps {
  /** Controlled open state */
  open?: boolean;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean;
  /** Called whenever the dialog requests to open or close */
  onOpenChange?: (open: boolean) => void;
  /** Label of the trigger button */
  triggerLabel?: string;
  /** Dialog title (used as the accessible name) */
  title?: string;
  /** Supporting description under the title (used as the accessible description) */
  description?: string;
  /** Body content; defaults to a small profile form */
  children?: React.ReactNode;
  /** Label of the primary action */
  confirmLabel?: string;
  /** Label of the secondary (cancel) action */
  cancelLabel?: string;
  /** Called when the primary action is pressed (the dialog then closes) */
  onConfirm?: () => void;
  /** Panel width preset */
  size?: "sm" | "md" | "lg";
  /** Accent color used for the primary action and focus highlights */
  accentColor?: string;
  /** Backdrop blur in pixels */
  backdropBlur?: number;
  /** Close when clicking the backdrop */
  closeOnOutsideClick?: boolean;
  /** Show the X close button in the corner */
  showCloseButton?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const THEME_TOKENS = ["--mf-bg", "--mf-fg", "--mf-surface", "--mf-surface-raised", "--mf-muted", "--mf-subtle", "--mf-border", "--mf-border-strong", "--mf-accent"];
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/** Copies the --mf-* theme variables from an element so a portaled layer matches its surroundings. */
function readThemeVars(el: Element | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!el) return out;
  const cs = getComputedStyle(el);
  for (const token of THEME_TOKENS) {
    const v = cs.getPropertyValue(token).trim();
    if (v) out[token] = v;
  }
  return out;
}

function useControllable(value: boolean | undefined, defaultValue: boolean, onChange?: (v: boolean) => void): [boolean, (v: boolean) => void] {
  const [inner, setInner] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;
  const set = React.useCallback(
    (v: boolean) => {
      if (!controlled) setInner(v);
      onChange?.(v);
    },
    [controlled, onChange],
  );
  return [current, set];
}

function DefaultBody({ fieldId }: { fieldId: string }) {
  return (
    <div className={styles.form}>
      <label className={styles.field} htmlFor={`${fieldId}-name`}>
        <span className={styles.label}>Name</span>
        <input id={`${fieldId}-name`} className={styles.input} defaultValue="Ada Lovelace" />
      </label>
      <label className={styles.field} htmlFor={`${fieldId}-user`}>
        <span className={styles.label}>Username</span>
        <input id={`${fieldId}-user`} className={styles.input} defaultValue="@ada" />
      </label>
    </div>
  );
}

export function Dialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  triggerLabel = "Edit profile",
  title = "Edit profile",
  description = "Make changes to your profile here. Click save when you're done.",
  children,
  confirmLabel = "Save changes",
  cancelLabel = "Cancel",
  onConfirm,
  size = "md",
  accentColor = "#6366f1",
  backdropBlur = 6,
  closeOnOutsideClick = true,
  showCloseButton = true,
  className = "",
  style,
}: DialogProps) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const [mounted, setMounted] = React.useState(false);
  const [themeVars, setThemeVars] = React.useState<Record<string, string>>({});
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const wasOpen = React.useRef(false);
  const baseId = React.useId();
  const titleId = `${baseId}-title`;
  const descId = `${baseId}-desc`;

  React.useEffect(() => setMounted(true), []);

  useIsoLayoutEffect(() => {
    if (open) setThemeVars(readThemeVars(rootRef.current));
  }, [open]);

  // Body scroll lock, Escape and focus restore.
  React.useEffect(() => {
    if (!open) {
      if (wasOpen.current) triggerRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>("[data-autofocus]") ?? panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [open, setOpen]);

  const trapFocus = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (nodes.length === 0) {
      e.preventDefault();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const layerStyle = {
    ...themeVars,
    "--mf-dlg-accent": accentColor,
    "--mf-dlg-blur": `${Math.max(0, backdropBlur)}px`,
  } as React.CSSProperties;

  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <div ref={rootRef} className={`${styles.root} ${className}`.trim()} style={{ "--mf-dlg-accent": accentColor, ...style } as React.CSSProperties}>
      <button ref={triggerRef} type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)} className={styles.trigger}>
        {triggerLabel}
      </button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className={styles.layer} style={layerStyle}>
                <motion.div
                  aria-hidden="true"
                  className={styles.backdrop}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0.1 : 0.2 }}
                />
                <div
                  className={styles.center}
                  onPointerDown={(e) => {
                    if (closeOnOutsideClick && e.target === e.currentTarget) setOpen(false);
                  }}
                >
                  <motion.div
                    ref={panelRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    aria-describedby={description ? descId : undefined}
                    tabIndex={-1}
                    onKeyDown={trapFocus}
                    className={`${styles.panel} ${styles[size] ?? ""}`.trim()}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
                    animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 4 }}
                    transition={reduce ? { duration: 0.1 } : { duration: 0.22, ease }}
                  >
                    <div className={styles.header}>
                      <h2 id={titleId} className={styles.title}>
                        {title}
                      </h2>
                      {description && (
                        <p id={descId} className={styles.description}>
                          {description}
                        </p>
                      )}
                    </div>
                    <div className={styles.body}>{children ?? <DefaultBody fieldId={baseId} />}</div>
                    <div className={styles.footer}>
                      <button type="button" className={styles.secondary} onClick={() => setOpen(false)}>
                        {cancelLabel}
                      </button>
                      <button
                        type="button"
                        className={styles.primary}
                        onClick={() => {
                          onConfirm?.();
                          setOpen(false);
                        }}
                      >
                        {confirmLabel}
                      </button>
                    </div>
                    {showCloseButton && (
                      <button type="button" aria-label="Close" className={styles.close} onClick={() => setOpen(false)}>
                        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    )}
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
