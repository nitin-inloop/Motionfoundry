"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/dropdown-menu.module.css";

export type DropdownMenuIcon = "user" | "card" | "settings" | "keyboard" | "users" | "user-plus" | "mail" | "message" | "plus" | "help" | "cloud" | "logout";

export type DropdownMenuItemEntry = { type: "item"; label: string; value?: string; icon?: DropdownMenuIcon; shortcut?: string; disabled?: boolean };
export type DropdownMenuSubEntry = DropdownMenuItemEntry | { type: "separator" };
export type DropdownMenuEntry =
  | DropdownMenuSubEntry
  | { type: "label"; label: string }
  | { type: "checkbox"; label: string; defaultChecked?: boolean; disabled?: boolean }
  | { type: "submenu"; label: string; icon?: DropdownMenuIcon; items: DropdownMenuSubEntry[] };

export interface DropdownMenuProps {
  /** Menu entries: items, labels, separators, checkbox items and one level of submenus */
  items?: DropdownMenuEntry[];
  /** Controlled open state */
  open?: boolean;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean;
  /** Called whenever the menu requests to open or close */
  onOpenChange?: (open: boolean) => void;
  /** Called with the item's value (or label) when an item is chosen */
  onSelect?: (value: string) => void;
  /** Called when a checkbox item is toggled */
  onCheckedChange?: (label: string, checked: boolean) => void;
  /** Label of the trigger button */
  triggerLabel?: string;
  /** Preferred side of the menu (flips when there is no room) */
  side?: "bottom" | "top";
  /** Alignment of the menu relative to the trigger */
  align?: "start" | "center" | "end";
  /** Menu width in pixels */
  width?: number;
  /** Accent color for the highlighted item, checks and focus */
  accentColor?: string;
  /** Show item icons */
  showIcons?: boolean;
  /** Show keyboard shortcut hints */
  showShortcuts?: boolean;
  /** Disable the trigger */
  disabled?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const ICONS: Record<DropdownMenuIcon, string> = {
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  card: "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM2 10h20",
  settings: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
  keyboard: "M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  "user-plus": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6",
  mail: "M3 5h18v14H3zM3 6l9 7 9-7",
  message: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
  plus: "M12 5v14M5 12h14",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
  cloud: "M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
};

const DEFAULT_ITEMS: DropdownMenuEntry[] = [
  { type: "label", label: "My Account" },
  { type: "item", label: "Profile", icon: "user", shortcut: "⇧⌘P" },
  { type: "item", label: "Billing", icon: "card", shortcut: "⌘B" },
  { type: "item", label: "Settings", icon: "settings", shortcut: "⌘S" },
  { type: "item", label: "Keyboard shortcuts", icon: "keyboard", shortcut: "⌘K" },
  { type: "separator" },
  {
    type: "submenu",
    label: "Invite users",
    icon: "user-plus",
    items: [{ type: "item", label: "Email", icon: "mail" }, { type: "item", label: "Message", icon: "message" }, { type: "separator" }, { type: "item", label: "More…", icon: "plus" }],
  },
  { type: "item", label: "API", icon: "cloud", disabled: true },
  { type: "separator" },
  { type: "label", label: "View" },
  { type: "checkbox", label: "Status bar", defaultChecked: true },
  { type: "checkbox", label: "Activity bar" },
  { type: "separator" },
  { type: "item", label: "Log out", icon: "logout", shortcut: "⇧⌘Q" },
];

const THEME_TOKENS = ["--mf-bg", "--mf-fg", "--mf-surface", "--mf-surface-raised", "--mf-muted", "--mf-subtle", "--mf-border", "--mf-border-strong", "--mf-accent"];
const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, Math.max(lo, hi)));
const isNav = (e: DropdownMenuEntry) => (e.type === "item" || e.type === "checkbox" || e.type === "submenu") && !("disabled" in e && e.disabled);
const labelOf = (e: DropdownMenuEntry) => ("label" in e ? e.label : "");

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

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function DropdownMenu({
  items = DEFAULT_ITEMS,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onSelect,
  onCheckedChange,
  triggerLabel = "My account",
  side = "bottom",
  align = "start",
  width = 236,
  accentColor = "#6366f1",
  showIcons = true,
  showShortcuts = true,
  disabled = false,
  className = "",
  style,
}: DropdownMenuProps) {
  const reduce = useReducedMotion();
  const id = React.useId();
  const [inner, setInner] = React.useState(defaultOpen);
  const open = !disabled && (openProp !== undefined ? openProp : inner);
  const [active, setActive] = React.useState(-1);
  const [subOpen, setSubOpen] = React.useState(false);
  const [subActive, setSubActive] = React.useState(-1);
  const [subLeft, setSubLeft] = React.useState(false);
  const [checked, setChecked] = React.useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    items.forEach((e, i) => e.type === "checkbox" && (init[i] = !!e.defaultChecked));
    return init;
  });
  const [mounted, setMounted] = React.useState(false);
  const [pos, setPos] = React.useState<{ left: number; top: number; side: "bottom" | "top" } | null>(null);
  const [themeVars, setThemeVars] = React.useState<Record<string, string>>({});
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const subRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const subRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const typed = React.useRef({ text: "", time: 0 });

  const subIndex = items.findIndex((e) => e.type === "submenu");
  const subEntry = items[subIndex];
  const subItems = subEntry && subEntry.type === "submenu" ? subEntry.items : [];
  const nav = items.map((e, i) => (isNav(e) ? i : -1)).filter((i) => i >= 0);
  const subNav = subItems.map((e, i) => (isNav(e) ? i : -1)).filter((i) => i >= 0);

  React.useEffect(() => setMounted(true), []);

  const setOpen = React.useCallback(
    (next: boolean, focus: "first" | "last" | "none" = "none") => {
      if (openProp === undefined) setInner(next);
      onOpenChange?.(next);
      setSubOpen(false);
      setSubActive(-1);
      setActive(next && focus !== "none" ? (focus === "first" ? nav[0] ?? -1 : nav[nav.length - 1] ?? -1) : -1);
    },
    [openProp, onOpenChange, nav.join()],
  );
  const setOpenRef = React.useRef(setOpen);
  setOpenRef.current = setOpen;
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const place = React.useCallback(() => {
    const t = triggerRef.current;
    const m = menuRef.current;
    if (!t || !m) return;
    const r = t.getBoundingClientRect();
    const [w, h] = [m.offsetWidth, m.offsetHeight];
    const below = window.innerHeight - r.bottom;
    const s = side === "bottom" ? (below < h + 12 && r.top > below ? "top" : "bottom") : r.top < h + 12 && below > r.top ? "bottom" : "top";
    const raw = align === "start" ? r.left : align === "end" ? r.right - w : r.left + r.width / 2 - w / 2;
    setPos({ side: s, left: clamp(raw, 8, window.innerWidth - w - 8), top: s === "bottom" ? r.bottom + 6 : r.top - 6 - h });
  }, [side, align]);

  useIsoLayoutEffect(() => {
    if (!open) return;
    setThemeVars(readThemeVars(triggerRef.current));
    place();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpenRef.current(false);
    };
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, place]);

  // Submenu collision: open to the left when there is no room on the right.
  useIsoLayoutEffect(() => {
    const anchor = itemRefs.current[subIndex];
    if (!subOpen || !anchor || !subRef.current) return;
    setSubLeft(anchor.getBoundingClientRect().right + subRef.current.offsetWidth + 12 > window.innerWidth);
  }, [subOpen, subIndex]);

  // Roving focus: DOM focus follows the active item.
  React.useEffect(() => {
    if (!open) return;
    const el = subOpen && subActive >= 0 ? subRefs.current[subActive] : active >= 0 ? itemRefs.current[active] : menuRef.current;
    el?.focus({ preventScroll: true });
  }, [open, active, subOpen, subActive]);

  const openSub = (focusFirst: boolean) => {
    setActive(subIndex);
    setSubOpen(true);
    setSubActive(focusFirst ? subNav[0] ?? -1 : -1);
  };
  const closeSub = () => {
    setSubOpen(false);
    setSubActive(-1);
  };

  const activate = (i: number, inSub: boolean) => {
    const e = inSub ? subItems[i] : items[i];
    if (!e) return;
    if (e.type === "item" && !e.disabled) {
      onSelect?.(e.value ?? e.label);
      close();
    } else if (e.type === "checkbox" && !e.disabled) {
      const next = !checked[i];
      setChecked((c) => ({ ...c, [i]: next }));
      onCheckedChange?.(e.label, next);
    } else if (e.type === "submenu") openSub(true);
  };

  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const k = e.key;
    const inSub = subOpen && subActive >= 0;
    const list = inSub ? subNav : nav;
    const cur = inSub ? subActive : active;
    const setCur = (i: number) => {
      if (inSub) setSubActive(i);
      else {
        setActive(i);
        closeSub();
      }
    };
    const n = list.length;
    const at = list.indexOf(cur);
    if (k === "ArrowDown" || k === "ArrowUp") {
      e.preventDefault();
      if (n) setCur(list[at < 0 ? (k === "ArrowDown" ? 0 : n - 1) : (at + (k === "ArrowDown" ? 1 : -1) + n) % n]);
    } else if (k === "Home" || k === "End") {
      e.preventDefault();
      if (n) setCur(list[k === "Home" ? 0 : n - 1]);
    } else if (k === "ArrowRight" && !inSub && cur === subIndex && cur >= 0) {
      e.preventDefault();
      openSub(true);
    } else if ((k === "ArrowLeft" && inSub) || (k === "Escape" && subOpen)) {
      e.preventDefault();
      closeSub();
    } else if (k === "Escape") {
      e.preventDefault();
      close();
    } else if (k === "Enter" || k === " ") {
      e.preventDefault();
      if (cur >= 0) activate(cur, inSub);
    } else if (k === "Tab") {
      close();
    } else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const t = typed.current;
      const now = performance.now();
      t.text = now - t.time > 500 ? k : t.text + k;
      t.time = now;
      const source = inSub ? subItems : items;
      const start = Math.max(0, at) + (t.text.length === 1 ? 1 : 0);
      for (let j = 0; j < n; j++) {
        const idx = list[(start + j) % n];
        if (labelOf(source[idx]).toLowerCase().startsWith(t.text.toLowerCase())) return setCur(idx);
      }
    }
  };

  const onTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (["ArrowDown", "Enter", " "].includes(e.key) || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true, e.key === "ArrowUp" ? "last" : "first");
    }
  };

  const renderEntry = (e: DropdownMenuEntry, i: number, inSub: boolean) => {
    const key = `${inSub ? "s" : "m"}${i}`;
    if (e.type === "separator") return <div key={key} role="separator" className={styles.separator} />;
    if (e.type === "label") return <div key={key} role="presentation" className={styles.groupLabel}>{e.label}</div>;
    const isActive = inSub ? subActive === i : active === i && (!subOpen || subActive < 0);
    const off = "disabled" in e && !!e.disabled;
    const refs = inSub ? subRefs : itemRefs;
    const common = {
      ref: (el: HTMLDivElement | null) => {
        refs.current[i] = el;
      },
      tabIndex: -1,
      "aria-disabled": off || undefined,
      "data-active": isActive || (!inSub && e.type === "submenu" && subOpen) ? "" : undefined,
      className: styles.item,
      onClick: () => !off && activate(i, inSub),
      onPointerMove: () => {
        if (off) return;
        if (inSub) return subActive !== i && setSubActive(i);
        if (active !== i) setActive(i);
        if (e.type !== "submenu") return subOpen && closeSub();
        if (!subOpen) openSub(false);
        else if (subActive >= 0) setSubActive(-1);
      },
    };
    const icon = "icon" in e && e.icon && showIcons ? <Icon d={ICONS[e.icon]} className={styles.icon} /> : null;
    if (e.type === "checkbox") {
      return (
        <div key={key} role="menuitemcheckbox" aria-checked={!!checked[i]} {...common}>
          <span className={styles.check} aria-hidden="true">
            {checked[i] && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.2 }} />
              </svg>
            )}
          </span>
          <span className={styles.text}>{e.label}</span>
        </div>
      );
    }
    if (e.type === "submenu") {
      return (
        <div key={key} role="none" className={styles.subWrap}>
          <div role="menuitem" aria-haspopup="menu" aria-expanded={subOpen} aria-controls={subOpen ? `${id}-sub` : undefined} {...common}>
            {icon}
            <span className={styles.text}>{e.label}</span>
            <Icon d="m9 6 6 6-6 6" className={styles.chevron} />
          </div>
          <AnimatePresence>
            {subOpen && (
              <motion.div
                ref={subRef}
                id={`${id}-sub`}
                role="menu"
                aria-label={e.label}
                className={styles.menu}
                data-sub={subLeft ? "left" : "right"}
                style={{ transformOrigin: subLeft ? "top right" : "top left" }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, x: subLeft ? 6 : -6 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: reduce ? 1 : 0.97 }}
                transition={{ duration: reduce ? 0.06 : 0.14, ease: [0.16, 1, 0.3, 1] }}
              >
                {e.items.map((s, j) => renderEntry(s, j, true))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }
    return (
      <div key={key} role="menuitem" {...common}>
        {icon}
        <span className={styles.text}>{e.label}</span>
        {showShortcuts && e.shortcut && <kbd className={styles.shortcut}>{e.shortcut}</kbd>}
      </div>
    );
  };

  const fromTop = (pos?.side ?? side) === "bottom";
  const originX = align === "start" ? "left" : align === "end" ? "right" : "center";

  return (
    <div className={`${styles.root} ${className}`.trim()} style={{ "--mf-dm-accent": accentColor, ...style } as React.CSSProperties}>
      <button
        ref={triggerRef}
        id={`${id}-trigger`}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        disabled={disabled}
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        onKeyDown={onTriggerKey}
      >
        <span aria-hidden="true" className={styles.avatar}>
          AL
        </span>
        {triggerLabel}
        <motion.svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: reduce ? 0 : 0.2 }}>
          <path d="m6 9 6 6 6-6" />
        </motion.svg>
      </button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={menuRef}
                id={`${id}-menu`}
                role="menu"
                aria-labelledby={`${id}-trigger`}
                aria-orientation="vertical"
                tabIndex={-1}
                className={`${styles.menu} ${styles.panel}`}
                style={{ ...themeVars, "--mf-dm-accent": accentColor, "--mf-dm-w": `${width}px`, left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? "visible" : "hidden", transformOrigin: `${fromTop ? "top" : "bottom"} ${originX}` } as React.CSSProperties}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: fromTop ? -6 : 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: fromTop ? -4 : 4 }}
                transition={{ duration: reduce ? 0.08 : 0.16, ease: [0.16, 1, 0.3, 1] }}
                onKeyDown={onMenuKey}
                onPointerLeave={() => !subOpen && setActive(-1)}
              >
                {items.map((e, i) => renderEntry(e, i, false))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
