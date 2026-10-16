"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "../styles/notification-stack.module.css";

export interface NotificationStackProps {
  /** Messages cycled through on each trigger press */
  messages?: string[];
  /** Auto-dismiss delay in milliseconds (0 disables auto-dismiss) */
  duration?: number;
  /** Maximum number of toasts visible at once */
  maxVisible?: number;
  /** Trigger button label */
  triggerLabel?: string;
  /** Where new toasts appear relative to the stack */
  position?: "top" | "bottom";
  /** Optional className merged onto the root */
  className?: string;
}

interface Toast {
  id: number;
  text: string;
}

const DEFAULT_MESSAGES = ["Build succeeded", "New comment on your PR", "Deployed to production", "3 new stars"];

function BellIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function NotificationStack({
  messages = DEFAULT_MESSAGES,
  duration = 3000,
  maxVisible = 4,
  triggerLabel = "Notify me",
  position = "top",
  className = "",
}: NotificationStackProps) {
  const prefersReducedMotion = useReducedMotion();
  const [items, setItems] = React.useState<Toast[]>([]);
  const nextId = React.useRef(0);
  const timers = React.useRef(new Map<number, ReturnType<typeof setTimeout>>());

  React.useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  const dismiss = (id: number) => {
    const t = timers.current.get(id);
    if (t !== undefined) clearTimeout(t);
    timers.current.delete(id);
    setItems((list) => list.filter((x) => x.id !== id));
  };

  const add = () => {
    const id = nextId.current++;
    const pool = messages.length > 0 ? messages : DEFAULT_MESSAGES;
    const text = pool[id % pool.length] ?? "Notification";
    const limit = Math.max(1, Math.round(maxVisible));
    setItems((list) => (position === "top" ? [{ id, text }, ...list].slice(0, limit) : [...list, { id, text }].slice(-limit)));
    if (duration > 0) timers.current.set(id, setTimeout(() => dismiss(id), duration));
  };

  const enterY = position === "top" ? -20 : 20;

  return (
    <div className={`${styles.root} ${className}`.trim()}>
      <button type="button" onClick={add} className={styles.trigger}>
        {triggerLabel}
      </button>
      <ul aria-live="polite" aria-label="Notifications" className={styles.list}>
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.li
              key={it.id}
              layout={!prefersReducedMotion}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: enterY, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 80 }}
              transition={prefersReducedMotion ? { duration: 0.15 } : { type: "spring", stiffness: 400, damping: 30 }}
              className={styles.toast}
            >
              <span className={styles.icon}>
                <BellIcon />
              </span>
              <span className={styles.text}>{it.text}</span>
              <button type="button" aria-label={`Dismiss: ${it.text}`} onClick={() => dismiss(it.id)} className={styles.dismiss}>
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {items.length === 0 && <p className={styles.empty}>No notifications yet</p>}
    </div>
  );
}
