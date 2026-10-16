"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/context-menu.module.css";

export interface ContextMenuItem {
  /** Visible label (also the value passed to onSelect) */
  label?: string;
  /** Row kind */
  type?: "item" | "checkbox" | "separator" | "label";
  /** Keyboard shortcut hint shown on the right */
  shortcut?: string;
  /** Disable the row */
  disabled?: boolean;
  /** Initial checked state for checkbox rows */
  checked?: boolean;
  /** Nested items, turning this row into a submenu trigger */
  items?: ContextMenuItem[];
}

export interface ContextMenuProps {
  /** Menu items; defaults to a browser-style page menu */
  items?: ContextMenuItem[];
  /** Called with the label of the activated item */
  onSelect?: (label: string) => void;
  /** Text inside the dashed target area */
  areaLabel?: string;
  /** Secondary hint text inside the area */
  hint?: string;
  /** Target area width in pixels */
  width?: number;
  /** Target area height in pixels */
  height?: number;
  /** Menu panel width in pixels */
  menuWidth?: number;
  /** Accent color for checks, highlights and the focus ring */
  accentColor?: string;
  /** Show keyboard shortcut hints */
  showShortcuts?: boolean;
  /** Include items that open a submenu */
  showSubmenu?: boolean;
  /** Disable the context menu (native menu is shown instead) */
  disabled?: boolean;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_ITEMS: ContextMenuItem[] = [
  { label: "Back", shortcut: "⌘[" },
  { label: "Forward", shortcut: "⌘]", disabled: true },
  { label: "Reload", shortcut: "⌘R" },
  {
    label: "More tools",
    items: [
      { label: "Save page as…", shortcut: "⇧⌘S" },
      { label: "Create shortcut…" },
      { label: "Name window…" },
      { type: "separator" },
      { label: "Developer tools", shortcut: "⌥⌘I" },
    ],
  },
  { type: "separator" },
  { type: "label", label: "View" },
  { type: "checkbox", label: "Show bookmarks bar", shortcut: "⇧⌘B", checked: true },
  { type: "checkbox", label: "Show full URLs" },
];
const THEME_TOKENS = ["--mf-bg", "--mf-fg", "--mf-surface", "--mf-surface-raised", "--mf-muted", "--mf-subtle", "--mf-border", "--mf-border-strong", "--mf-accent"];
const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));
const isAction = (it: ContextMenuItem) => (it.type ?? "item") === "item" || it.type === "checkbox";

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

