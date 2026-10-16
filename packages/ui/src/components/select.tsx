"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/select.module.css";

export interface SelectOption {
  /** Unique value */
  value: string;
  /** Visible label (defaults to the value) */
  label?: string;
  /** Disable this option */
  disabled?: boolean;
}

export interface SelectProps {
  /** Options as plain strings or option objects */
  options?: Array<string | SelectOption>;
  /** Controlled selected value */
  value?: string;
  /** Initial selected value when uncontrolled */
  defaultValue?: string;
  /** Called with the newly selected value */
  onValueChange?: (value: string) => void;
  /** Controlled open state of the listbox */
  open?: boolean;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean;
  /** Called when the listbox requests to open or close */
  onOpenChange?: (open: boolean) => void;
  /** Visible field label (accessible name) */
  label?: string;
  /** Text shown when nothing is selected */
  placeholder?: string;
  /** Preferred side of the popover (flips when there is no room) */
  side?: "bottom" | "top";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Trigger width in pixels */
  width?: number;
  /** Accent color for the check mark and focus ring */
  accentColor?: string;
  /** Disable the select */
  disabled?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_OPTIONS = ["Apple", "Banana", "Blueberry", "Cherry", "Grapes", "Mango", "Pineapple", "Strawberry"];
const THEME_TOKENS = ["--mf-bg", "--mf-fg", "--mf-surface", "--mf-surface-raised", "--mf-muted", "--mf-subtle", "--mf-border", "--mf-border-strong", "--mf-accent"];
const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;
const LIST_MAX = 264;

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

export function Select({
  options = DEFAULT_OPTIONS,
  value: valueProp,
  defaultValue,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  label = "Favorite fruit",
  placeholder = "Select a fruit…",
  side = "bottom",
  size = "md",
  width = 240,
  accentColor = "#6366f1",
  disabled = false,
  className = "",
  style,
}: SelectProps) {
  const reduce = useReducedMotion();
  const id = React.useId();
  const items = React.useMemo(() => options.map((o) => (typeof o === "string" ? { value: o, label: o } : { ...o, label: o.label ?? o.value })), [options]);
  const [innerValue, setInnerValue] = React.useState(defaultValue);
  const [innerOpen, setInnerOpen] = React.useState(defaultOpen);
  const value = valueProp !== undefined ? valueProp : innerValue;
  const open = !disabled && (openProp !== undefined ? openProp : innerOpen);
  const [active, setActive] = React.useState(-1);
  const [mounted, setMounted] = React.useState(false);
  const [pos, setPos] = React.useState<React.CSSProperties>({});
  const [placed, setPlaced] = React.useState<"bottom" | "top">(side);
  const [themeVars, setThemeVars] = React.useState<Record<string, string>>({});
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const typed = React.useRef({ text: "", time: 0 });
  const selectedIndex = items.findIndex((o) => o.value === value);
  const selected = items[selectedIndex];

  React.useEffect(() => setMounted(true), []);

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInnerOpen(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  const commit = (i: number) => {
    const o = items[i];
    if (!o || o.disabled) return;
    if (valueProp === undefined) setInnerValue(o.value);
    if (o.value !== value) onValueChange?.(o.value);
  };

  const step = (from: number, dir: 1 | -1, count = 1) => {
    let result = from;
    let moved = 0;
    for (let i = from + dir; i >= 0 && i < items.length; i += dir) {
      if (items[i].disabled) continue;
      result = i;
      if (++moved >= count) break;
    }
    return result;
  };
  const edge = (dir: 1 | -1) => step(dir === 1 ? -1 : items.length, dir);

  // Measured placement with viewport collision flip; follows scroll/resize.
  const place = React.useCallback(() => {
    const t = triggerRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    const h = Math.min(LIST_MAX, items.length * 36 + 10);
    const below = window.innerHeight - r.bottom;
    const above = r.top;
    const s = side === "bottom" ? (below < h + 12 && above > below ? "top" : "bottom") : above < h + 12 && below > above ? "bottom" : "top";
    setPlaced(s);
    setPos(s === "bottom" ? { left: r.left, width: r.width, top: r.bottom + 6 } : { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 6 });
  }, [items.length, side]);

  useIsoLayoutEffect(() => {
    if (!open) return;
    setThemeVars(readThemeVars(triggerRef.current));
    place();
    setActive((a) => (a >= 0 ? a : selectedIndex >= 0 ? selectedIndex : edge(1)));
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !listRef.current?.contains(target)) setOpen(false);
    };
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, place, setOpen]);

