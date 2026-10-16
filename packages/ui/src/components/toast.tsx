"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/toast.module.css";

type ToastKind = "default" | "success" | "error" | "loading";
type ToastPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

interface ToastData {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
  action?: boolean;
}

export interface ToastProps {
  /** Corner or edge where toasts stack */
  position?: ToastPosition;
  /** Auto-dismiss duration in milliseconds (0 keeps toasts until dismissed) */
  duration?: number;
  /** Title of the default toast */
  title?: string;
  /** Description of the default toast */
  description?: string;
  /** Label of the action button on the default toast (empty hides it) */
  actionLabel?: string;
  /** Time in ms before the promise toast resolves */
  promiseDelay?: number;
  /** Maximum number of toasts visible in the stack */
  maxVisible?: number;
  /** Gap between toasts when expanded, in pixels */
  gap?: number;
  /** Keep the stack permanently expanded instead of expanding on hover */
  expand?: boolean;
  /** Show the close button on each toast */
  closeButton?: boolean;
  /** Allow dismissing toasts by dragging them sideways */
  swipeToDismiss?: boolean;
  /** Tint success and error toasts with their status colors */
  richColors?: boolean;
  /** Accent color for the loading spinner, action button and focus */
  accentColor?: string;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const THEME_TOKENS = ["--mf-bg", "--mf-fg", "--mf-surface", "--mf-surface-raised", "--mf-muted", "--mf-subtle", "--mf-border", "--mf-border-strong", "--mf-accent"];
const PEEK = 14;

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

const exitVariants = {
  exit: (dir: number) => (dir ? { x: dir * 420, opacity: 0, transition: { duration: 0.2 } } : { opacity: 0, scale: 0.92, transition: { duration: 0.2 } }),
};

function StatusIcon({ kind }: { kind: ToastKind }) {
  if (kind === "default") return null;
  if (kind === "loading") return <span aria-hidden="true" className={styles.spinner} />;
  return (
    <svg aria-hidden="true" className={styles[kind]} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d={kind === "success" ? "m8 12.5 2.8 2.8L16.5 9" : "M9 9l6 6M15 9l-6 6"} />
    </svg>
  );
}

interface ItemProps {
  data: ToastData;
  index: number;
  offset: number;
  frontHeight: number;
  height?: number;
  expanded: boolean;
  hidden: boolean;
  bottom: boolean;
  duration: number;
  closeButton: boolean;
  swipe: boolean;
  actionLabel: string;
  reduce: boolean;
  onHeight: (id: number, h: number) => void;
  onDismiss: (id: number, dir: number) => void;
}

function ToastItem({ data, index, offset, frontHeight, height, expanded, hidden, bottom, duration, closeButton, swipe, actionLabel, reduce, onHeight, onDismiss }: ItemProps) {
  const innerRef = React.useRef<HTMLDivElement>(null);
  const remaining = React.useRef(duration);

  React.useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    onHeight(data.id, el.offsetHeight);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => onHeight(data.id, el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [data.id, onHeight]);

  React.useEffect(() => {
    if (expanded || data.kind === "loading" || duration <= 0) return;
    const start = performance.now();
    const t = setTimeout(() => onDismiss(data.id, 0), Math.max(0, remaining.current));
    return () => {
      clearTimeout(t);
      remaining.current -= performance.now() - start;
    };
  }, [expanded, data.kind, data.id, duration, onDismiss]);

  const sign = bottom ? -1 : 1;
  const front = index === 0;
  const y = sign * (expanded ? offset : index * PEEK);
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 380, damping: 34 };

  return (
    <motion.li
      tabIndex={hidden ? -1 : 0}
      role={data.kind === "error" ? "alert" : undefined}
      aria-hidden={hidden || undefined}
      data-kind={data.kind}
      className={styles.toast}
      style={{ zIndex: 100 - index, pointerEvents: hidden ? "none" : "auto", [bottom ? "bottom" : "top"]: 0 }}
      custom={0}
      variants={exitVariants}
      initial={{ opacity: 0, y: sign * -28, scale: 1 }}
      animate={{
        opacity: hidden ? 0 : 1,
        y,
        scale: expanded || reduce ? 1 : 1 - index * 0.05,
        height: expanded || front ? (height ?? "auto") : frontHeight || "auto",
      }}
      exit="exit"
      transition={{ ...spring, opacity: { duration: 0.2 } }}
      drag={swipe && !hidden ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.6}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 600) onDismiss(data.id, Math.sign(info.offset.x || info.velocity.x));
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && e.target === e.currentTarget) onDismiss(data.id, 0);
      }}
    >
      <motion.div ref={innerRef} className={styles.inner} animate={{ opacity: expanded || front ? 1 : 0 }} transition={{ duration: 0.15 }}>
        <StatusIcon kind={data.kind} />
        <div className={styles.text}>
          <div className={styles.title}>{data.title}</div>
          {data.description && <div className={styles.description}>{data.description}</div>}
        </div>
        {data.action && actionLabel && (
          <button type="button" className={styles.action} onClick={() => onDismiss(data.id, 0)}>
            {actionLabel}
          </button>
        )}
        {closeButton && (
          <button type="button" aria-label="Close notification" className={styles.close} onClick={() => onDismiss(data.id, 0)}>
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </motion.div>
    </motion.li>
  );
}

