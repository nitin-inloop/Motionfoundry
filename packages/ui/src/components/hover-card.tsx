"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/hover-card.module.css";

type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

export interface HoverCardProps {
  /** Controlled open state */
  open?: boolean;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean;
  /** Called whenever the card requests to open or close */
  onOpenChange?: (open: boolean) => void;
  /** Delay in ms before the card opens on hover */
  openDelay?: number;
  /** Delay in ms before the card closes after the pointer leaves */
  closeDelay?: number;
  /** Preferred side (flips when there is no room) */
  side?: Side;
  /** Alignment along the trigger edge */
  align?: Align;
  /** Gap between trigger and card in pixels */
  sideOffset?: number;
  /** Profile display name (initials are derived from it) */
  name?: string;
  /** Profile handle, also used as the trigger text */
  handle?: string;
  /** Short profile bio */
  bio?: string;
  /** Number of accounts followed */
  following?: number;
  /** Number of followers */
  followers?: number;
  /** Footer line, e.g. join date */
  joinedLabel?: string;
  /** Link target of the trigger ("#" prevents navigation) */
  href?: string;
  /** Card width in pixels */
  width?: number;
  /** Accent color for the avatar and trigger underline */
  accentColor?: string;
  /** Show the pointing arrow */
  showArrow?: boolean;
  /** Custom card body; replaces the profile content */
  children?: React.ReactNode;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const THEME_TOKENS = ["--mf-bg", "--mf-fg", "--mf-surface", "--mf-surface-raised", "--mf-muted", "--mf-subtle", "--mf-border", "--mf-border-strong", "--mf-accent"];
const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));
const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };

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
  const arrow = vertical ? clamp(r.left + r.width / 2 - left, 14, w - 14) : clamp(r.top + r.height / 2 - top, 14, h - 14);
  return { top, left, side: s, arrow };
}

const compact = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${+(n / 1e3).toFixed(1)}k` : n.toLocaleString("en-US"));

export function HoverCard({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  openDelay = 500,
  closeDelay = 250,
  side = "bottom",
  align = "center",
  sideOffset = 10,
  name = "Ada Lovelace",
  handle = "@ada",
  bio = "Mathematician and writer. Publishing notes on the Analytical Engine and the first published algorithm.",
  following = 184,
  followers = 12800,
  joinedLabel = "Joined December 1842",
  href = "#",
  width = 300,
  accentColor = "#6366f1",
  showArrow = false,
  children,
  className = "",
  style,
}: HoverCardProps) {
  const reduce = useReducedMotion();
  const id = React.useId();
  const [inner, setInner] = React.useState(defaultOpen);
  const open = openProp !== undefined ? openProp : inner;
  const [mounted, setMounted] = React.useState(false);
  const [pos, setPos] = React.useState<ReturnType<typeof computePlacement> | null>(null);
  const [themeVars, setThemeVars] = React.useState<Record<string, string>>({});
  const triggerRef = React.useRef<HTMLAnchorElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => {
    setMounted(true);
    return () => clearTimeout(timer.current);
  }, []);

  const setOpen = React.useCallback(
    (v: boolean) => {
      if (openProp === undefined) setInner(v);
      onOpenChange?.(v);
    },
    [openProp, onOpenChange],
  );

  const schedule = (v: boolean, delay: number) => {
    clearTimeout(timer.current);
    if (v === open) return;
    if (delay <= 0) setOpen(v);
    else timer.current = setTimeout(() => setOpen(v), delay);
  };

  const place = React.useCallback(() => {
    const t = triggerRef.current;
    const c = cardRef.current;
    if (t && c) setPos(computePlacement(t.getBoundingClientRect(), c.offsetWidth, c.offsetHeight, side, align, sideOffset));
  }, [side, align, sideOffset]);

  useIsoLayoutEffect(() => {
    if (!open) return;
    setThemeVars(readThemeVars(triggerRef.current));
    place();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearTimeout(timer.current);
        setOpen(false);
      }
    };
    const ro = typeof ResizeObserver !== "undefined" && cardRef.current ? new ResizeObserver(place) : null;
    if (ro && cardRef.current) ro.observe(cardRef.current);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      ro?.disconnect();
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place, setOpen]);

  const s = pos?.side ?? side;
  const d = reduce ? 0 : 6;
  const from = s === "top" ? { y: d } : s === "bottom" ? { y: -d } : s === "left" ? { x: d } : { x: -d };
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className={`${styles.root} ${className}`.trim()} style={{ "--mf-hc-accent": accentColor, ...style } as React.CSSProperties}>
      <span className={styles.lead}>Notes by</span>
      <a
        ref={triggerRef}
        href={href}
        className={styles.trigger}
        aria-describedby={open ? id : undefined}
        data-state={open ? "open" : "closed"}
        onClick={(e) => href === "#" && e.preventDefault()}
        onPointerEnter={(e) => e.pointerType !== "touch" && schedule(true, openDelay)}
        onPointerLeave={() => schedule(false, closeDelay)}
        onFocus={() => schedule(true, 0)}
        onBlur={() => schedule(false, 0)}
      >
        {handle}
      </a>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={cardRef}
                id={id}
                data-side={s}
                className={styles.card}
                style={{ ...themeVars, top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? "visible" : "hidden", "--mf-hc-accent": accentColor, "--mf-hc-w": `${width}px`, "--mf-hc-arrow": `${pos?.arrow ?? 0}px` } as React.CSSProperties}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.96, ...from }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: reduce ? 1 : 0.97, transition: { duration: 0.12 } }}
                transition={reduce ? { duration: 0.1 } : { type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
                onPointerEnter={() => clearTimeout(timer.current)}
                onPointerLeave={() => schedule(false, closeDelay)}
              >
                {children ?? (
                  <div className={styles.profile}>
                    <span aria-hidden="true" className={styles.avatar}>
                      {initials}
                    </span>
                    <div className={styles.info}>
                      <div className={styles.name}>{name}</div>
                      <div className={styles.handle}>{handle}</div>
                      <p className={styles.bio}>{bio}</p>
                      <div className={styles.stats}>
                        <span>
                          <strong>{compact(following)}</strong> Following
                        </span>
                        <span>
                          <strong>{compact(followers)}</strong> Followers
                        </span>
                      </div>
                      {joinedLabel && (
                        <div className={styles.joined}>
                          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="5" width="18" height="16" rx="2" />
                            <path d="M16 3v4M8 3v4M3 11h18" />
                          </svg>
                          {joinedLabel}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {showArrow && <span aria-hidden="true" className={styles.arrow} />}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