  React.useEffect(() => {
    if (!open) setActive(-1);
    else listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const typeahead = (ch: string) => {
    const now = performance.now();
    const t = typed.current;
    t.text = now - t.time > 600 ? ch : t.text + ch;
    t.time = now;
    const q = t.text.toLowerCase();
    const start = active >= 0 ? active : selectedIndex;
    const n = items.length;
    const ordered = items.map((_, k) => (((start + (t.text.length === 1 ? 1 : 0) + k) % n) + n) % n);
    const hit = ordered.find((k) => !items[k].disabled && items[k].label.toLowerCase().startsWith(q));
    if (hit !== undefined) setActive(hit);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const k = e.key;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(k)) {
        e.preventDefault();
        setOpen(true);
      } else if (k === "Home" || k === "End") {
        e.preventDefault();
        setActive(edge(k === "Home" ? 1 : -1));
        setOpen(true);
      } else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setOpen(true);
        typeahead(k);
      }
      return;
    }
    if (k === "ArrowDown" || k === "ArrowUp") {
      e.preventDefault();
      if (e.altKey && k === "ArrowUp") {
        commit(active);
        setOpen(false);
      } else setActive((a) => step(a, k === "ArrowDown" ? 1 : -1));
    } else if (k === "PageDown" || k === "PageUp") {
      e.preventDefault();
      setActive((a) => step(a, k === "PageDown" ? 1 : -1, 6));
    } else if (k === "Home" || k === "End") {
      e.preventDefault();
      setActive(edge(k === "Home" ? 1 : -1));
    } else if (k === "Enter" || (k === " " && performance.now() - typed.current.time > 600)) {
      e.preventDefault();
      commit(active);
      setOpen(false);
    } else if (k === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (k === "Tab") {
      commit(active);
      setOpen(false);
    } else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      typeahead(k);
    }
  };

  const listId = `${id}-list`;
  const optId = (i: number) => `${id}-opt-${i}`;
  const fromTop = placed === "bottom";

  return (
    <div className={`${styles.root} ${styles[size] ?? ""} ${className}`.trim()} style={{ "--mf-sel-accent": accentColor, "--mf-sel-w": `${width}px`, ...style } as React.CSSProperties}>
      {label && (
        <label id={`${id}-label`} htmlFor={`${id}-trigger`} className={styles.label}>
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        id={`${id}-trigger`}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={label ? `${id}-label ${id}-trigger` : undefined}
        aria-activedescendant={open && active >= 0 ? optId(active) : undefined}
        disabled={disabled}
        className={styles.trigger}
        data-placeholder={selected ? undefined : ""}
        onClick={() => setOpen(!open)}
        onKeyDown={onKeyDown}
      >
        <span className={styles.value}>{selected ? selected.label : placeholder}</span>
        <motion.svg aria-hidden="true" className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: reduce ? 0 : 0.2 }}>
          <path d="m6 9 6 6 6-6" />
        </motion.svg>
      </button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.ul
                ref={listRef}
                id={listId}
                role="listbox"
                aria-labelledby={label ? `${id}-label` : undefined}
                tabIndex={-1}
                className={`${styles.list} ${styles[size] ?? ""}`.trim()}
                style={{ ...themeVars, ...pos, "--mf-sel-accent": accentColor, transformOrigin: fromTop ? "top center" : "bottom center" } as React.CSSProperties}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: fromTop ? -6 : 6 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: fromTop ? -4 : 4 }}
                transition={{ duration: reduce ? 0.08 : 0.16, ease: [0.16, 1, 0.3, 1] }}
                onPointerDown={(e) => e.preventDefault()}
              >
                {items.map((o, i) => {
                  const isSel = o.value === value;
                  return (
                    <li
                      key={o.value}
                      id={optId(i)}
                      role="option"
                      aria-selected={isSel}
                      aria-disabled={o.disabled || undefined}
                      data-index={i}
                      data-active={i === active ? "" : undefined}
                      className={styles.option}
                      onPointerMove={() => !o.disabled && active !== i && setActive(i)}
                      onClick={() => {
                        if (o.disabled) return;
                        commit(i);
                        setOpen(false);
                        triggerRef.current?.focus();
                      }}
                    >
                      <span className={styles.optionLabel}>{o.label}</span>
                      {isSel && (
                        <svg aria-hidden="true" className={styles.check} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25, delay: 0.06 }} />
                        </svg>
                      )}
                    </li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