export function Toast({
  position = "bottom-right",
  duration = 4000,
  title = "Event has been created",
  description = "Sunday, December 03, 2023 at 9:00 AM",
  actionLabel = "Undo",
  promiseDelay = 2000,
  maxVisible = 3,
  gap = 12,
  expand = false,
  closeButton = true,
  swipeToDismiss = true,
  richColors = false,
  accentColor = "#6366f1",
  className = "",
  style,
}: ToastProps) {
  const reduce = !!useReducedMotion();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const nextId = React.useRef(1);
  const swipeDir = React.useRef(0);
  const timers = React.useRef(new Set<ReturnType<typeof setTimeout>>());
  const [mounted, setMounted] = React.useState(false);
  const [toasts, setToasts] = React.useState<ToastData[]>([]);
  const [heights, setHeights] = React.useState<Record<number, number>>({});
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [themeVars, setThemeVars] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    setMounted(true);
    const set = timers.current;
    return () => set.forEach((t) => clearTimeout(t));
  }, []);

  const add = (t: Omit<ToastData, "id">) => {
    const id = nextId.current++;
    setThemeVars(readThemeVars(rootRef.current));
    setToasts((list) => [...list, { ...t, id }].slice(-10));
    return id;
  };

  const dismiss = React.useCallback((id: number, dir: number) => {
    swipeDir.current = dir;
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const onHeight = React.useCallback((id: number, h: number) => setHeights((m) => (m[id] === h ? m : { ...m, [id]: h })), []);

  const fire = (kind: "default" | "success" | "error" | "promise") => {
    if (kind === "default") add({ kind, title, description, action: true });
    else if (kind === "success") add({ kind, title: "Changes saved", description: "Your profile has been updated." });
    else if (kind === "error") add({ kind, title: "Upload failed", description: "The file exceeds the 10 MB limit." });
    else {
      const id = add({ kind: "loading", title: "Deploying to production…", description: "Building and uploading assets" });
      new Promise<number>((resolve) => {
        const t = setTimeout(() => {
          timers.current.delete(t);
          resolve(promiseDelay);
        }, promiseDelay);
        timers.current.add(t);
      }).then((ms) => setToasts((list) => list.map((x) => (x.id === id ? { ...x, kind: "success", title: "Deployment complete", description: `Live in ${(ms / 1000).toFixed(1)}s` } : x))));
    }
  };

  const bottom = position.startsWith("bottom");
  const ordered = [...toasts].reverse();
  const visible = ordered.slice(0, Math.max(1, maxVisible));
  const expanded = expand || hovered || focused;
  const frontHeight = heights[ordered[0]?.id] ?? 0;
  const offsets: number[] = [];
  let acc = 0;
  for (const t of ordered) {
    offsets.push(acc);
    acc += (heights[t.id] ?? 0) + gap;
  }
  const listHeight = visible.length === 0 ? 0 : expanded ? offsets[visible.length - 1] + (heights[visible[visible.length - 1].id] ?? 0) : frontHeight + PEEK * (visible.length - 1);

  return (
    <div ref={rootRef} className={`${styles.root} ${className}`.trim()} style={{ "--mf-toast-accent": accentColor, ...style } as React.CSSProperties}>
      {(["default", "success", "error", "promise"] as const).map((k) => (
        <button key={k} type="button" className={`${styles.trigger} ${k === "default" ? styles.primary : ""}`.trim()} onClick={() => fire(k)}>
          {k === "default" ? "Show toast" : k[0].toUpperCase() + k.slice(1)}
        </button>
      ))}
      {mounted &&
        createPortal(
          <section aria-label="Notifications" className={styles.viewport} data-position={position} data-rich={richColors ? "" : undefined} style={{ ...themeVars, "--mf-toast-accent": accentColor } as React.CSSProperties}>
            <ol
              aria-live="polite"
              aria-relevant="additions text"
              className={styles.list}
              style={{ height: listHeight }}
              onPointerEnter={() => setHovered(true)}
              onPointerLeave={() => setHovered(false)}
              onFocus={() => setFocused(true)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
              }}
            >
              <AnimatePresence custom={swipeDir.current}>
                {ordered.map((t, i) => (
                  <ToastItem
                    key={t.id}
                    data={t}
                    index={i}
                    offset={offsets[i]}
                    frontHeight={frontHeight}
                    height={heights[t.id]}
                    expanded={expanded}
                    hidden={i >= visible.length}
                    bottom={bottom}
                    duration={duration}
                    closeButton={closeButton}
                    swipe={swipeToDismiss}
                    actionLabel={actionLabel}
                    reduce={reduce}
                    onHeight={onHeight}
                    onDismiss={dismiss}
                  />
                ))}
              </AnimatePresence>
            </ol>
          </section>,
          document.body,
        )}
    </div>
  );
}
