"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/popover.module.css";

type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

export interface PopoverProps {
  /** Controlled open state */
  open?: boolean;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean;
  /** Called whenever the popover requests to open or close */
  onOpenChange?: (open: boolean) => void;
  /** Preferred side of the trigger (flips when there is no room) */
  side?: Side;
  /** Alignment along the trigger edge */
  align?: Align;
  /** Gap between trigger and panel in pixels */
  sideOffset?: number;
  /** Show the pointing arrow */
  showArrow?: boolean;
  /** Label of the trigger button */
  triggerLabel?: string;
  /** Panel heading (accessible name) */
  title?: string;
  /** Supporting text under the heading */
  description?: string;
  /** Panel content; defaults to a dimensions form */
  children?: React.ReactNode;
  /** Panel width in pixels */
  width?: number;
  /** Accent color for inputs and focus highlights */
  accentColor?: string;
  /** Close when pressing outside the panel */
  closeOnOutsideClick?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const THEME_TOKENS = ["--mf-bg", "--mf-fg", "--mf-surface", "--mf-surface-raised", "--mf-muted", "--mf-subtle", "--mf-border", "--mf-border-strong", "--mf-accent"];
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;
const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };
const MARGIN = 8;

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

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, Math.max(lo, hi)));

interface Placement {
  side: Side;
  left: number;
  top: number;
  arrow: number;
}

/** Measured placement: preferred side, flipped to the opposite side when it does not fit, then clamped into the viewport. */
function computePlacement(r: DOMRect, w: number, h: number, side: Side, align: Align, gap: number): Placement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const room: Record<Side, number> = { bottom: vh - r.bottom, top: r.top, right: vw - r.right, left: r.left };
  const need = (s: Side) => (s === "top" || s === "bottom" ? h : w) + gap + MARGIN;
  const s = room[side] < need(side) && room[OPPOSITE[side]] > room[side] ? OPPOSITE[side] : side;
  if (s === "top" || s === "bottom") {
    const raw = align === "start" ? r.left : align === "end" ? r.right - w : r.left + r.width / 2 - w / 2;
    const left = clamp(raw, MARGIN, vw - w - MARGIN);
    return { side: s, left, top: s === "bottom" ? r.bottom + gap : r.top - gap - h, arrow: clamp(r.left + r.width / 2 - left, 14, w - 14) };
  }
  const raw = align === "start" ? r.top : align === "end" ? r.bottom - h : r.top + r.height / 2 - h / 2;
  const top = clamp(raw, MARGIN, vh - h - MARGIN);
  return { side: s, top, left: s === "right" ? r.right + gap : r.left - gap - w, arrow: clamp(r.top + r.height / 2 - top, 14, h - 14) };
}

const FIELDS = [
  ["Width", "100%"],
  ["Max. width", "300px"],
  ["Height", "25px"],
  ["Max. height", "none"],
];

function DefaultBody({ id }: { id: string }) {
  return (
    <div className={styles.form}>
      {FIELDS.map(([label, value], i) => (
        <div key={label} className={styles.field}>
          <label htmlFor={`${id}-f${i}`} className={styles.label}>
            {label}
          </label>
          <input id={`${id}-f${i}`} className={styles.input} defaultValue={value} />
        </div>
      ))}
    </div>
  );
}

export function Popover({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  side = "bottom",
  align = "center",
  sideOffset = 10,
  showArrow = true,
  triggerLabel = "Open popover",
  title = "Dimensions",
  description = "Set the dimensions for the layer.",
  children,
  width = 320,
  accentColor = "#6366f1",
  closeOnOutsideClick = true,
  className = "",
  style,
}: PopoverProps) {
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
  const [placement, setPlacement] = React.useState<Placement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const id = React.useId();

  React.useEffect(() => setMounted(true), []);

  const place = React.useCallback(() => {
    const t = triggerRef.current;
    const p = panelRef.current;
    if (!t || !p) return;
    setPlacement(computePlacement(t.getBoundingClientRect(), p.offsetWidth, p.offsetHeight, side, align, sideOffset + (showArrow ? 2 : 0)));
  }, [side, align, sideOffset, showArrow]);

  useIsoLayoutEffect(() => {
    if (!open) return;
    setThemeVars(readThemeVars(triggerRef.current));
    place();
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (closeOnOutsideClick && !triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpenRef.current(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpenRef.current(false);
      triggerRef.current?.focus();
    };
    const raf = requestAnimationFrame(() => (panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panelRef.current)?.focus());
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, place, closeOnOutsideClick]);

  const s = placement?.side ?? side;
  const vertical = s === "top" || s === "bottom";
  const shift = 6 * (s === "bottom" || s === "right" ? -1 : 1);
  const origin = placement ? (vertical ? `${placement.arrow}px ${s === "bottom" ? "0" : "100%"}` : `${s === "right" ? "0" : "100%"} ${placement.arrow}px`) : "center";

  return (
    <div className={`${styles.root} ${className}`.trim()} style={{ "--mf-pop-accent": accentColor, ...style } as React.CSSProperties}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${id}-panel` : undefined}
        className={styles.trigger}
        onClick={() => setOpen(!open)}
      >
        {triggerLabel}
      </button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={panelRef}
                id={`${id}-panel`}
                role="dialog"
                aria-labelledby={`${id}-title`}
                aria-describedby={description ? `${id}-desc` : undefined}
                tabIndex={-1}
                data-side={s}
                className={styles.panel}
                style={
                  {
                    ...themeVars,
                    "--mf-pop-accent": accentColor,
                    "--mf-pop-w": `${width}px`,
                    "--mf-pop-arrow": `${placement?.arrow ?? 0}px`,
                    left: placement?.left ?? 0,
                    top: placement?.top ?? 0,
                    visibility: placement ? "visible" : "hidden",
                    transformOrigin: origin,
                  } as React.CSSProperties
                }
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, x: vertical ? 0 : shift, y: vertical ? shift : 0 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, x: vertical ? 0 : shift / 2, y: vertical ? shift / 2 : 0 }}
                transition={{ duration: reduce ? 0.08 : 0.18, ease: [0.16, 1, 0.3, 1] }}
                onBlur={(e) => {
                  const next = e.relatedTarget as Node | null;
                  if (next && !e.currentTarget.contains(next) && !triggerRef.current?.contains(next)) setOpen(false);
                }}
              >
                {showArrow && <span aria-hidden="true" className={styles.arrow} />}
                <div className={styles.header}>
                  <h3 id={`${id}-title`} className={styles.title}>
                    {title}
                  </h3>
                  {description && (
                    <p id={`${id}-desc`} className={styles.description}>
                      {description}
                    </p>
                  )}
                </div>
                {children ?? <DefaultBody id={id} />}
                <button
                  type="button"
                  aria-label="Close"
                  className={styles.close}
                  onClick={() => {
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                >
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
