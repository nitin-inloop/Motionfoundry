"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/tabs.module.css";

export interface TabItem {
  /** Unique value of the tab */
  value: string;
  /** Visible label */
  label: string;
  /** Panel content */
  content?: React.ReactNode;
  /** Disable this tab */
  disabled?: boolean;
}

export interface TabsProps {
  /** Tabs to render; defaults to an account settings demo */
  items?: TabItem[];
  /** Controlled selected value */
  value?: string;
  /** Initial selected value when uncontrolled (defaults to the first tab) */
  defaultValue?: string;
  /** Called when the selected tab changes */
  onValueChange?: (value: string) => void;
  /** Indicator style: a sliding underline or a sliding pill */
  variant?: "underline" | "pill";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Accent color of the indicator and focus highlights */
  accentColor?: string;
  /** "automatic" selects on arrow focus, "manual" requires Enter/Space */
  activationMode?: "automatic" | "manual";
  /** Panel transition */
  transition?: "slide" | "fade" | "none";
  /** Stretch tabs to fill the full width */
  fullWidth?: boolean;
  /** Accessible label for the tab list */
  ariaLabel?: string;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowKey}>{k}</span>
      <span className={styles.rowVal}>{v}</span>
    </div>
  );
}

const DEFAULT_ITEMS: TabItem[] = [
  {
    value: "account",
    label: "Account",
    content: (
      <>
        <h3 className={styles.panelTitle}>Account</h3>
        <p className={styles.panelText}>Manage your public profile and how others see you.</p>
        <Row k="Display name" v="Ada Lovelace" />
        <Row k="Username" v="@ada" />
      </>
    ),
  },
  {
    value: "security",
    label: "Security",
    content: (
      <>
        <h3 className={styles.panelTitle}>Security</h3>
        <p className={styles.panelText}>Keep your account safe with a strong password and two-factor auth.</p>
        <Row k="Password" v="Updated 3 weeks ago" />
        <Row k="Two-factor" v="Enabled" />
      </>
    ),
  },
  {
    value: "notifications",
    label: "Notifications",
    content: (
      <>
        <h3 className={styles.panelTitle}>Notifications</h3>
        <p className={styles.panelText}>Choose what we email you about and how often.</p>
        <Row k="Product updates" v="Weekly digest" />
        <Row k="Mentions" v="Instantly" />
      </>
    ),
  },
  {
    value: "billing",
    label: "Billing",
    content: (
      <>
        <h3 className={styles.panelTitle}>Billing</h3>
        <p className={styles.panelText}>You are on the Pro plan, renewing on Nov 1.</p>
        <Row k="Plan" v="Pro, $12 / month" />
        <Row k="Payment" v="Visa ending 4242" />
      </>
    ),
  },
];

export function Tabs({
  items = DEFAULT_ITEMS,
  value: valueProp,
  defaultValue,
  onValueChange,
  variant = "underline",
  size = "md",
  accentColor = "#6366f1",
  activationMode = "automatic",
  transition = "slide",
  fullWidth = false,
  ariaLabel = "Account settings",
  className = "",
  style,
}: TabsProps) {
  const reduce = useReducedMotion();
  const firstEnabled = items.find((t) => !t.disabled)?.value ?? "";
  const [inner, setInner] = React.useState(defaultValue ?? firstEnabled);
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : inner;
  const baseId = React.useId();
  const listRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const [rect, setRect] = React.useState<{ x: number; w: number } | null>(null);
  const activeIndex = Math.max(0, items.findIndex((t) => t.value === value));
  const prevIndex = React.useRef(activeIndex);
  const dir = activeIndex >= prevIndex.current ? 1 : -1;

  React.useEffect(() => {
    prevIndex.current = activeIndex;
  }, [activeIndex]);

  const select = (v: string) => {
    if (v === value) return;
    if (!controlled) setInner(v);
    onValueChange?.(v);
  };

  const measure = React.useCallback(() => {
    const el = tabRefs.current[activeIndex];
    if (el) setRect({ x: el.offsetLeft, w: el.offsetWidth });
  }, [activeIndex]);

  useIsoLayoutEffect(() => {
    measure();
  }, [measure, variant, size, fullWidth]);

  React.useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(list);
    return () => ro.disconnect();
  }, [measure]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0);
    const current = tabRefs.current.findIndex((el) => el === document.activeElement);
    if (current < 0 || enabled.length === 0) return;
    const pos = enabled.indexOf(current);
    let next = -1;
    if (e.key === "ArrowRight") next = enabled[(pos + 1) % enabled.length];
    else if (e.key === "ArrowLeft") next = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (e.key === "Home") next = enabled[0];
    else if (e.key === "End") next = enabled[enabled.length - 1];
    if (next < 0) return;
    e.preventDefault();
    tabRefs.current[next]?.focus();
    if (activationMode === "automatic") select(items[next].value);
  };

  const active = items[activeIndex];
  const offset = reduce || transition !== "slide" ? 0 : 20;
  const dur = transition === "none" ? 0 : reduce ? 0.1 : 0.22;

  return (
    <div
      className={`${styles.root} ${className}`.trim()}
      data-variant={variant}
      data-size={size}
      data-full={fullWidth ? "" : undefined}
      style={{ "--mf-tabs-accent": accentColor, ...style } as React.CSSProperties}
    >
      <div ref={listRef} role="tablist" aria-label={ariaLabel} aria-orientation="horizontal" className={styles.list} onKeyDown={onKeyDown}>
        {rect && (
          <motion.span
            aria-hidden="true"
            className={styles.indicator}
            initial={false}
            animate={{ x: rect.x, width: rect.w }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
          />
        )}
        {items.map((t, i) => {
          const selected = i === activeIndex;
          return (
            <button
              key={t.value}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${i}`}
              tabIndex={selected ? 0 : -1}
              disabled={t.disabled}
              data-selected={selected ? "" : undefined}
              className={styles.tab}
              onClick={() => select(t.value)}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div className={styles.panels}>
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          {active && (
            <motion.div
              key={active.value}
              role="tabpanel"
              id={`${baseId}-panel-${activeIndex}`}
              aria-labelledby={`${baseId}-tab-${activeIndex}`}
              tabIndex={0}
              className={styles.panel}
              initial={{ opacity: 0, x: dir * offset }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dir * offset }}
              transition={{ duration: dur, ease: [0.16, 1, 0.3, 1] }}
            >
              {active.content}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
