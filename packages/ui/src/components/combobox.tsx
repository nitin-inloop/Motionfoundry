"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/combobox.module.css";

export interface ComboboxProps {
  /** Options to choose from */
  options?: string[];
  /** Controlled selected value */
  value?: string;
  /** Initial selected value when uncontrolled */
  defaultValue?: string;
  /** Called with the newly selected value ("" when cleared) */
  onValueChange?: (value: string) => void;
  /** Controlled open state of the listbox */
  open?: boolean;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean;
  /** Called when the listbox requests to open or close */
  onOpenChange?: (open: boolean) => void;
  /** Visible field label (accessible name) */
  label?: string;
  /** Input placeholder */
  placeholder?: string;
  /** Message shown when no option matches */
  emptyMessage?: string;
  /** How the query is matched against options */
  matchMode?: "contains" | "startsWith";
  /** Highlight the matched part of each option */
  highlightMatches?: boolean;
  /** Show a clear button when there is text */
  showClear?: boolean;
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Field width in pixels */
  width?: number;
  /** Accent color for highlights, check mark and focus ring */
  accentColor?: string;
  /** Disable the field */
  disabled?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_OPTIONS = ["Next.js", "SvelteKit", "Nuxt", "Remix", "Astro", "SolidStart", "Gatsby", "Qwik City", "Angular", "Vite"];
const THEME_TOKENS = ["--mf-bg", "--mf-fg", "--mf-surface", "--mf-surface-raised", "--mf-muted", "--mf-subtle", "--mf-border", "--mf-border-strong", "--mf-accent"];
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

function Highlight({ text, query, mode, className }: { text: string; query: string; mode: "contains" | "startsWith"; className: string }) {
  const at = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (at < 0 || (mode === "startsWith" && at !== 0)) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className={className}>{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  );
}

export function Combobox({
  options = DEFAULT_OPTIONS,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  label = "Framework",
  placeholder = "Search frameworks…",
  emptyMessage = "No framework found.",
  matchMode = "contains",
  highlightMatches = true,
  showClear = true,
  size = "md",
  width = 280,
  accentColor = "#6366f1",
  disabled = false,
  className = "",
  style,
}: ComboboxProps) {
  const reduce = useReducedMotion();
  const id = React.useId();
  const [innerValue, setInnerValue] = React.useState(defaultValue);
  const [innerOpen, setInnerOpen] = React.useState(defaultOpen);
  const value = valueProp !== undefined ? valueProp : innerValue;
  const open = !disabled && (openProp !== undefined ? openProp : innerOpen);
  const [query, setQuery] = React.useState(value);
  const [filtering, setFiltering] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const [mounted, setMounted] = React.useState(false);
  const [pos, setPos] = React.useState<React.CSSProperties>({});
  const [below, setBelow] = React.useState(true);
  const [themeVars, setThemeVars] = React.useState<Record<string, string>>({});
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const q = filtering ? query.trim() : "";
  const results = React.useMemo(() => {
    const lq = q.toLowerCase();
    return lq ? options.filter((o) => (matchMode === "startsWith" ? o.toLowerCase().startsWith(lq) : o.toLowerCase().includes(lq))) : options;
  }, [options, q, matchMode]);

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => setQuery(value), [value]);

