"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/navigation-menu.module.css";

export interface NavigationMenuLink {
  /** Link title */
  label: string;
  /** Short description under the title */
  description?: string;
  /** Link target */
  href?: string;
}

export interface NavigationMenuItem {
  /** Top-level label */
  label: string;
  /** Link target for items without sub-links */
  href?: string;
  /** Sub-links shown in the dropdown panel */
  links?: NavigationMenuLink[];
  /** Optional highlighted card shown beside the sub-links */
  feature?: { title: string; description: string; href?: string };
}

export interface NavigationMenuProps {
  /** Top-level items */
  items?: NavigationMenuItem[];
  /** Brand text shown on the left (empty hides it) */
  brand?: string;
  /** Call-to-action button label (empty hides it) */
  ctaLabel?: string;
  /** Hover indicator style */
  indicator?: "pill" | "underline";
  /** Open dropdowns on hover (and click) or on click only */
  openOn?: "hover" | "click";
  /** Accent color for the feature card, CTA and highlights */
  accentColor?: string;
  /** Minimum height reserved for the open panel, in pixels */
  minHeight?: number;
  /** Accessible label of the nav landmark */
  ariaLabel?: string;
  /** Called when any link is activated; links with href "#" are not followed */
  onNavigate?: (href: string, label: string) => void;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_ITEMS: NavigationMenuItem[] = [
  {
    label: "Products",
    feature: { title: "MotionFoundry 2.3", description: "Forty new animated UI primitives, built from scratch.", href: "#" },
    links: [
      { label: "Analytics", description: "Real-time dashboards for every metric.", href: "#" },
      { label: "Automations", description: "Trigger workflows from any event.", href: "#" },
      { label: "Integrations", description: "Connect the tools you already use.", href: "#" },
    ],
  },
  {
    label: "Resources",
    links: [
      { label: "Documentation", description: "Guides and API references.", href: "#" },
      { label: "Templates", description: "Starter kits for common apps.", href: "#" },
      { label: "Changelog", description: "What shipped this month.", href: "#" },
      { label: "Community", description: "Ask questions, share builds.", href: "#" },
    ],
  },
  { label: "Pricing", href: "#" },
  { label: "Blog", href: "#" },
];

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function NavigationMenu({
  items = DEFAULT_ITEMS,
  brand = "Foundry",
  ctaLabel = "Get started",
  indicator = "pill",
  openOn = "hover",
  accentColor = "#6366f1",
  minHeight = 340,
  ariaLabel = "Main",
  onNavigate,
  className = "",
  style,
}: NavigationMenuProps) {
  const reduce = useReducedMotion();
  const baseId = React.useId();
  const [open, setOpen] = React.useState<number | null>(null);
  const [hover, setHover] = React.useState<number | null>(null);
  const [bar, setBar] = React.useState<{ x: number; w: number } | null>(null);
  const [panelX, setPanelX] = React.useState(0);
  const [snap, setSnap] = React.useState(true);
  const placedFor = React.useRef<number | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const navRef = React.useRef<HTMLElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const topRefs = React.useRef<Array<HTMLElement | null>>([]);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusFirst = React.useRef(false);
  const target = hover ?? open;

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  React.useEffect(() => clearTimer, []);

  React.useEffect(() => {
    if (open === null) return;
    const onDown = (e: PointerEvent) => {
      const node = e.target as Node;
      if (!navRef.current?.contains(node) && !panelRef.current?.contains(node)) setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const scheduleClose = () => {
    setHover(null);
    if (openOn !== "hover") return;
    clearTimer();
    timer.current = setTimeout(() => setOpen(null), 180);
  };

  const close = (refocus: boolean) => {
    clearTimer();
    if (refocus && open !== null) topRefs.current[open]?.focus();
    setOpen(null);
  };

  const place = React.useCallback(() => {
    const root = rootRef.current;
    const t = target !== null ? topRefs.current[target] : null;
    setBar(t ? { x: t.offsetLeft, w: t.offsetWidth } : null);
    const trig = open !== null ? topRefs.current[open] : null;
    const panel = panelRef.current;
    const fresh = placedFor.current === null;
    placedFor.current = open;
    if (!root || !trig || !panel) return;
    const r = root.getBoundingClientRect();
    const tr = trig.getBoundingClientRect();
    const max = root.clientWidth - panel.offsetWidth;
    setSnap(fresh);
    setPanelX(Math.max(0, Math.min(max, tr.left - r.left + tr.width / 2 - panel.offsetWidth / 2)));
  }, [target, open]);

  useIsoLayoutEffect(() => {
    place();
  }, [place]);

  React.useEffect(() => {
    const panel = panelRef.current;
    if (!panel || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => place());
    ro.observe(panel);
    if (rootRef.current) ro.observe(rootRef.current);
    if (focusFirst.current) {
      focusFirst.current = false;
      panel.querySelector<HTMLElement>("a")?.focus();
    }
    return () => ro.disconnect();
  }, [open, place]);

  const linkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string | undefined, label: string) => {
    if (!href || href === "#") e.preventDefault();
    onNavigate?.(href ?? "#", label);
    close(false);
  };

  const onTopKey = (e: React.KeyboardEvent<HTMLElement>, i: number) => {
    const n = items.length;
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % n;
    else if (e.key === "ArrowLeft") next = (i - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else if (e.key === "ArrowDown" && items[i].links?.length) {
      e.preventDefault();
      if (open === i) panelRef.current?.querySelector<HTMLElement>("a")?.focus();
      else {
        focusFirst.current = true;
        setOpen(i);
      }
      return;
    } else if (e.key === "Escape" && open !== null) {
      e.preventDefault();
      close(true);
      return;
    }
    if (next < 0) return;
    e.preventDefault();
    topRefs.current[next]?.focus();
    if (open !== null) setOpen(items[next].links?.length ? next : null);
  };

  const onPanelKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const links = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("a") ?? []);
    const i = links.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (i + 1) % links.length;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (i - 1 + links.length) % links.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = links.length - 1;
    else if (e.key === "Escape") {
      e.preventDefault();
      close(true);
      return;
    }
    if (next < 0) return;
    e.preventDefault();
    links[next]?.focus();
  };

  const active = open !== null ? items[open] : null;
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 36 };

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${className}`.trim()}
      data-indicator={indicator}
      style={{ "--mf-nm-accent": accentColor, minHeight: Math.max(0, minHeight), ...style } as React.CSSProperties}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(null);
      }}
    >
      <nav ref={navRef} aria-label={ariaLabel} className={styles.bar} onPointerLeave={scheduleClose} onPointerEnter={clearTimer}>
        {brand && (
          <a href="#" className={styles.brand} onClick={(e) => linkClick(e, "#", brand)}>
            <span aria-hidden="true" className={styles.logo} />
            {brand}
          </a>
        )}
        <ul className={styles.list} onPointerLeave={() => setHover(null)}>
          <motion.li
            aria-hidden="true"
            className={styles.indicator}
            initial={false}
            animate={bar ? { x: bar.x, width: bar.w, opacity: 1 } : { opacity: 0 }}
            transition={spring}
          />
          {items.map((item, i) => {
            const hasMenu = !!item.links?.length;
            const common = {
              ref: (el: HTMLElement | null) => {
                topRefs.current[i] = el;
              },
              className: styles.top,
              onPointerEnter: () => {
                setHover(i);
                if (openOn === "hover") {
                  clearTimer();
                  timer.current = setTimeout(() => setOpen(hasMenu ? i : null), open === null ? 90 : 0);
                }
              },
              onFocus: () => setHover(i),
              onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => onTopKey(e, i),
            };
            return (
              <li key={item.label}>
                {hasMenu ? (
                  <button
                    {...common}
                    type="button"
                    aria-expanded={open === i}
                    aria-controls={`${baseId}-panel`}
                    data-open={open === i ? "" : undefined}
                    onClick={(e) => {
                      clearTimer();
                      const toggle = openOn === "click" || e.detail === 0;
                      setOpen(toggle && open === i ? null : i);
                    }}
                  >
                    {item.label}
                    <svg aria-hidden="true" className={styles.caret} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                ) : (
                  <a {...common} href={item.href ?? "#"} onClick={(e) => linkClick(e, item.href, item.label)}>
                    {item.label}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
        {ctaLabel && (
          <a href="#" className={styles.cta} onClick={(e) => linkClick(e, "#", ctaLabel)}>
            {ctaLabel}
          </a>
        )}
      </nav>
      <AnimatePresence>
        {active && (
          <motion.div
            ref={panelRef}
            id={`${baseId}-panel`}
            className={styles.panel}
            onKeyDown={onPanelKey}
            onPointerEnter={clearTimer}
            onPointerLeave={scheduleClose}
            initial={{ opacity: 0, y: reduce ? 0 : -8, scale: reduce ? 1 : 0.98, x: panelX }}
            animate={{ opacity: 1, y: 0, scale: 1, x: panelX }}
            exit={{ opacity: 0, y: reduce ? 0 : -6, scale: reduce ? 1 : 0.98 }}
            transition={reduce ? { duration: 0.1, x: { duration: 0 } } : { type: "spring", stiffness: 380, damping: 34, x: snap ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 34 } }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={open ?? -1}
                className={styles.content}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.12 }}
              >
                {active.feature && (
                  <a href={active.feature.href ?? "#"} className={styles.feature} onClick={(e) => linkClick(e, active.feature?.href, active.feature?.title ?? "")}>
                    <strong>{active.feature.title}</strong>
                    <span>{active.feature.description}</span>
                  </a>
                )}
                <ul className={styles.links} data-cols={!active.feature && (active.links?.length ?? 0) > 3 ? 2 : 1}>
                  {active.links?.map((l) => (
                    <li key={l.label}>
                      <a href={l.href ?? "#"} className={styles.link} onClick={(e) => linkClick(e, l.href, l.label)}>
                        <span className={styles.linkTitle}>{l.label}</span>
                        {l.description && <span className={styles.linkDesc}>{l.description}</span>}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
