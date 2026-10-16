"use client";

import * as React from "react";
import styles from "../styles/accordion-cards.module.css";

export interface AccordionCardsProps {
  /** Panel titles, left to right */
  items?: string[];
  /** One-line description per panel (shown when expanded) */
  descriptions?: string[];
  /** Initially expanded panel index */
  defaultIndex?: number;
  /** Controlled expanded panel index */
  index?: number;
  /** Called when the expanded panel changes */
  onIndexChange?: (index: number) => void;
  /** Expand on hover/focus, or only on click/Enter */
  expandOn?: "hover" | "click";
  /** Fill color of the expanded panel */
  accentColor?: string;
  /** Text color on the expanded panel */
  activeTextColor?: string;
  /** Height in pixels */
  height?: number;
  /** Gap between panels in pixels */
  gap?: number;
  /** How much wider the expanded panel grows */
  expandRatio?: number;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_ITEMS = ["Design", "Develop", "Deploy", "Scale"];
const DEFAULT_DESCRIPTIONS = ["Shape the idea into flows and screens.", "Build it with typed, tested components.", "Ship to the edge in one command.", "Grow without rewriting the foundation."];

export function AccordionCards({
  items = DEFAULT_ITEMS,
  descriptions = DEFAULT_DESCRIPTIONS,
  defaultIndex = 0,
  index,
  onIndexChange,
  expandOn = "hover",
  accentColor = "#ff8a1f",
  activeTextColor = "#140b02",
  height = 260,
  gap = 10,
  expandRatio = 3.2,
  className = "",
  style,
}: AccordionCardsProps) {
  const list = items.length ? items : DEFAULT_ITEMS;
  const [indexState, setIndexState] = React.useState(Math.min(Math.max(defaultIndex, 0), list.length - 1));
  const active = index ?? indexState;
  const buttons = React.useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = React.useId();

  const activate = (i: number) => {
    if (i === active) return;
    if (index === undefined) setIndexState(i);
    onIndexChange?.(i);
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const map: Record<string, number> = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: list.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    const next = (map[e.key] + list.length) % list.length;
    buttons.current[next]?.focus();
    activate(next);
  };

  return (
    <div
      role="group"
      aria-label="Expandable panels"
      className={`${styles.root} ${className}`.trim()}
      style={
        {
          "--mf-ac-height": `${height}px`,
          "--mf-ac-gap": `${gap}px`,
          "--mf-ac-accent": accentColor,
          "--mf-ac-on": activeTextColor,
          "--mf-ac-grow": expandRatio,
          ...style,
        } as React.CSSProperties
      }
    >
      {list.map((title, i) => {
        const isActive = i === active;
        const panelId = `${baseId}-panel-${i}`;
        return (
          <button
            key={`${title}-${i}`}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            className={styles.panel}
            data-active={isActive || undefined}
            aria-expanded={isActive}
            aria-controls={panelId}
            onPointerEnter={() => expandOn === "hover" && activate(i)}
            onFocus={() => expandOn === "hover" && activate(i)}
            onClick={() => activate(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
            <span id={panelId} className={styles.content} aria-hidden={!isActive}>
              <span className={styles.title}>{title}</span>
              {descriptions[i] && <span className={styles.description}>{descriptions[i]}</span>}
            </span>
            {!isActive && <span className={styles.srOnly}>{title}</span>}
          </button>
        );
      })}
    </div>
  );
}
