"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import styles from "../styles/bottom-sheet.module.css";

export interface BottomSheetProps {
  /** Controlled open state */
  open?: boolean;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean;
  /** Called whenever the sheet requests to open or close */
  onOpenChange?: (open: boolean) => void;
  /** Snap heights as fractions of the viewport height (0.1 to 1), e.g. [0.45, 0.9] */
  snapPoints?: number[];
  /** Index of the snap point the sheet opens at */
  defaultSnap?: number;
  /** Called after the sheet settles on a new snap index */
  onSnapChange?: (index: number) => void;
  /** Label of the trigger button */
  triggerLabel?: string;
  /** Sheet title (accessible name) */
  title?: string;
  /** Supporting description under the title */
  description?: string;
  /** Sheet content; defaults to a share sheet */
  children?: React.ReactNode;
  /** Accent color for highlights and focus */
  accentColor?: string;
  /** Backdrop blur in pixels */
  backdropBlur?: number;
  /** Allow closing by dragging down past the lowest snap point or clicking the backdrop */
  dismissible?: boolean;
  /** Maximum sheet width in pixels (centered on wide screens) */
  maxWidth?: number;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const THEME_TOKENS = ["--mf-bg", "--mf-fg", "--mf-surface", "--mf-surface-raised", "--mf-muted", "--mf-subtle", "--mf-border", "--mf-border-strong", "--mf-accent"];
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;
const SPRING = { type: "spring", stiffness: 420, damping: 42, mass: 0.9 } as const;

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

const ACTIONS = [
  { label: "Copy link", d: "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" },
  { label: "Email", d: "M3 6h18v12H3zM3 7l9 6 9-6" },
  { label: "Message", d: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" },
  { label: "Export", d: "M12 3v12M7 8l5-5 5 5M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" },
];
const PEOPLE = [
  { name: "Olivia Martin", mail: "olivia@acme.dev", role: "Owner" },
  { name: "Jackson Lee", mail: "jackson@acme.dev", role: "Can edit" },
  { name: "Isabella Nguyen", mail: "isabella@acme.dev", role: "Can view" },
  { name: "William Kim", mail: "will@acme.dev", role: "Can view" },
];

function DefaultContent() {
  return (
    <>
      <div className={styles.actions}>
        {ACTIONS.map((a) => (
          <button key={a.label} type="button" className={styles.action}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={a.d} />
            </svg>
            {a.label}
          </button>
        ))}
      </div>
      <p className={styles.section}>People with access</p>
      <ul className={styles.people}>
        {PEOPLE.map((p) => (
          <li key={p.mail} className={styles.person}>
            <span aria-hidden="true" className={styles.avatar}>
              {p.name.split(" ").map((s) => s[0]).join("")}
            </span>
            <span className={styles.who}>
              <span className={styles.name}>{p.name}</span>
              <span className={styles.mail}>{p.mail}</span>
            </span>
            <span className={styles.role}>{p.role}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export function BottomSheet({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  snapPoints = [0.45, 0.88],
  defaultSnap = 0,
  onSnapChange,
  triggerLabel = "Share project",
  title = "Share project",
  description = "Anyone with the link can view. Drag the handle or use the arrow keys to resize.",
  children,
  accentColor = "#6366f1",
  backdropBlur = 2,
  dismissible = true,
  maxWidth = 640,
  className = "",
  style,
}: BottomSheetProps) {
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
  const snaps = React.useMemo(() => {
    const s = snapPoints.map((p) => Math.min(1, Math.max(0.1, p))).sort((a, b) => a - b);
    return s.length ? s : [0.5];
  }, [snapPoints]);
  const last = snaps.length - 1;
  const startSnap = Math.min(last, Math.max(0, Math.round(defaultSnap)));
  const [present, setPresent] = React.useState(false);
  const [snap, setSnap] = React.useState(startSnap);
  const [vh, setVh] = React.useState(800);
  const [themeVars, setThemeVars] = React.useState<Record<string, string>>({});
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ y0: number; off0: number; ly: number; lt: number; v: number; moved: boolean } | null>(null);
  const dragged = React.useRef(false);
  const id = React.useId();
  const y = useMotionValue(4000);
  const geo = React.useRef({ low: 0, closed: 1 });
  const offsetFor = (i: number, h = vh) => (snaps[last] - snaps[i]) * h;
  geo.current = { low: offsetFor(0), closed: snaps[last] * vh + 24 };
  const backdrop = useTransform(y, (v) => 1 - Math.min(1, Math.max(0, (v - geo.current.low) / (geo.current.closed - geo.current.low))));
  const setOpenRef = React.useRef(setOpen);
  setOpenRef.current = setOpen;
  const tween = reduce ? { duration: 0 } : SPRING;

  useIsoLayoutEffect(() => {
    if (open) {
      const h = window.innerHeight;
      setThemeVars(readThemeVars(rootRef.current));
      setVh(h);
      setSnap(startSnap);
      setPresent(true);
      if (y.get() > snaps[last] * h) y.set(snaps[last] * h + 24);
      const ctrl = animate(y, (snaps[last] - snaps[startSnap]) * h, tween);
      return () => ctrl.stop();
    }
    if (!present) return;
    const ctrl = animate(y, geo.current.closed, { ...(reduce ? { duration: 0 } : { duration: 0.24, ease: [0.32, 0, 0.67, 0] }), onComplete: () => setPresent(false) });
    return () => ctrl.stop();
  }, [open]);

  const goTo = (i: number) => {
    const k = Math.min(last, Math.max(0, i));
    if (k !== snap) onSnapChange?.(k);
    setSnap(k);
    animate(y, offsetFor(k), tween);
  };

  // Scroll lock, Escape, resize, focus in / restore.
  React.useEffect(() => {
    if (!open) return;
    const body = document.body;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpenRef.current(false);
      }
    };
    const onResize = () => setVh(window.innerHeight);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    const raf = requestAnimationFrame(() => (panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panelRef.current)?.focus());
    const trigger = triggerRef.current;
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      body.style.overflow = prev;
      trigger?.focus();
    };
  }, [open]);

  React.useEffect(() => {
    if (open && !drag.current) y.set(offsetFor(snap));
  }, [vh]);

  const trapFocus = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!nodes.length) return e.preventDefault();
    const [first, end] = [nodes[0], nodes[nodes.length - 1]];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      e.preventDefault();
      end.focus();
    } else if (!e.shiftKey && document.activeElement === end) {
      e.preventDefault();
      first.focus();
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    drag.current = { y0: e.clientY, off0: y.get(), ly: e.clientY, lt: e.timeStamp, v: 0, moved: false };
    dragged.current = false;
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y0;
    if (!d.moved && Math.abs(dy) > 4) {
      d.moved = dragged.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (!d.moved) return;
    let next = d.off0 + dy;
    if (next < 0) next *= 0.25;
    if (!dismissible && next > geo.current.low) next = geo.current.low + (next - geo.current.low) * 0.25;
    y.set(next);
    const dt = Math.max(1, e.timeStamp - d.lt);
    d.v = (e.clientY - d.ly) / dt;
    d.ly = e.clientY;
    d.lt = e.timeStamp;
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved) return;
    const projected = y.get() + d.v * 160;
    if (dismissible && projected > geo.current.low + (geo.current.closed - geo.current.low) * 0.45) return setOpen(false);
    let best = 0;
    snaps.forEach((_, i) => {
      if (Math.abs(offsetFor(i) - projected) < Math.abs(offsetFor(best) - projected)) best = i;
    });
    goTo(best);
  };

  const onHandleKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowUp" || e.key === "End") {
      e.preventDefault();
      goTo(e.key === "End" ? last : snap + 1);
    } else if (e.key === "ArrowDown" || e.key === "Home") {
      e.preventDefault();
      if (e.key === "ArrowDown" && snap === 0 && dismissible) setOpen(false);
      else goTo(e.key === "Home" ? 0 : snap - 1);
    }
  };

  const expanded = snap === last;

  return (
    <div ref={rootRef} className={`${styles.root} ${className}`.trim()} style={{ "--mf-bs-accent": accentColor, ...style } as React.CSSProperties}>
      <button ref={triggerRef} type="button" aria-haspopup="dialog" aria-expanded={open} className={styles.trigger} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>
      {present &&
        createPortal(
          <div className={styles.layer} style={{ ...themeVars, "--mf-bs-accent": accentColor, "--mf-bs-blur": `${Math.max(0, backdropBlur)}px`, "--mf-bs-max-w": `${maxWidth}px` } as React.CSSProperties}>
            <motion.div aria-hidden="true" className={styles.backdrop} style={{ opacity: backdrop }} onPointerDown={() => dismissible && setOpen(false)} />
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${id}-title`}
              aria-describedby={description ? `${id}-desc` : undefined}
              tabIndex={-1}
              className={styles.panel}
              style={{ y, height: snaps[last] * vh, paddingBottom: offsetFor(snap) }}
              onKeyDown={trapFocus}
            >
              <div className={styles.grab} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
                <button
                  type="button"
                  className={styles.handle}
                  aria-label={expanded ? "Collapse sheet" : "Expand sheet"}
                  aria-keyshortcuts="ArrowUp ArrowDown"
                  onKeyDown={onHandleKey}
                  onClick={() => {
                    if (dragged.current) return;
                    goTo(expanded ? 0 : last);
                  }}
                >
                  <span aria-hidden="true" className={styles.bar} />
                </button>
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
                <button type="button" aria-label="Close" className={styles.close} onClick={() => setOpen(false)}>
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className={styles.body}>
                {children ?? <DefaultContent />}
              </div>
            </motion.div>
          </div>,
          document.body,
        )}
    </div>
  );
}
