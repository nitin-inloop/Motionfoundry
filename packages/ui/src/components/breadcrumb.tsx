"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/breadcrumb.module.css";

export interface BreadcrumbItem {
  /** Visible label */
  label: string;
  /** Link target (omit for the current page) */
  href?: string;
}

export interface BreadcrumbProps {
  /** Trail of pages from root to the current page */
  items?: BreadcrumbItem[];
  /** Separator glyph between items */
  separator?: "chevron" | "slash" | "dot" | "arrow";
  /** Collapse middle items into an ellipsis menu when the trail is longer than this */
  maxItems?: number;
  /** Enable collapsing of middle items */
  collapsible?: boolean;
  /** Show a home icon before the first label */
  showHomeIcon?: boolean;
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Accent color for the hover underline and focus highlights */
  accentColor?: string;
  /** Accessible label of the nav landmark */
  ariaLabel?: string;
  /** Called when a link is activated; links with href "#" are not followed */
  onNavigate?: (item: BreadcrumbItem, index: number) => void;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_ITEMS: BreadcrumbItem[] = [
  { label: "Home", href: "#" },
  { label: "Workspace", href: "#" },
  { label: "Projects", href: "#" },
  { label: "MotionFoundry", href: "#" },
  { label: "Components", href: "#" },
  { label: "Breadcrumb" },
];

function Separator({ kind }: { kind: NonNullable<BreadcrumbProps["separator"]> }) {
  return (
    <li role="presentation" aria-hidden="true" className={styles.sep}>
      {kind === "slash" ? (
        "/"
      ) : kind === "dot" ? (
        <span className={styles.dot} />
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={kind === "arrow" ? "M5 12h14M13 6l6 6-6 6" : "m9 6 6 6-6 6"} />
        </svg>
      )}
    </li>
  );
}

export function Breadcrumb({
  items = DEFAULT_ITEMS,
  separator = "chevron",
  maxItems = 4,
  collapsible = true,
  showHomeIcon = true,
  size = "md",
  accentColor = "#6366f1",
  ariaLabel = "Breadcrumb",
  onNavigate,
  className = "",
  style,
}: BreadcrumbProps) {
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const menuId = React.useId();
  const wrapRef = React.useRef<HTMLLIElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const itemRefs = React.useRef<Array<HTMLAnchorElement | null>>([]);

  const max = Math.max(2, Math.round(maxItems));
  const collapse = collapsible && items.length > max;
  const tailCount = Math.max(1, max - 1);
  const hidden = collapse ? items.slice(1, items.length - tailCount) : [];
  const visible = collapse
    ? [{ item: items[0], index: 0 }, ...items.slice(items.length - tailCount).map((item, i) => ({ item, index: items.length - tailCount + i }))]
    : items.map((item, index) => ({ item, index }));

  React.useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => itemRefs.current[0]?.focus());
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const onMenuKey = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const nodes = itemRefs.current.filter((n): n is HTMLAnchorElement => !!n);
    const i = nodes.findIndex((n) => n === document.activeElement);
    let next = -1;
    if (e.key === "ArrowDown") next = (i + 1) % nodes.length;
    else if (e.key === "ArrowUp") next = (i - 1 + nodes.length) % nodes.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = nodes.length - 1;
    else if (e.key === "Escape") {
      e.preventDefault();
      close(true);
      return;
    } else if (e.key === "Tab") close(false);
    if (next < 0) return;
    e.preventDefault();
    nodes[next]?.focus();
  };

  const activate = (e: React.MouseEvent<HTMLAnchorElement>, item: BreadcrumbItem, index: number) => {
    if (!item.href || item.href === "#") e.preventDefault();
    onNavigate?.(item, index);
  };

  const renderLink = (item: BreadcrumbItem, index: number) => {
    const isLast = index === items.length - 1;
    const icon =
      showHomeIcon && index === 0 ? (
        <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </svg>
      ) : null;
    if (isLast || item.href === undefined) {
      return (
        <span className={styles.current} aria-current={isLast ? "page" : undefined}>
          {icon}
          {item.label}
        </span>
      );
    }
    return (
      <a href={item.href} className={styles.link} onClick={(e) => activate(e, item, index)}>
        {icon}
        <span className={styles.text}>{item.label}</span>
      </a>
    );
  };

  return (
    <nav
      aria-label={ariaLabel}
      className={`${styles.root} ${className}`.trim()}
      data-size={size}
      style={{ "--mf-bc-accent": accentColor, ...style } as React.CSSProperties}
    >
      <ol className={styles.list}>
        {visible.map(({ item, index }, pos) => (
          <React.Fragment key={`${item.label}-${index}`}>
            {pos > 0 && <Separator kind={separator} />}
            <li className={styles.item}>{renderLink(item, index)}</li>
            {pos === 0 && hidden.length > 0 && (
              <>
                <Separator kind={separator} />
                <li ref={wrapRef} className={`${styles.item} ${styles.more}`}>
                  <button
                    ref={triggerRef}
                    type="button"
                    className={styles.ellipsis}
                    aria-label={`Show ${hidden.length} more`}
                    aria-haspopup="menu"
                    aria-expanded={open}
                    aria-controls={open ? menuId : undefined}
                    onClick={() => setOpen((o) => !o)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setOpen(true);
                      }
                    }}
                  >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="5" cy="12" r="1.8" />
                      <circle cx="12" cy="12" r="1.8" />
                      <circle cx="19" cy="12" r="1.8" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {open && (
                      <motion.ul
                        id={menuId}
                        role="menu"
                        aria-label="Hidden pages"
                        className={styles.menu}
                        onKeyDown={onMenuKey}
                        initial={{ opacity: 0, y: reduce ? 0 : -6, scale: reduce ? 1 : 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: reduce ? 0 : -4, scale: reduce ? 1 : 0.98 }}
                        transition={{ duration: reduce ? 0.1 : 0.18, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {hidden.map((h, i) => (
                          <li key={`${h.label}-${i}`} role="none">
                            <a
                              ref={(el) => {
                                itemRefs.current[i] = el;
                              }}
                              role="menuitem"
                              tabIndex={-1}
                              href={h.href ?? "#"}
                              className={styles.menuItem}
                              onClick={(e) => {
                                activate(e, h, i + 1);
                                close(true);
                              }}
                            >
                              {h.label}
                            </a>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              </>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}
