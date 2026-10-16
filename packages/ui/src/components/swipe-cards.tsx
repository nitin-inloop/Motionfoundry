"use client";

import * as React from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import styles from "../styles/swipe-cards.module.css";

export type SwipeDirection = "left" | "right";

export interface SwipeCardsProps {
  /** Card labels, last item starts on top (duplicates are fine) */
  items?: string[];
  /** Horizontal drag distance in pixels that commits a swipe */
  threshold?: number;
  /** Show the previous/next buttons below the stack */
  showControls?: boolean;
  /** Called after a card is swiped away */
  onSwipe?: (item: string, direction: SwipeDirection, index: number) => void;
  /** Optional className */
  className?: string;
}

const DEFAULT_ITEMS = ["Kinetic Type", "Liquid Glass", "Magnetic Dock", "Holo Tilt", "Aurora"];
const VISIBLE = 4;

export function SwipeCards({
  items = DEFAULT_ITEMS,
  threshold = 100,
  showControls = true,
  onSwipe,
  className = "",
}: SwipeCardsProps) {
  const prefersReducedMotion = useReducedMotion();
  const list = items.length > 0 ? items : DEFAULT_ITEMS;
  const itemsKey = list.join("\u0000");
  const [order, setOrder] = React.useState<number[]>(() => list.map((_, i) => i));
  const busy = React.useRef(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-18, 18]);
  const opacity = useTransform(x, [-360, -180, 0, 180, 360], [0, 1, 1, 1, 0]);

  React.useEffect(() => {
    setOrder(itemsKey.split("\u0000").map((_, i) => i));
    x.set(0);
  }, [itemsKey, x]);

  React.useEffect(() => () => x.stop(), [x]);

  const topIndex = order[order.length - 1] ?? 0;

  const commit = (direction: SwipeDirection) => {
    const index = topIndex;
    x.set(0);
    setOrder((o) => [o[o.length - 1] ?? 0, ...o.slice(0, -1)]);
    busy.current = false;
    onSwipe?.(list[index] ?? "", direction, index);
  };

  const fly = (direction: SwipeDirection) => {
    if (busy.current || order.length === 0) return;
    busy.current = true;
    if (prefersReducedMotion) {
      commit(direction);
      return;
    }
    animate(x, direction === "left" ? -420 : 420, { duration: 0.28, ease: [0.4, 0, 1, 1] }).then(() =>
      commit(direction),
    );
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      fly(e.key === "ArrowLeft" ? "left" : "right");
    }
  };

  return (
    <div className={`${styles.root} ${className}`.trim()}>
      <div
        role="group"
        tabIndex={0}
        aria-roledescription="card stack"
        aria-label="Swipe cards. Use the left and right arrow keys to swipe the top card."
        onKeyDown={onKeyDown}
        className={styles.stack}
      >
        {order.map((itemIndex, i) => {
          const depth = order.length - 1 - i;
          const isTop = depth === 0;
          return (
            <motion.div
              key={`card-${itemIndex}`}
              aria-hidden={!isTop}
              className={styles.card}
              style={isTop ? { x, rotate, opacity, zIndex: 100 } : { zIndex: 100 - depth }}
              drag={isTop ? "x" : false}
              dragMomentum={false}
              onDragEnd={(_, info) => {
                if (!isTop || busy.current) return;
                if (Math.abs(info.offset.x) > threshold || Math.abs(info.velocity.x) > 700) {
                  fly(info.offset.x < 0 ? "left" : "right");
                } else {
                  animate(x, 0, { type: "spring", stiffness: 500, damping: 32 });
                }
              }}
              initial={false}
              animate={
                isTop
                  ? { scale: 1, y: 0 }
                  : {
                      scale: 1 - Math.min(depth, VISIBLE) * 0.05,
                      y: Math.min(depth, VISIBLE) * 10,
                      opacity: depth < VISIBLE ? 1 : 0,
                    }
              }
              transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 28 }}
            >
              <span className={styles.index}>
                {String(itemIndex + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
              </span>
              <span className={styles.label}>{list[itemIndex]}</span>
              <span className={styles.hint} aria-hidden="true">
                Drag or use arrow keys
              </span>
            </motion.div>
          );
        })}
      </div>
      <span className={styles.srOnly} aria-live="polite">
        {`Card ${topIndex + 1} of ${list.length}: ${list[topIndex] ?? ""}`}
      </span>
      {showControls ? (
        <div className={styles.controls}>
          <button type="button" className={styles.control} onClick={() => fly("left")} aria-label="Swipe left">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className={styles.control} onClick={() => fly("right")} aria-label="Swipe right">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}
