"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/magnetic-dock.module.css";

export interface MagneticDockItem {
  id: string;
  label: string;
  glyph: string;
}

export interface MagneticDockProps {
  /** Dock launcher items */
  items?: MagneticDockItem[];
  /** Peak magnification multiplier */
  maxScale?: number;
  /** Proximity radius in pixels */
  proximity?: number;
  /** Base button size in pixels */
  baseSize?: number;
  /** Selection callback */
  onSelect?: (id: string) => void;
  /** Optional className */
  className?: string;
}

const DEFAULT_DOCK_ITEMS: MagneticDockItem[] = [
  { id: "terminal", label: "CLI Runner", glyph: "❯_" },
  { id: "registry", label: "Registry AST", glyph: "◈" },
  { id: "inspector", label: "Prop Inspector", glyph: "⌘" },
  { id: "profiler", label: "120Hz Profiler", glyph: "◎" },
  { id: "bundle", label: "ESM Bundle", glyph: "▤" },
];

export function MagneticDock({
  items = DEFAULT_DOCK_ITEMS,
  maxScale = 1.42,
  proximity = 115,
  baseSize = 42,
  onSelect,
  className = "",
}: MagneticDockProps) {
  const [pointerX, setPointerX] = React.useState<number | null>(null);
  const [activeId, setActiveId] = React.useState(items[0]?.id ?? "terminal");
  const btnRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const prefersReducedMotion = useReducedMotion();

  const computeScale = (idx: number) => {
    if (prefersReducedMotion || pointerX === null) return 1;
    const el = btnRefs.current[idx];
    if (!el) return 1;
    const rect = el.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const dist = Math.abs(pointerX - center);
    if (dist >= proximity) return 1;
    const factor = Math.cos((dist / proximity) * (Math.PI / 2));
    return 1 + (maxScale - 1) * factor;
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      btnRefs.current[(idx + 1) % items.length]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      btnRefs.current[(idx - 1 + items.length) % items.length]?.focus();
    }
  };

  return (
    <div className={styles.safeZone}>
      <nav
        aria-label="Developer magnetic dock"
        onPointerMove={(e) => setPointerX(e.clientX)}
        onPointerLeave={() => setPointerX(null)}
        className={`${styles.dock} ${className}`.trim()}
      >
        {items.map((item, idx) => {
          const scale = computeScale(idx);
          const isSelected = item.id === activeId;
          return (
            <motion.button
              key={item.id}
              ref={(el) => {
                btnRefs.current[idx] = el;
              }}
              type="button"
              aria-label={item.label}
              aria-current={isSelected ? "page" : undefined}
              onClick={() => {
                setActiveId(item.id);
                onSelect?.(item.id);
              }}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              animate={{ scale, y: scale > 1.05 ? -(scale - 1) * 14 : 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              style={{ width: `${baseSize}px`, height: `${baseSize}px` }}
              className={`${styles.item} ${isSelected ? styles.itemActive : ""}`.trim()}
            >
              <span className={styles.glyph}>{item.glyph}</span>
              <span className={styles.tooltip}>{item.label}</span>
              {isSelected && <span aria-hidden="true" className={styles.indicator} />}
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}
