"use client";

import * as React from "react";
import styles from "../styles/button-group.module.css";

export interface ButtonGroupProps {
  /** Option labels (each label is also its value) */
  options?: string[];
  /** Controlled selected option */
  value?: string;
  /** Initially selected option when uncontrolled (defaults to the second option) */
  defaultValue?: string;
  /** Called with the newly selected option */
  onValueChange?: (value: string) => void;
  /** Accessible name of the group */
  label?: string;
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Active indicator style */
  indicator?: "pill" | "solid" | "underline";
  /** Accent color for the solid / underline indicator */
  accentColor?: string;
  /** Stretch to fill the container, splitting options evenly */
  fullWidth?: boolean;
  /** Disable the whole group */
  disabled?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_OPTIONS = ["Daily", "Weekly", "Monthly", "Yearly"];
const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function ButtonGroup({
  options = DEFAULT_OPTIONS,
  value: valueProp,
  defaultValue,
  onValueChange,
  label = "Reporting period",
  size = "md",
  indicator = "pill",
  accentColor = "#6366f1",
  fullWidth = false,
  disabled = false,
  className = "",
  style,
}: ButtonGroupProps) {
  const items = options.length > 0 ? options : DEFAULT_OPTIONS;
  const [inner, setInner] = React.useState(defaultValue ?? items[Math.min(1, items.length - 1)]);
  const value = valueProp !== undefined ? valueProp : inner;
  const activeIndex = items.indexOf(value);
  const listRef = React.useRef<HTMLDivElement>(null);
  const btnRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [box, setBox] = React.useState<{ x: number; w: number } | null>(null);
  const [animate, setAnimate] = React.useState(false);

  const select = (next: string) => {
    if (disabled || next === value) return;
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  const measure = React.useCallback(() => {
    const el = btnRefs.current[activeIndex];
    setBox(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
  }, [activeIndex]);

  useIsoLayoutEffect(() => {
    measure();
  }, [measure, items.join("|"), size, fullWidth]);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true));
    const ro = typeof ResizeObserver !== "undefined" && listRef.current ? new ResizeObserver(() => measure()) : null;
    if (ro && listRef.current) ro.observe(listRef.current);
    return () => {
      cancelAnimationFrame(id);
      ro?.disconnect();
    };
  }, [measure]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = Math.max(0, btnRefs.current.findIndex((b) => b === document.activeElement));
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (current + 1) % items.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (current - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    btnRefs.current[next]?.focus();
    select(items[next]);
  };

  const rootStyle = {
    "--mf-bgp-accent": accentColor,
    "--mf-bgp-x": box ? `${box.x}px` : "0px",
    "--mf-bgp-w": box ? `${box.w}px` : "0px",
    ...style,
  } as React.CSSProperties;

  return (
    <div
      ref={listRef}
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
      data-indicator={indicator}
      data-animate={animate || undefined}
      className={[styles.root, styles[size], fullWidth ? styles.full : "", className].filter(Boolean).join(" ")}
      style={rootStyle}
    >
      {box ? <span className={styles.indicator} aria-hidden="true" /> : null}
      {items.map((opt, i) => {
        const checked = i === activeIndex;
        const focusable = activeIndex === -1 ? i === 0 : checked;
        return (
          <button
            key={`${opt}-${i}`}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={focusable ? 0 : -1}
            disabled={disabled}
            data-state={checked ? "on" : "off"}
            className={styles.item}
            onClick={() => select(opt)}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
