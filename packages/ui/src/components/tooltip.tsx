"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/tooltip.module.css";

type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

export interface TooltipProps {
  /** Tooltip text for the labelled trigger (or for `children` when provided) */
  content?: string;
  /** Label of the text trigger button in the default demo */
  triggerLabel?: string;
  /** Custom trigger; replaces the demo toolbar and gets the `content` tooltip */
  children?: React.ReactNode;
  /** Preferred side (flips to the opposite side when there is no room) */
  side?: Side;
  /** Alignment along the trigger edge */
  align?: Align;
  /** Hover delay in milliseconds before the tooltip opens */
  delayDuration?: number;
  /** Window in ms after a tooltip closes during which the next one opens instantly */
  skipDelayDuration?: number;
  /** Gap between trigger and tooltip in pixels */
  sideOffset?: number;
  /** Show the pointing arrow */
  showArrow?: boolean;
  /** Visual style of the tooltip bubble */
  variant?: "default" | "subtle" | "accent";
  /** Accent color used by the accent variant and focus highlights */
  accentColor?: string;
  /** Show keyboard shortcut hints in the toolbar tooltips */
  showShortcuts?: boolean;
  /** Disable all tooltips */
  disabled?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

interface Config {
  side: Side;
  align: Align;
  delay: number;
  skip: number;
  offset: number;
  arrow: boolean;
  disabled: boolean;
  layerStyle: React.CSSProperties;
  variantClass: string;
}

const THEME_TOKENS = ["--mf-bg", "--mf-fg", "--mf-surface", "--mf-surface-raised", "--mf-muted", "--mf-subtle", "--mf-border", "--mf-border-strong", "--mf-accent"];
const FOCUSABLE = 'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])';
const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));
const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };
let lastClosedAt = -Infinity;

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

/** Measured placement with a collision flip and cross-axis clamping against the viewport. */
function computePlacement(r: DOMRect, w: number, h: number, side: Side, align: Align, off: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = 8;
  const room: Record<Side, number> = { top: r.top, bottom: vh - r.bottom, left: r.left, right: vw - r.right };
  const need = (side === "top" || side === "bottom" ? h : w) + off + pad;
  const s = room[side] < need && room[OPPOSITE[side]] > room[side] ? OPPOSITE[side] : side;
  const vertical = s === "top" || s === "bottom";
  let top: number;
  let left: number;
  if (vertical) {
    top = s === "top" ? r.top - off - h : r.bottom + off;
    left = align === "start" ? r.left : align === "end" ? r.right - w : r.left + r.width / 2 - w / 2;
    left = clamp(left, pad, vw - w - pad);
  } else {
    left = s === "left" ? r.left - off - w : r.right + off;
    top = align === "start" ? r.top : align === "end" ? r.bottom - h : r.top + r.height / 2 - h / 2;
    top = clamp(top, pad, vh - h - pad);
  }
  const arrow = vertical ? clamp(r.left + r.width / 2 - left, 10, w - 10) : clamp(r.top + r.height / 2 - top, 10, h - 10);
  return { top, left, side: s, arrow };
}

