"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/split-button.module.css";

export interface SplitButtonProps {
  /** Label of the primary action */
  label?: string;
  /** Secondary actions listed in the menu */
  actions?: string[];
  /** Called when the primary part is pressed, with its current label */
  onClick?: (label: string) => void;
  /** Called when a menu action is chosen */
  onAction?: (action: string, index: number) => void;
  /** Swap a chosen menu action into the primary slot */
  rememberLast?: boolean;
  /** Controlled menu open state */
  open?: boolean;
  /** Initial menu open state when uncontrolled */
  defaultOpen?: boolean;
  /** Called when the menu requests to open or close */
  onOpenChange?: (open: boolean) => void;
  /** Accessible label of the chevron trigger */
  menuLabel?: string;
  /** Visual style */
  variant?: "default" | "secondary" | "outline";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Preferred side of the menu (flips when it does not fit) */
  side?: "bottom" | "top";
  /** Menu alignment against the button */
  align?: "start" | "end";
  /** Brand color for the default variant */
  accentColor?: string;
  /** Disable both parts */
  disabled?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_ACTIONS = ["Deploy to preview", "Deploy without cache", "Schedule deploy…", "Roll back to previous"];

export function SplitButton({
  label = "Deploy to production",
  actions = DEFAULT_ACTIONS,
  onClick,
  onAction,
  rememberLast = false,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  menuLabel = "More deploy options",
  variant = "default",
  size = "md",
  side = "bottom",
  align = "end",
  accentColor = "#6366f1",
  disabled = false,
  className = "",
  style,
}: SplitButtonProps) {
  const reduce = useReducedMotion();
  const [innerOpen, setInnerOpen] = React.useState(defaultOpen);
  const open = openProp ?? innerOpen;
  const [list, setList] = React.useState<string[]>(() => [label, ...actions]);
  const [placement, setPlacement] = React.useState(side);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const focusOnOpen = React.useRef<"first" | "last">("first");
  const menuId = React.useId();

  const actionsKey = actions.join("\n");
  React.useEffect(() => {
    setList([label, ...actionsKey.split("\n").filter(Boolean)]);
  }, [label, actionsKey]);

  const primary = list[0];
  const menuItems = list.slice(1);

  const setOpen = React.useCallback(
    (v: boolean, restoreFocus = false) => {
      if (openProp === undefined) setInnerOpen(v);
      onOpenChange?.(v);
      if (!v && restoreFocus) triggerRef.current?.focus();
    },
    [openProp, onOpenChange],
  );

  // Placement flip, initial focus and outside click while open.
  React.useEffect(() => {
    if (!open) return;
    const trigger = rootRef.current?.getBoundingClientRect();
    const menuH = menuRef.current?.offsetHeight ?? 0;
    if (trigger) {
      const below = window.innerHeight - trigger.bottom;
      const above = trigger.top;
      if (side === "bottom" && below < menuH + 12 && above > below) setPlacement("top");
      else if (side === "top" && above < menuH + 12 && below > above) setPlacement("bottom");
      else setPlacement(side);
    }
    const raf = requestAnimationFrame(() => {
      const nodes = itemRefs.current.filter((n): n is HTMLButtonElement => !!n);
      (focusOnOpen.current === "last" ? nodes[nodes.length - 1] : nodes[0])?.focus();
    });
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, side, setOpen]);

  const choose = (index: number) => {
    const action = menuItems[index];
    onAction?.(action, index);
    if (rememberLast) setList((l) => [action, ...l.slice(1).map((a) => (a === action ? l[0] : a))]);
    setOpen(false, true);
  };

  const onTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      focusOnOpen.current = e.key === "ArrowUp" ? "last" : "first";
      setOpen(true);
    }
  };

  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const nodes = itemRefs.current.filter((n): n is HTMLButtonElement => !!n);
    const i = nodes.indexOf(document.activeElement as HTMLButtonElement);
    let next = -1;
    if (e.key === "ArrowDown") next = (i + 1) % nodes.length;
    else if (e.key === "ArrowUp") next = (i - 1 + nodes.length) % nodes.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = nodes.length - 1;
    else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false, true);
      return;
    } else if (e.key === "Tab") {
      setOpen(false);
      return;
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const ch = e.key.toLowerCase();
      for (let k = 1; k <= nodes.length; k++) {
        const j = (i + k) % nodes.length;
        if (menuItems[j]?.toLowerCase().startsWith(ch)) {
          next = j;
          break;
        }
      }
    }
    if (next < 0) return;
    e.preventDefault();
    nodes[next]?.focus();
  };

  const origin = `${placement === "bottom" ? "top" : "bottom"} ${align === "end" ? "right" : "left"}`;

  return (
    <div
      ref={rootRef}
      className={[styles.root, styles[variant], styles[size], className].filter(Boolean).join(" ")}
      style={{ "--mf-sb-accent": accentColor, ...style } as React.CSSProperties}
    >
      <button type="button" className={styles.main} disabled={disabled} onClick={() => onClick?.(primary)}>
        {primary}
      </button>
      <span className={styles.divider} aria-hidden="true" />
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        disabled={disabled}
        aria-label={menuLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onKeyDown={onTriggerKey}
        onClick={() => {
          focusOnOpen.current = "first";
          setOpen(!open);
        }}
      >
        <svg aria-hidden="true" className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <AnimatePresence>
        {open && !disabled ? (
          <motion.div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={menuLabel}
            tabIndex={-1}
            onKeyDown={onMenuKey}
            className={styles.menu}
            data-side={placement}
            data-align={align}
            style={{ transformOrigin: origin }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: placement === "bottom" ? -4 : 4 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: placement === "bottom" ? -2 : 2 }}
            transition={{ duration: reduce ? 0.1 : 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {menuItems.map((action, i) => (
              <motion.button
                key={action}
                ref={(el: HTMLButtonElement | null) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                className={styles.item}
                onClick={() => choose(i)}
                onPointerMove={(e) => e.currentTarget.focus()}
                initial={reduce ? false : { opacity: 0, x: align === "end" ? 6 : -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18, delay: reduce ? 0 : 0.03 + i * 0.025 }}
              >
                {action}
              </motion.button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