interface Anchor {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PanelProps {
  items: ContextMenuItem[];
  anchor: Anchor;
  isSub: boolean;
  focusFirst: boolean;
  labelledBy?: string;
  showShortcuts: boolean;
  checked: Record<string, boolean>;
  layerStyle: React.CSSProperties;
  onActivate: (item: ContextMenuItem) => void;
  onCloseAll: () => void;
  onCloseSelf: () => void;
}

function MenuPanel({ items, anchor, isSub, focusFirst, labelledBy, showShortcuts, checked, layerStyle, onActivate, onCloseAll, onCloseSelf }: PanelProps) {
  const reduce = useReducedMotion();
  const id = React.useId();
  const ref = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ left: number; top: number; origin: string } | null>(null);
  const [active, setActive] = React.useState(-1);
  const [sub, setSub] = React.useState<{ index: number; anchor: Anchor; focus: boolean } | null>(null);
  const enabled = items.map((it, i) => (isAction(it) && !it.disabled ? i : -1)).filter((i) => i >= 0);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 8;
    const fitsRight = anchor.x + anchor.w + w <= vw - pad;
    const left = clamp(fitsRight ? anchor.x + anchor.w - (isSub ? 2 : 0) : anchor.x - w + (isSub ? 2 : 0), pad, vw - w - pad);
    const startY = isSub ? anchor.y - 5 : anchor.y;
    const fitsDown = startY + h <= vh - pad;
    const top = clamp(fitsDown ? startY : (isSub ? anchor.y + anchor.h + 5 : anchor.y) - h, pad, vh - h - pad);
    setPos({ left, top, origin: `${fitsRight ? "left" : "right"} ${fitsDown ? "top" : "bottom"}` });
    if (focusFirst && enabled.length) setActive(enabled[0]);
    else el.focus();
  }, []);

  React.useEffect(() => {
    if (active >= 0) ref.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.focus();
  }, [active]);

  const openSub = (i: number, focus: boolean) => {
    const node = ref.current?.querySelector<HTMLElement>(`[data-index="${i}"]`);
    if (!node) return;
    const r = node.getBoundingClientRect();
    setSub({ index: i, anchor: { x: r.left, y: r.top, w: r.width, h: r.height }, focus });
  };

  const activate = (i: number, viaKey: boolean) => {
    const it = items[i];
    if (!it || !isAction(it) || it.disabled) return;
    if (it.items?.length) openSub(i, viaKey);
    else onActivate(it);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!ref.current?.contains(e.target as Node) || !enabled.length) return;
    const k = e.key;
    const at = enabled.indexOf(active);
    const move = (n: number) => {
      e.preventDefault();
      setActive(enabled[(n + enabled.length) % enabled.length]);
    };
    if (k === "ArrowDown") move(at < 0 ? 0 : at + 1);
    else if (k === "ArrowUp") move(at < 0 ? enabled.length - 1 : at - 1);
    else if (k === "Home") move(0);
    else if (k === "End") move(enabled.length - 1);
    else if (k === "Enter" || k === " ") {
      e.preventDefault();
      activate(active, true);
    } else if (k === "ArrowRight" && items[active]?.items?.length) {
      e.preventDefault();
      openSub(active, true);
    } else if (k === "ArrowLeft" && isSub) {
      e.preventDefault();
      onCloseSelf();
    } else if (k === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      if (isSub) onCloseSelf();
      else onCloseAll();
    } else if (k === "Tab") {
      e.preventDefault();
      onCloseAll();
    } else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const q = k.toLowerCase();
      const order = enabled.map((_, n) => enabled[(at + 1 + n) % enabled.length]);
      const hit = order.find((i) => items[i].label?.toLowerCase().startsWith(q));
      if (hit !== undefined) setActive(hit);
    }
  };

  return (
    <motion.div
      ref={ref}
      role="menu"
      aria-label={labelledBy ? undefined : "Context menu"}
      aria-labelledby={labelledBy}
      aria-orientation="vertical"
      tabIndex={-1}
      data-mf-cm-panel=""
      className={styles.menu}
      style={{ ...layerStyle, left: pos?.left ?? anchor.x, top: pos?.top ?? anchor.y, visibility: pos ? "visible" : "hidden", transformOrigin: pos?.origin ?? "left top" }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
      transition={{ duration: reduce ? 0.08 : 0.15, ease: [0.16, 1, 0.3, 1] }}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      onPointerLeave={() => {
        if (!sub) {
          setActive(-1);
          ref.current?.focus();
        }
      }}
    >
      {items.map((it, i) => {
        const kind = it.type ?? "item";
        if (kind === "separator") return <div key={`sep-${i}`} role="separator" className={styles.separator} />;
        if (kind === "label") return <div key={`lbl-${i}`} role="presentation" className={styles.groupLabel}>{it.label}</div>;
        const hasSub = !!it.items?.length;
        const isChecked = kind === "checkbox" && !!checked[it.label ?? ""];
        return (
          <div
            key={`${it.label}-${i}`}
            id={`${id}-${i}`}
            role={kind === "checkbox" ? "menuitemcheckbox" : "menuitem"}
            aria-checked={kind === "checkbox" ? isChecked : undefined}
            aria-disabled={it.disabled || undefined}
            aria-haspopup={hasSub ? "menu" : undefined}
            aria-expanded={hasSub ? sub?.index === i : undefined}
            tabIndex={-1}
            data-index={i}
            data-active={active === i || sub?.index === i ? "" : undefined}
            className={styles.item}
            onPointerMove={() => {
              if (it.disabled) return;
              if (active !== i) setActive(i);
              if (hasSub && sub?.index !== i) openSub(i, false);
              else if (!hasSub && sub) setSub(null);
            }}
            onClick={() => activate(i, false)}
          >
            <span aria-hidden="true" className={styles.indicator}>
              {isChecked && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.22 }} />
                </svg>
              )}
            </span>
            <span className={styles.label}>{it.label}</span>
            {showShortcuts && it.shortcut && !hasSub && <span className={styles.shortcut}>{it.shortcut}</span>}
            {hasSub && (
              <svg aria-hidden="true" className={styles.chevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 6 6 6-6 6" />
              </svg>
            )}
          </div>
        );
      })}
      {createPortal(
        <AnimatePresence>
          {sub && items[sub.index]?.items && (
            <MenuPanel
              key={sub.index}
              items={items[sub.index].items ?? []}
              anchor={sub.anchor}
              isSub
              focusFirst={sub.focus}
              labelledBy={`${id}-${sub.index}`}
              showShortcuts={showShortcuts}
              checked={checked}
              layerStyle={layerStyle}
              onActivate={onActivate}
              onCloseAll={onCloseAll}
              onCloseSelf={() => {
                const i = sub.index;
                setSub(null);
                setActive(i);
                ref.current?.querySelector<HTMLElement>(`[data-index="${i}"]`)?.focus();
              }}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  );
}

export function ContextMenu({
  items = DEFAULT_ITEMS,
  onSelect,
  areaLabel = "Right click here",
  hint = "or focus and press Shift+F10",
  width = 380,
  height = 200,
  menuWidth = 224,
  accentColor = "#6366f1",
  showShortcuts = true,
  showSubmenu = true,
  disabled = false,
  className = "",
  style,
}: ContextMenuProps) {
  const areaRef = React.useRef<HTMLDivElement>(null);
  const keyOpenedAt = React.useRef(0);
  const [mounted, setMounted] = React.useState(false);
  const [menu, setMenu] = React.useState<{ x: number; y: number; keyboard: boolean; n: number } | null>(null);
  const [themeVars, setThemeVars] = React.useState<Record<string, string>>({});
  const [last, setLast] = React.useState("");
  const list = React.useMemo(() => (showSubmenu ? items : items.filter((it) => !it.items?.length)), [items, showSubmenu]);
  const [checked, setChecked] = React.useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    const walk = (arr: ContextMenuItem[]) => arr.forEach((it) => (it.type === "checkbox" && it.label ? (out[it.label] = !!it.checked) : it.items && walk(it.items)));
    walk(items);
    return out;
  });

  React.useEffect(() => setMounted(true), []);

  const close = React.useCallback(() => {
    setMenu(null);
    const ae = document.activeElement;
    if (!ae || ae === document.body || ae.closest("[data-mf-cm-panel]")) areaRef.current?.focus({ preventScroll: true });
  }, []);

  const openAt = (x: number, y: number, keyboard: boolean) => {
    setThemeVars(readThemeVars(areaRef.current));
    setMenu((m) => ({ x, y, keyboard, n: (m?.n ?? 0) + 1 }));
  };

  React.useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest?.("[data-mf-cm-panel]") && !(e.button === 2 && areaRef.current?.contains(t))) close();
    };
    const dismiss = () => close();
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("resize", dismiss);
    window.addEventListener("blur", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("blur", dismiss);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, [menu, close]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || e.target !== e.currentTarget) return;
    if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10") || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      keyOpenedAt.current = performance.now();
      const r = e.currentTarget.getBoundingClientRect();
      openAt(r.left + 24, r.top + 24, true);
    }
  };

  const layerStyle = { ...themeVars, "--mf-cm-accent": accentColor, "--mf-cm-w": `${menuWidth}px` } as React.CSSProperties;

  return (
    <div className={`${styles.root} ${className}`.trim()} style={{ "--mf-cm-accent": accentColor, ...style } as React.CSSProperties}>
      <div
        ref={areaRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="menu"
        aria-expanded={!!menu}
        aria-disabled={disabled || undefined}
        aria-label={`${areaLabel}. ${hint}`}
        className={styles.area}
        data-open={menu ? "" : undefined}
        style={{ width, height }}
        onKeyDown={onKeyDown}
        onContextMenu={(e) => {
          if (disabled) return;
          e.preventDefault();
          if (performance.now() - keyOpenedAt.current < 400) return;
          openAt(e.clientX, e.clientY, false);
        }}
      >
        <span className={styles.areaLabel}>{areaLabel}</span>
        <span className={styles.hint}>{hint}</span>
        <span className={styles.last} aria-live="polite">
          {last ? `Last action: ${last}` : ""}
        </span>
      </div>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {menu && (
              <MenuPanel
                key={menu.n}
                items={list}
                anchor={{ x: menu.x, y: menu.y, w: 0, h: 0 }}
                isSub={false}
                focusFirst={menu.keyboard}
                showShortcuts={showShortcuts}
                checked={checked}
                layerStyle={layerStyle}
                onActivate={(it) => {
                  const label = it.label ?? "";
                  if (it.type === "checkbox") setChecked((c) => ({ ...c, [label]: !c[label] }));
                  setLast(it.type === "checkbox" ? `${label} ${checked[label] ? "off" : "on"}` : label);
                  onSelect?.(label);
                  close();
                }}
                onCloseAll={close}
                onCloseSelf={close}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
