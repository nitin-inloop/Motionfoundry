"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/drawer.module.css";

export interface DrawerProps {
  /** Controlled open state */
  open?: boolean;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean;
  /** Called whenever the drawer requests to open or close */
  onOpenChange?: (open: boolean) => void;
  /** Edge of the viewport the drawer slides in from */
  side?: "left" | "right" | "top" | "bottom";
  /** Panel width (left/right) or height (top/bottom) in pixels */
  size?: number;
  /** Label of the trigger button */
  triggerLabel?: string;
  /** Drawer title (accessible name) */
  title?: string;
  /** Supporting description under the title (accessible description) */
  description?: string;
  /** Body content; defaults to a notification settings list */
  children?: React.ReactNode;
  /** Label of the primary action */
  confirmLabel?: string;
  /** Label of the secondary (cancel) action */
  cancelLabel?: string;
  /** Called when the primary action is pressed (the drawer then closes) */
  onConfirm?: () => void;
  /** Accent color for the primary action, switches and focus highlights */
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

const SETTINGS = [
  { label: "Product updates", hint: "New features and improvements", on: true },
  { label: "Security alerts", hint: "Sign-ins from new devices", on: true },
  { label: "Weekly digest", hint: "A summary of your team's activity", on: false },
  { label: "Mentions", hint: "When someone @mentions you", on: true },
];

function DefaultBody({ id }: { id: string }) {
  return (
    <ul className={styles.list}>
      {SETTINGS.map((s, i) => (
        <li key={s.label} className={styles.row}>
          <label className={styles.rowLabel} htmlFor={`${id}-s${i}`}>
            <span className={styles.rowTitle}>{s.label}</span>
            <span className={styles.rowHint}>{s.hint}</span>
          </label>
          <input id={`${id}-s${i}`} type="checkbox" role="switch" className={styles.switch} defaultChecked={s.on} />
        </li>
      ))}
    </ul>
  );
}

export function Drawer({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  side = "right",
  size = 380,
  triggerLabel = "Open settings",
  title = "Notifications",
  description = "Choose what you want to hear about. Changes apply to all your devices.",
  children,
  confirmLabel = "Save preferences",
  cancelLabel = "Cancel",
  onConfirm,
  accentColor = "#6366f1",
  backdropBlur = 4,
  closeOnOutsideClick = true,
  showCloseButton = true,
  className = "",
  style,
}: DrawerProps) {
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
  const setOpenRef = React.useRef(setOpen);
  setOpenRef.current = setOpen;
  const [mounted, setMounted] = React.useState(false);
  const [themeVars, setThemeVars] = React.useState<Record<string, string>>({});
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const wasOpen = React.useRef(false);
  const id = React.useId();

  React.useEffect(() => setMounted(true), []);
  useIsoLayoutEffect(() => {
    if (open) setThemeVars(readThemeVars(rootRef.current));
  }, [open]);

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
      if (e.key === "Escape") {
        e.preventDefault();
        setOpenRef.current(false);
      }
    };
    document.addEventListener("keydown", onKey);
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (panel) (panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel).focus();
    });
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
    if (nodes.length === 0) return e.preventDefault();
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

  const horizontal = side === "left" || side === "right";
  const hidden = horizontal ? { x: side === "left" ? "-100%" : "100%" } : { y: side === "top" ? "-100%" : "100%" };
  const shown = horizontal ? { x: "0%" } : { y: "0%" };

  return (
    <div ref={rootRef} className={`${styles.root} ${className}`.trim()} style={{ "--mf-drw-accent": accentColor, ...style } as React.CSSProperties}>
      <button ref={triggerRef} type="button" aria-haspopup="dialog" aria-expanded={open} className={styles.trigger} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className={styles.layer} style={{ ...themeVars, "--mf-drw-accent": accentColor, "--mf-drw-blur": `${Math.max(0, backdropBlur)}px`, "--mf-drw-size": `${size}px` } as React.CSSProperties}>
                <motion.div
                  aria-hidden="true"
                  className={styles.backdrop}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0.1 : 0.25 }}
                  onPointerDown={() => closeOnOutsideClick && setOpen(false)}
                />
                <motion.div
                  ref={panelRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={`${id}-title`}
                  aria-describedby={description ? `${id}-desc` : undefined}
                  tabIndex={-1}
                  data-side={side}
                  className={styles.panel}
                  onKeyDown={trapFocus}
                  initial={reduce ? { opacity: 0 } : hidden}
                  animate={reduce ? { opacity: 1 } : shown}
                  exit={reduce ? { opacity: 0 } : hidden}
                  transition={reduce ? { duration: 0.1 } : { type: "spring", stiffness: 380, damping: 38, mass: 0.9 }}
                >
                  <div className={styles.header}>
                    <h2 id={`${id}-title`} className={styles.title}>
                      {title}
                    </h2>
                    {description && (
                      <p id={`${id}-desc`} className={styles.description}>
                        {description}
                      </p>
                    )}
                  </div>
                  <div className={styles.body}>{children ?? <DefaultBody id={id} />}</div>
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
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