function TooltipAnchor({ content, shortcut, cfg, children }: { content: string; shortcut?: string; cfg: Config; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [pos, setPos] = React.useState<ReturnType<typeof computePlacement> | null>(null);
  const [themeVars, setThemeVars] = React.useState<Record<string, string>>({});
  const wrapRef = React.useRef<HTMLSpanElement>(null);
  const tipRef = React.useRef<HTMLDivElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => {
    setMounted(true);
    return () => clearTimeout(timer.current);
  }, []);

  const show = (instant: boolean) => {
    clearTimeout(timer.current);
    if (cfg.disabled) return;
    if (instant || cfg.delay <= 0 || performance.now() - lastClosedAt < cfg.skip) setOpen(true);
    else timer.current = setTimeout(() => setOpen(true), cfg.delay);
  };
  const hide = (instant: boolean) => {
    clearTimeout(timer.current);
    if (instant) setOpen(false);
    else timer.current = setTimeout(() => setOpen(false), 100);
  };

  const place = React.useCallback(() => {
    const anchor = wrapRef.current;
    const tip = tipRef.current;
    if (!anchor || !tip) return;
    setPos(computePlacement(anchor.getBoundingClientRect(), tip.offsetWidth, tip.offsetHeight, cfg.side, cfg.align, cfg.offset));
  }, [cfg.side, cfg.align, cfg.offset]);

  useIsoLayoutEffect(() => {
    const target = wrapRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? wrapRef.current;
    if (!open) {
      target?.removeAttribute("aria-describedby");
      lastClosedAt = performance.now();
      return;
    }
    setThemeVars(readThemeVars(wrapRef.current));
    target?.setAttribute("aria-describedby", id);
    place();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide(true);
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place, id]);

  const s = pos?.side ?? cfg.side;
  const dist = reduce ? 0 : 4;
  const from = s === "top" ? { y: dist } : s === "bottom" ? { y: -dist } : s === "left" ? { x: dist } : { x: -dist };

  return (
    <span
      ref={wrapRef}
      className={styles.anchor}
      onPointerEnter={(e) => e.pointerType !== "touch" && show(false)}
      onPointerLeave={() => hide(false)}
      onPointerDown={() => hide(true)}
      onFocus={(e) => {
        let visible = true;
        try {
          visible = e.target.matches(":focus-visible");
        } catch {
          visible = true;
        }
        if (visible) show(true);
      }}
      onBlur={() => hide(true)}
    >
      {children}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={tipRef}
                id={id}
                role="tooltip"
                data-side={s}
                className={`${styles.tooltip} ${cfg.variantClass}`.trim()}
                style={{ ...themeVars, ...cfg.layerStyle, top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? "visible" : "hidden", "--mf-tt-arrow": `${pos?.arrow ?? 0}px` } as React.CSSProperties}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.96, ...from }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: reduce ? 1 : 0.98, transition: { duration: 0.1 } }}
                transition={{ duration: reduce ? 0.08 : 0.16, ease: [0.16, 1, 0.3, 1] }}
                onPointerEnter={() => clearTimeout(timer.current)}
                onPointerLeave={() => hide(false)}
              >
                <span>{content}</span>
                {shortcut && <kbd className={styles.kbd}>{shortcut}</kbd>}
                {cfg.arrow && <span aria-hidden="true" className={styles.arrow} />}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </span>
  );
}

const Icon = ({ d }: { d: string }) => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const TOOLBAR = [
  { label: "Bold", shortcut: "Ctrl B", d: "M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" },
  { label: "Italic", shortcut: "Ctrl I", d: "M19 4h-9M14 20H5M15 4 9 20" },
  { label: "Insert link", shortcut: "Ctrl K", d: "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" },
];

export function Tooltip({
  content = "Add to library",
  triggerLabel = "Hover me",
  children,
  side = "top",
  align = "center",
  delayDuration = 400,
  skipDelayDuration = 300,
  sideOffset = 8,
  showArrow = true,
  variant = "default",
  accentColor = "#6366f1",
  showShortcuts = true,
  disabled = false,
  className = "",
  style,
}: TooltipProps) {
  const cfg: Config = {
    side,
    align,
    delay: Math.max(0, delayDuration),
    skip: Math.max(0, skipDelayDuration),
    offset: sideOffset,
    arrow: showArrow,
    disabled,
    layerStyle: { "--mf-tt-accent": accentColor } as React.CSSProperties,
    variantClass: styles[variant] ?? "",
  };

  return (
    <div className={`${styles.root} ${className}`.trim()} style={{ "--mf-tt-accent": accentColor, ...style } as React.CSSProperties}>
      {children !== undefined ? (
        <TooltipAnchor content={content} cfg={cfg}>
          {children}
        </TooltipAnchor>
      ) : (
        <>
          <div role="group" aria-label="Formatting" className={styles.toolbar}>
            {TOOLBAR.map((t) => (
              <TooltipAnchor key={t.label} content={t.label} shortcut={showShortcuts ? t.shortcut : undefined} cfg={cfg}>
                <button type="button" aria-label={t.label} className={styles.iconButton}>
                  <Icon d={t.d} />
                </button>
              </TooltipAnchor>
            ))}
          </div>
          <TooltipAnchor content={content} cfg={cfg}>
            <button type="button" className={styles.button}>
              {triggerLabel}
            </button>
          </TooltipAnchor>
        </>
      )}
    </div>
  );
}
