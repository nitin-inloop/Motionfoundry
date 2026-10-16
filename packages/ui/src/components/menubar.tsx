"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/menubar.module.css";

export type MenubarEntry =
  | { type?: "item"; label: string; shortcut?: string; disabled?: boolean }
  | { type: "checkbox"; label: string; shortcut?: string; checked?: boolean }
  | { type: "separator" };

export interface MenubarMenu {
  /** Top-level menu label */
  label: string;
  /** Entries shown in the dropdown */
  items: MenubarEntry[];
}

export interface MenubarProps {
  /** Menus from left to right */
  menus?: MenubarMenu[];
  /** App name shown before the menus (empty hides it) */
  appName?: string;
  /** Show keyboard shortcut hints */
  showShortcuts?: boolean;
  /** Tighter item spacing */
  dense?: boolean;
  /** While a menu is open, hovering another trigger switches to it */
  switchOnHover?: boolean;
  /** Accent color for highlighted items and checks */
  accentColor?: string;
  /** Called when an item is chosen, with the menu and item labels */
  onSelect?: (menu: string, item: string) => void;
  /** Called when a checkbox item is toggled */
  onCheckedChange?: (menu: string, item: string, checked: boolean) => void;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_MENUS: MenubarMenu[] = [
  {
    label: "File",
    items: [
      { label: "New Tab", shortcut: "⌘T" },
      { label: "New Window", shortcut: "⌘N" },
      { label: "New Incognito Window", disabled: true },
      { type: "separator" },
      { label: "Share…" },
      { label: "Print…", shortcut: "⌘P" },
    ],
  },
  {
    label: "Edit",
    items: [
      { label: "Undo", shortcut: "⌘Z" },
      { label: "Redo", shortcut: "⇧⌘Z" },
      { type: "separator" },
      { label: "Cut", shortcut: "⌘X" },
      { label: "Copy", shortcut: "⌘C" },
      { label: "Paste", shortcut: "⌘V" },
    ],
  },
  {
    label: "View",
    items: [
      { type: "checkbox", label: "Always Show Bookmarks Bar", checked: true },
      { type: "checkbox", label: "Always Show Full URLs" },
      { type: "separator" },
      { label: "Reload", shortcut: "⌘R" },
      { label: "Toggle Fullscreen", shortcut: "⌃⌘F" },
    ],
  },
  {
    label: "Profiles",
    items: [{ label: "Andy" }, { label: "Benoit" }, { label: "Luis" }, { type: "separator" }, { label: "Edit…" }, { label: "Add Profile…" }],
  },
];

type Checks = Record<string, boolean>;
const checkKey = (menu: string, item: string) => `${menu}\u0000${item}`;

function initialChecks(menus: MenubarMenu[]): Checks {
  const out: Checks = {};
  for (const m of menus) for (const it of m.items) if (it.type === "checkbox") out[checkKey(m.label, it.label)] = !!it.checked;
  return out;
}

export function Menubar({
  menus = DEFAULT_MENUS,
  appName = "Foundry",
  showShortcuts = true,
  dense = false,
  switchOnHover = true,
  accentColor = "#6366f1",
  onSelect,
  onCheckedChange,
  className = "",
  style,
}: MenubarProps) {
  const reduceMotion = useReducedMotion();
  const baseId = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = React.useState<number | null>(null);
  const [focusIndex, setFocusIndex] = React.useState(0); // roving tabindex among triggers
  const [checks, setChecks] = React.useState<Checks>(() => initialChecks(menus));
  const pendingItemFocus = React.useRef<"first" | "last" | null>(null);

  // Close on outside pointer down.
  React.useEffect(() => {
    if (open === null) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const menuItems = (menuIndex: number) =>
    Array.from(rootRef.current?.querySelectorAll<HTMLElement>(`[data-menu="${menuIndex}"] [role^="menuitem"]:not([aria-disabled="true"])`) ?? []);

  // After a menu opens from the keyboard, move focus into it.
  React.useEffect(() => {
    if (open === null || !pendingItemFocus.current) return;
    const where = pendingItemFocus.current;
    pendingItemFocus.current = null;
    const id = requestAnimationFrame(() => {
      const items = menuItems(open);
      (where === "last" ? items[items.length - 1] : items[0])?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  const openMenu = (index: number, focusItem: "first" | "last" | null = null) => {
    pendingItemFocus.current = focusItem;
    setFocusIndex(index);
    setOpen(index);
  };

  const close = (refocus = true) => {
    const index = open;
    setOpen(null);
    if (refocus && index !== null) triggerRefs.current[index]?.focus();
  };

  const moveTrigger = (delta: number, keepOpen: boolean) => {
    const next = (focusIndex + delta + menus.length) % menus.length;
    setFocusIndex(next);
    triggerRefs.current[next]?.focus();
    if (keepOpen) openMenu(next, "first");
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      moveTrigger(e.key === "ArrowRight" ? 1 : -1, open !== null);
    } else if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openMenu(index, "first");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openMenu(index, "last");
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const target = e.key === "Home" ? 0 : menus.length - 1;
      setFocusIndex(target);
      triggerRefs.current[target]?.focus();
    } else if (e.key === "Escape") {
      close();
    }
  };

  const onMenuKeyDown = (e: React.KeyboardEvent, menuIndex: number) => {
    const items = menuItems(menuIndex);
    const current = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (i: number) => items[(i + items.length) % items.length]?.focus();
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusAt(current + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusAt(current - 1);
        break;
      case "Home":
        e.preventDefault();
        focusAt(0);
        break;
      case "End":
        e.preventDefault();
        focusAt(items.length - 1);
        break;
      case "ArrowRight":
      case "ArrowLeft":
        e.preventDefault();
        moveTrigger(e.key === "ArrowRight" ? 1 : -1, true);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        setOpen(null);
        break;
      default:
        // Typeahead: jump to the next item starting with the typed letter.
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const k = e.key.toLowerCase();
          const order = [...items.slice(current + 1), ...items.slice(0, current + 1)];
          order.find((el) => el.textContent?.trim().toLowerCase().startsWith(k))?.focus();
        }
    }
  };

  const choose = (menu: MenubarMenu, entry: MenubarEntry) => {
    if (entry.type === "separator") return;
    if (entry.type === "checkbox") {
      const key = checkKey(menu.label, entry.label);
      const next = !checks[key];
      setChecks((c) => ({ ...c, [key]: next }));
      onCheckedChange?.(menu.label, entry.label, next);
      return; // checkbox items keep the menu open
    }
    if (entry.disabled) return;
    onSelect?.(menu.label, entry.label);
    close();
  };

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.16, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${dense ? styles.dense : ""} ${className}`.trim()}
      style={{ "--mf-mb-accent": accentColor, ...style } as React.CSSProperties}
    >
      <div role="menubar" aria-label={appName || "Menu bar"} className={styles.bar}>
        {appName && (
          <span className={styles.app} aria-hidden="true">
            <span className={styles.logo} />
            {appName}
          </span>
        )}
        {menus.map((menu, index) => {
          const isOpen = open === index;
          const menuId = `${baseId}-menu-${index}`;
          return (
            <div key={menu.label} className={styles.menuWrap} data-menu={index}>
              <button
                ref={(el) => {
                  triggerRefs.current[index] = el;
                }}
                type="button"
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-controls={isOpen ? menuId : undefined}
                tabIndex={index === focusIndex ? 0 : -1}
                className={styles.trigger}
                data-open={isOpen || undefined}
                onClick={() => (isOpen ? close(false) : openMenu(index))}
                onPointerEnter={() => {
                  if (switchOnHover && open !== null && open !== index) openMenu(index);
                }}
                onKeyDown={(e) => onTriggerKeyDown(e, index)}
              >
                {menu.label}
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    id={menuId}
                    role="menu"
                    aria-label={menu.label}
                    className={styles.menu}
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={transition}
                    onKeyDown={(e) => onMenuKeyDown(e, index)}
                  >
                    {menu.items.map((entry, i) => {
                      if (entry.type === "separator") return <div key={`sep-${i}`} role="separator" className={styles.separator} />;
                      const isCheckbox = entry.type === "checkbox";
                      const checked = isCheckbox && checks[checkKey(menu.label, entry.label)];
                      const disabled = !isCheckbox && !!entry.disabled;
                      return (
                        <div
                          key={entry.label}
                          role={isCheckbox ? "menuitemcheckbox" : "menuitem"}
                          aria-checked={isCheckbox ? !!checked : undefined}
                          aria-disabled={disabled || undefined}
                          tabIndex={-1}
                          className={styles.item}
                          onClick={() => choose(menu, entry)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              choose(menu, entry);
                            }
                          }}
                          onPointerEnter={(e) => {
                            if (!disabled) e.currentTarget.focus();
                          }}
                        >
                          <span className={styles.check} aria-hidden="true">
                            {checked && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <path d="m5 12.5 4.5 4.5L19 7" />
                              </svg>
                            )}
                          </span>
                          <span className={styles.label}>{entry.label}</span>
                          {showShortcuts && entry.shortcut && <kbd className={styles.shortcut}>{entry.shortcut}</kbd>}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
