"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/activity-feed.module.css";

export type ActivityKind = "commit" | "comment" | "deploy" | "merge" | "alert" | "star";

export interface ActivityItem {
  /** Unique id */
  id: string;
  /** Who did it */
  actor: string;
  /** What happened (verb phrase) */
  action: string;
  /** What it happened to */
  target?: string;
  /** Icon / color category */
  kind: ActivityKind;
  /** How long ago, in minutes (deterministic — no clocks are read) */
  minutesAgo: number;
}

export interface ActivityFeedProps {
  /** Events, newest first */
  items?: ActivityItem[];
  /** Heading shown above the feed (also its accessible name) */
  title?: string;
  /** Show the heading visibly */
  showTitle?: boolean;
  /** Maximum events rendered */
  maxItems?: number;
  /** Delay between items animating in, in milliseconds */
  stagger?: number;
  /** Draw a vertical connector line between icons */
  showConnector?: boolean;
  /** Compact spacing */
  dense?: boolean;
  /** Accent color (commit icons, connector glow and focus tint) */
  accentColor?: string;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_ITEMS: ActivityItem[] = [
  { id: "a1", actor: "Maya Okafor", action: "deployed", target: "web@v2.3.0 to production", kind: "deploy", minutesAgo: 2 },
  { id: "a2", actor: "Liam Chen", action: "merged pull request", target: "#482 Faster search index", kind: "merge", minutesAgo: 18 },
  { id: "a3", actor: "Sofia Martinez", action: "commented on", target: "Checkout redesign", kind: "comment", minutesAgo: 47 },
  { id: "a4", actor: "Noah Patel", action: "pushed 3 commits to", target: "feat/billing-v2", kind: "commit", minutesAgo: 95 },
  { id: "a5", actor: "Monitoring", action: "flagged elevated latency on", target: "api-eu-west", kind: "alert", minutesAgo: 260 },
  { id: "a6", actor: "Ava Thompson", action: "starred", target: "motionfoundry/ui", kind: "star", minutesAgo: 1680 },
];

const ICONS: Record<ActivityKind, React.ReactNode> = {
  commit: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M3 12h5.5M15.5 12H21" />
    </>
  ),
  comment: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />,
  deploy: <path d="M12 3c3 2 5 5.5 5 9l-2.5 3h-5L7 12c0-3.5 2-7 5-9ZM9.5 15 8 20l4-2 4 2-1.5-5M12 9.5v.01" />,
  merge: (
    <>
      <circle cx="6" cy="5" r="2" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="12" r="2" />
      <path d="M6 7v10M8 5h2a6 6 0 0 1 6 6" />
    </>
  ),
  alert: <path d="M12 4 2.5 20h19L12 4ZM12 10v4.5M12 17.5v.01" />,
  star: <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />,
};

function relative(min: number) {
  const m = Math.max(0, Math.round(min));
  if (m < 1) return { text: "just now", iso: "PT0M" };
  if (m < 60) return { text: `${m}m ago`, iso: `PT${m}M` };
  const h = Math.floor(m / 60);
  if (h < 24) return { text: `${h}h ago`, iso: `PT${h}H` };
  const d = Math.floor(h / 24);
  return { text: d === 1 ? "yesterday" : `${d}d ago`, iso: `P${d}D` };
}

export function ActivityFeed({
  items = DEFAULT_ITEMS,
  title = "Recent activity",
  showTitle = true,
  maxItems = 6,
  stagger = 90,
  showConnector = true,
  dense = false,
  accentColor = "#6366f1",
  className = "",
  style,
}: ActivityFeedProps) {
  const reduce = useReducedMotion();
  const id = React.useId();
  const list = items.slice(0, Math.max(1, Math.floor(maxItems)));
  const step = Math.max(0, stagger) / 1000;

  return (
    <section
      aria-labelledby={`${id}-title`}
      className={`${styles.root} ${className}`.trim()}
      data-dense={dense ? "" : undefined}
      style={{ "--mf-af-accent": accentColor, ...style } as React.CSSProperties}
    >
      <h3 id={`${id}-title`} className={showTitle ? styles.title : styles.srOnly}>
        {title}
      </h3>
      <ol className={styles.list}>
        {list.map((item, i) => {
          const t = relative(item.minutesAgo);
          const last = i === list.length - 1;
          return (
            <motion.li
              key={item.id}
              className={styles.item}
              initial={reduce ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.42, delay: i * step, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.rail} aria-hidden="true">
                <motion.span
                  className={styles.icon}
                  data-kind={item.kind}
                  initial={reduce ? false : { scale: 0.4 }}
                  animate={{ scale: 1 }}
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 22, delay: i * step }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {ICONS[item.kind]}
                  </svg>
                </motion.span>
                {showConnector && !last && (
                  <motion.span
                    className={styles.line}
                    initial={reduce ? false : { scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.4, delay: i * step + 0.15, ease: "easeOut" }}
                  />
                )}
              </div>
              <div className={styles.body}>
                <p className={styles.text}>
                  <span className={styles.actor}>{item.actor}</span> {item.action}
                  {item.target && (
                    <>
                      {" "}
                      <span className={styles.target}>{item.target}</span>
                    </>
                  )}
                </p>
                <time className={styles.time} dateTime={t.iso}>
                  {t.text}
                </time>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
