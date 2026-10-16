"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/pagination.module.css";

export interface PaginationProps {
  /** Controlled current page (1-based) */
  page?: number;
  /** Initial page when uncontrolled */
  defaultPage?: number;
  /** Called with the next page */
  onPageChange?: (page: number) => void;
  /** Total number of pages */
  totalPages?: number;
  /** Pages shown on each side of the current page */
  siblingCount?: number;
  /** Pages always shown at the start and end */
  boundaryCount?: number;
  /** Visual style of the active indicator */
  variant?: "solid" | "outline" | "soft";
  /** Button shape */
  shape?: "rounded" | "circle";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Accent color of the active indicator */
  accentColor?: string;
  /** Show Previous / Next buttons */
  showPrevNext?: boolean;
  /** Show text labels on the Previous / Next buttons */
  showLabels?: boolean;
  /** Disable the whole control */
  disabled?: boolean;
  /** Accessible label of the nav landmark */
  ariaLabel?: string;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

type Slot = number | "start-ellipsis" | "end-ellipsis";
const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

function range(a: number, b: number): number[] {
  const out: number[] = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

/** Builds the visible page slots with ellipses, keeping the slot count stable while paging. */
function buildSlots(page: number, total: number, sib: number, bnd: number): Slot[] {
  const start = range(1, Math.min(bnd, total));
  const end = range(Math.max(total - bnd + 1, bnd + 1), total);
  const sibStart = Math.max(Math.min(page - sib, total - bnd - sib * 2 - 1), bnd + 2);
  const sibEnd = Math.min(Math.max(page + sib, bnd + sib * 2 + 2), end.length > 0 ? end[0] - 2 : total - 1);
  const out: Slot[] = [...start];
  if (sibStart > bnd + 2) out.push("start-ellipsis");
  else if (bnd + 1 < total - bnd) out.push(bnd + 1);
  out.push(...range(sibStart, sibEnd));
  if (sibEnd < total - bnd - 1) out.push("end-ellipsis");
  else if (total - bnd > bnd) out.push(total - bnd);
  out.push(...end);
  return out.filter((s, i, arr) => arr.indexOf(s) === i && (typeof s !== "number" || (s >= 1 && s <= total)));
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
    </svg>
  );
}

export function Pagination({
  page: pageProp,
  defaultPage = 4,
  onPageChange,
  totalPages = 12,
  siblingCount = 1,
  boundaryCount = 1,
  variant = "solid",
  shape = "rounded",
  size = "md",
  accentColor = "#6366f1",
  showPrevNext = true,
  showLabels = true,
  disabled = false,
  ariaLabel = "Pagination",
  className = "",
  style,
}: PaginationProps) {
  const reduce = useReducedMotion();
  const total = Math.max(1, Math.round(totalPages));
  const [inner, setInner] = React.useState(defaultPage);
  const controlled = pageProp !== undefined;
  const page = Math.min(total, Math.max(1, Math.round(controlled ? pageProp : inner)));
  const listRef = React.useRef<HTMLUListElement>(null);
  const btnRefs = React.useRef(new Map<number, HTMLButtonElement>());
  const [rect, setRect] = React.useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const slots = buildSlots(page, total, Math.max(0, Math.round(siblingCount)), Math.max(1, Math.round(boundaryCount)));

  const go = (p: number) => {
    const next = Math.min(total, Math.max(1, p));
    if (next === page || disabled) return;
    if (!controlled) setInner(next);
    onPageChange?.(next);
  };

  const measure = React.useCallback(() => {
    const el = btnRefs.current.get(page);
    if (el) setRect({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
  }, [page]);

  useIsoLayoutEffect(() => {
    measure();
  }, [measure, total, siblingCount, boundaryCount, size, shape, showPrevNext, showLabels]);

  React.useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(list);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <nav
      aria-label={ariaLabel}
      className={`${styles.root} ${className}`.trim()}
      data-variant={variant}
      data-shape={shape}
      data-size={size}
      data-disabled={disabled ? "" : undefined}
      style={{ "--mf-pg-accent": accentColor, ...style } as React.CSSProperties}
    >
      <ul ref={listRef} className={styles.list}>
        {rect && (
          <motion.li
            aria-hidden="true"
            className={styles.indicator}
            initial={false}
            animate={{ x: rect.x, y: rect.y, width: rect.w, height: rect.h }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 38 }}
          />
        )}
        {showPrevNext && (
          <li>
            <button type="button" className={`${styles.btn} ${styles.nav}`} aria-label="Go to previous page" disabled={disabled || page <= 1} onClick={() => go(page - 1)}>
              <Chevron dir="left" />
              {showLabels && <span>Previous</span>}
            </button>
          </li>
        )}
        {slots.map((s) =>
          typeof s === "number" ? (
            <li key={s}>
              <button
                ref={(el) => {
                  if (el) btnRefs.current.set(s, el);
                  else btnRefs.current.delete(s);
                }}
                type="button"
                className={`${styles.btn} ${styles.num}`}
                aria-label={`Page ${s}`}
                aria-current={s === page ? "page" : undefined}
                data-active={s === page ? "" : undefined}
                disabled={disabled}
                onClick={() => go(s)}
              >
                {s}
              </button>
            </li>
          ) : (
            <li key={s} aria-hidden="true" className={styles.ellipsis}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.6" />
                <circle cx="12" cy="12" r="1.6" />
                <circle cx="19" cy="12" r="1.6" />
              </svg>
            </li>
          ),
        )}
        {showPrevNext && (
          <li>
            <button type="button" className={`${styles.btn} ${styles.nav}`} aria-label="Go to next page" disabled={disabled || page >= total} onClick={() => go(page + 1)}>
              {showLabels && <span>Next</span>}
              <Chevron dir="right" />
            </button>
          </li>
        )}
      </ul>
      <span className={styles.srOnly} aria-live="polite">{`Page ${page} of ${total}`}</span>
    </nav>
  );
}
