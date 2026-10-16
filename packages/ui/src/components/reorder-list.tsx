"use client";

import * as React from "react";
import { MotionConfig, Reorder, useReducedMotion } from "motion/react";
import styles from "../styles/reorder-list.module.css";

export interface ReorderListProps {
  /** Unique string items to reorder */
  items?: string[];
  /** Called with the new order after a drag or keyboard move */
  onReorder?: (items: string[]) => void;
  /** Show the grip handle icon on each item */
  showHandles?: boolean;
  /** Scale applied to the item while it is being dragged */
  dragScale?: number;
  /** Optional className merged onto the root */
  className?: string;
}

const DEFAULT_ITEMS = ["Design tokens", "Motion primitives", "Component library", "Docs site", "Release v2.1"];

function GripIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

export function ReorderList({ items = DEFAULT_ITEMS, onReorder, showHandles = true, dragScale = 1.04, className = "" }: ReorderListProps) {
  const prefersReducedMotion = useReducedMotion();
  const instructionsId = React.useId();
  const [list, setList] = React.useState<string[]>(items);
  const [announcement, setAnnouncement] = React.useState("");
  const refs = React.useRef(new Map<string, HTMLLIElement>());
  const pendingFocus = React.useRef<string | null>(null);
  const itemsKey = items.join("\u0000");
  const lastKey = React.useRef(itemsKey);

  if (lastKey.current !== itemsKey) {
    lastKey.current = itemsKey;
    setList(items);
  }

  React.useEffect(() => {
    if (pendingFocus.current === null) return;
    refs.current.get(pendingFocus.current)?.focus();
    pendingFocus.current = null;
  }, [list]);

  const commit = (next: string[]) => {
    setList(next);
    onReorder?.(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLLIElement>, index: number) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const target = index + (e.key === "ArrowUp" ? -1 : 1);
    if (target < 0 || target >= list.length) return;
    if (!e.altKey) {
      refs.current.get(list[target])?.focus();
      return;
    }
    const value = list[index];
    const next = [...list];
    next.splice(index, 1);
    next.splice(target, 0, value);
    pendingFocus.current = value;
    setAnnouncement(`Moved ${value} to position ${target + 1} of ${next.length}`);
    commit(next);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className={`${styles.root} ${className}`.trim()}>
        <p id={instructionsId} className={styles.srOnly}>
          Drag to reorder, or focus an item and press Alt plus Arrow Up or Arrow Down to move it.
        </p>
        <Reorder.Group axis="y" values={list} onReorder={commit} className={styles.list} aria-describedby={instructionsId}>
          {list.map((it, i) => (
            <Reorder.Item
              key={it}
              value={it}
              ref={(node: HTMLLIElement | null) => {
                if (node) refs.current.set(it, node);
                else refs.current.delete(it);
              }}
              tabIndex={0}
              aria-label={`${it}, position ${i + 1} of ${list.length}`}
              onKeyDown={(e: React.KeyboardEvent<HTMLLIElement>) => handleKeyDown(e, i)}
              whileDrag={prefersReducedMotion ? undefined : { scale: dragScale }}
              className={styles.item}
            >
              {showHandles && (
                <span aria-hidden="true" className={styles.handle}>
                  <GripIcon />
                </span>
              )}
              <span className={styles.label}>{it}</span>
              <span aria-hidden="true" className={styles.index}>
                {String(i + 1).padStart(2, "0")}
              </span>
            </Reorder.Item>
          ))}
        </Reorder.Group>
        <p aria-live="polite" className={styles.srOnly}>
          {announcement}
        </p>
      </div>
    </MotionConfig>
  );
}