  const setOpen = (next: boolean) => {
    if (next === open) return;
    if (openProp === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };

  const commit = (v: string) => {
    if (valueProp === undefined) setInnerValue(v);
    if (v !== value) onValueChange?.(v);
    setQuery(v);
    setFiltering(false);
    setOpen(false);
  };

  const place = React.useCallback(() => {
    const f = fieldRef.current;
    if (!f) return;
    const r = f.getBoundingClientRect();
    const fitsBelow = window.innerHeight - r.bottom >= 260 || window.innerHeight - r.bottom >= r.top;
    setBelow(fitsBelow);
    setPos(fitsBelow ? { left: r.left, width: r.width, top: r.bottom + 6 } : { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 6 });
  }, []);

  useIsoLayoutEffect(() => {
    if (!open) return;
    setThemeVars(readThemeVars(fieldRef.current));
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  // Keep the active option valid and visible.
  React.useEffect(() => {
    if (!open) return setActive(-1);
    setActive((a) => {
      if (filtering) return results.length ? 0 : -1;
      const sel = results.indexOf(value);
      return a >= 0 && a < results.length ? a : sel;
    });
  }, [open, results, filtering, value]);

  React.useEffect(() => {
    if (active >= 0) listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const n = results.length;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        if (!e.altKey && n) setActive(e.key === "ArrowDown" ? 0 : n - 1);
        return;
      }
      if (n) setActive((a) => (e.key === "ArrowDown" ? (a + 1) % n : a <= 0 ? n - 1 : a - 1));
    } else if (e.key === "Enter") {
      if (open && active >= 0 && results[active]) {
        e.preventDefault();
        commit(results[active]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (open) {
        setOpen(false);
        setQuery(value);
        setFiltering(false);
      } else commit("");
    }
  };

  const listId = `${id}-list`;
  const optId = (i: number) => `${id}-opt-${i}`;

  return (
    <div className={`${styles.root} ${styles[size] ?? ""} ${className}`.trim()} style={{ "--mf-cb-accent": accentColor, "--mf-cb-w": `${width}px`, ...style } as React.CSSProperties}>
      {label && (
        <label htmlFor={`${id}-input`} id={`${id}-label`} className={styles.label}>
          {label}
        </label>
      )}
      <div ref={fieldRef} className={styles.field} data-open={open ? "" : undefined} data-disabled={disabled ? "" : undefined}>
        <svg aria-hidden="true" className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && active >= 0 ? optId(active) : undefined}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          placeholder={placeholder}
          value={query}
          className={styles.input}
          onChange={(e) => {
            setQuery(e.target.value);
            setFiltering(true);
            setOpen(true);
          }}
          onClick={() => setOpen(!open)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (query.trim() === "" && value) return commit("");
            setOpen(false);
            setFiltering(false);
            setQuery(value);
          }}
        />
        <AnimatePresence>
          {showClear && query && !disabled && (
            <motion.button
              type="button"
              aria-label="Clear"
              tabIndex={-1}
              className={styles.clear}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: reduce ? 0 : 0.15 }}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                commit("");
                inputRef.current?.focus();
              }}
            >
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className={`${styles.popover} ${styles[size] ?? ""}`.trim()}
                style={{ ...themeVars, ...pos, "--mf-cb-accent": accentColor, transformOrigin: below ? "top center" : "bottom center" } as React.CSSProperties}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: below ? -6 : 6 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: below ? -4 : 4 }}
                transition={{ duration: reduce ? 0.08 : 0.16, ease: [0.16, 1, 0.3, 1] }}
                onPointerDown={(e) => e.preventDefault()}
              >
                <ul ref={listRef} id={listId} role="listbox" aria-labelledby={label ? `${id}-label` : undefined} aria-label={label ? undefined : "Suggestions"} className={styles.list}>
                  {results.map((o, i) => (
                    <li
                      key={o}
                      id={optId(i)}
                      role="option"
                      aria-selected={o === value}
                      data-index={i}
                      data-active={i === active ? "" : undefined}
                      className={styles.option}
                      onPointerMove={() => active !== i && setActive(i)}
                      onClick={() => commit(o)}
                    >
                      <span className={styles.optionLabel}>{highlightMatches ? <Highlight text={o} query={q} mode={matchMode} className={styles.mark} /> : o}</span>
                      {o === value && (
                        <svg aria-hidden="true" className={styles.check} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      )}
                    </li>
                  ))}
                </ul>
                {results.length === 0 && (
                  <motion.div role="status" className={styles.empty} initial={{ opacity: 0, y: reduce ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.18 }}>
                    {emptyMessage}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
