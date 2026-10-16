"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/toggle-group.module.css";

export interface ToggleGroupItem {
  /** Unique value */
  value: string;
  /** Accessible name (shown as text when there is no icon or `showLabels` is on) */
  label: string;
  /** Optional icon */
  icon?: React.ReactNode;
}

export interface ToggleGroupProps {
  /** Allow one pressed item or many */
  type?: "single" | "multiple";
  /** Built-in item set used when `items` is not provided */
  preset?: "formatting" | "alignment" | "view";
  /** Custom items; overrides `preset` */
  items?: ToggleGroupItem[];
  /** Controlled pressed values */
  value?: string[];
  /** Initially pressed values when uncontrolled (defaults to the first item) */
  defaultValue?: string[];
  /** Called with the next pressed values */
  onValueChange?: (value: string[]) => void;
  /** Accessible name of the group */
  label?: string;
  /** Visual style */
  variant?: "default" | "outline";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Show text labels next to icons */
  showLabels?: boolean;
  /** Accent color of the pressed state */
  accentColor?: string;
  /** Disable the whole group */
  disabled?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

function Glyph({ d }: { d: string }) {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const PRESETS: Record<NonNullable<ToggleGroupProps["preset"]>, ToggleGroupItem[]> = {
  formatting: [
    { value: "bold", label: "Bold", icon: <Glyph d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" /> },
    { value: "italic", label: "Italic", icon: <Glyph d="M19 4h-9M14 20H5M15 4 9 20" /> },
    { value: "underline", label: "Underline", icon: <Glyph d="M6 4v6a6 6 0 0 0 12 0V4M4 20h16" /> },
    { value: "strike", label: "Strikethrough", icon: <Glyph d="M16 6.5C15 5 13.5 4 11.5 4 9 4 7.5 5.5 7.5 7.5c0 4 9 3 9 8 0 2-1.8 3.5-4.5 3.5-2.2 0-4-1-5-2.5M4 12h16" /> },
  ],
  alignment: [
    { value: "left", label: "Align left", icon: <Glyph d="M4 6h16M4 12h10M4 18h14" /> },
    { value: "center", label: "Align center", icon: <Glyph d="M4 6h16M7 12h10M5 18h14" /> },
    { value: "right", label: "Align right", icon: <Glyph d="M4 6h16M10 12h10M6 18h14" /> },
    { value: "justify", label: "Justify", icon: <Glyph d="M4 6h16M4 12h16M4 18h16" /> },
  ],
  view: [
    { value: "grid", label: "Grid", icon: <Glyph d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /> },
    { value: "list", label: "List", icon: <Glyph d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /> },
    { value: "board", label: "Board", icon: <Glyph d="M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z" /> },
  ],
};

export function ToggleGroup({
  type = "multiple",
  preset = "formatting",
  items: itemsProp,
  value: valueProp,
  defaultValue,
  onValueChange,
  label = "Text formatting",
  variant = "default",
  size = "md",
  showLabels = false,
  accentColor = "#6366f1",
  disabled = false,
  className = "",
  style,
}: ToggleGroupProps) {
  const reduce = useReducedMotion();
  const items = itemsProp && itemsProp.length > 0 ? itemsProp : PRESETS[preset] ?? PRESETS.formatting;
  const [inner, setInner] = React.useState<string[]>(defaultValue ?? [items[0].value]);
  const pressed = valueProp ?? inner;
  const firstPressed = items.findIndex((it) => pressed.includes(it.value));
  const [focusIndex, setFocusIndex] = React.useState(Math.max(0, firstPressed));
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const layoutId = React.useId();

  const toggle = (v: string) => {
    if (disabled) return;
    const isOn = pressed.includes(v);
    const next = type === "single" ? (isOn ? [] : [v]) : isOn ? pressed.filter((p) => p !== v) : [...pressed, v];
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const n = items.length;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (focusIndex + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (focusIndex - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    setFocusIndex(next);
    refs.current[next]?.focus();
  };

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 520, damping: 34 };

  return (
    <div
      role="group"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
      className={[styles.root, styles[variant], styles[size], className].filter(Boolean).join(" ")}
      style={{ "--mf-tg-accent": accentColor, ...style } as React.CSSProperties}
    >
      {items.map((it, i) => {
        const on = pressed.includes(it.value);
        const iconOnly = !!it.icon && !showLabels;
        return (
          <button
            key={it.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            aria-pressed={on}
            aria-label={iconOnly ? it.label : undefined}
            title={iconOnly ? it.label : undefined}
            tabIndex={i === Math.min(focusIndex, items.length - 1) ? 0 : -1}
            disabled={disabled}
            data-state={on ? "on" : "off"}
            className={`${styles.item} ${iconOnly ? styles.iconOnly : ""}`.trim()}
            onFocus={() => setFocusIndex(i)}
            onClick={() => toggle(it.value)}
          >
            {type === "single" ? (
              on ? (
                <motion.span layoutId={layoutId} className={styles.fill} aria-hidden="true" transition={spring} />
              ) : null
            ) : (
              <AnimatePresence initial={false}>
                {on ? (
                  <motion.span
                    key="fill"
                    className={styles.fill}
                    aria-hidden="true"
                    initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: reduce ? 1 : 0.8 }}
                    transition={spring}
                  />
                ) : null}
              </AnimatePresence>
            )}
            {it.icon ? <span className={styles.icon}>{it.icon}</span> : null}
            {iconOnly ? null : <span className={styles.text}>{it.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
