"use client";

import * as React from "react";
import styles from "../styles/avatar-group.module.css";

export interface AvatarGroupProps {
  /** People shown in the stack (initials are derived from each name) */
  names?: string[];
  /** Maximum avatars shown before collapsing the rest into a +N chip */
  max?: number;
  /** Avatar size preset */
  size?: "sm" | "md" | "lg";
  /** How much neighbouring avatars overlap, as a fraction of the avatar size (0–0.6) */
  overlap?: number;
  /** Fan the stack apart while the group is hovered or focused */
  spreadOnHover?: boolean;
  /** Show a deterministic presence dot (online / away / busy / offline) on each avatar */
  showStatus?: boolean;
  /** Show the person's name in a small tooltip on hover / focus */
  showTooltip?: boolean;
  /** Accent color used by the +N chip and focus tint */
  accentColor?: string;
  /** Accessible name of the group */
  label?: string;
  /** Called when the +N chip toggles the full list */
  onExpandedChange?: (expanded: boolean) => void;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_NAMES = [
  "Ava Thompson",
  "Liam Chen",
  "Sofia Martinez",
  "Noah Patel",
  "Maya Okafor",
  "Ethan Brooks",
  "Isla Novak",
  "Kai Tanaka",
  "Zara Ahmed",
];

const STATUSES = ["online", "away", "online", "busy", "offline", "online", "away", "online", "busy"] as const;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : parts[0]?.[1] ?? "";
  return (first + last).toUpperCase();
}

function gradientFor(name: string) {
  const h = hash(name);
  const hue = h % 360;
  const hue2 = (hue + 35 + ((h >>> 9) % 50)) % 360;
  const angle = 120 + ((h >>> 3) % 120);
  return `linear-gradient(${angle}deg, hsl(${hue} 78% 62%), hsl(${hue2} 72% 46%))`;
}

export function AvatarGroup({
  names = DEFAULT_NAMES,
  max = 5,
  size = "md",
  overlap = 0.3,
  spreadOnHover = true,
  showStatus = true,
  showTooltip = true,
  accentColor = "#6366f1",
  label = "Project members",
  onExpandedChange,
  className = "",
  style,
}: AvatarGroupProps) {
  const [expanded, setExpanded] = React.useState(false);
  const limit = Math.max(1, Math.floor(max));
  const visible = expanded ? names : names.slice(0, limit);
  const hidden = names.length - visible.length;
  const ov = Math.min(0.6, Math.max(0, overlap));

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    onExpandedChange?.(next);
  };

  return (
    <div
      role="group"
      aria-label={label}
      className={`${styles.root} ${className}`.trim()}
      data-size={size}
      data-spread={spreadOnHover ? "" : undefined}
      style={{ "--mf-ag-accent": accentColor, "--mf-ag-overlap": ov, ...style } as React.CSSProperties}
    >
      <ul className={styles.list}>
        {visible.map((name, i) => {
          const status = STATUSES[i % STATUSES.length] ?? "online";
          const desc = showStatus ? `${name} (${status})` : name;
          return (
            <li key={`${name}-${i}`} className={styles.item} style={{ "--mf-ag-i": i, zIndex: visible.length - i } as React.CSSProperties}>
              <span role="img" aria-label={desc} tabIndex={0} className={styles.avatar} style={{ backgroundImage: gradientFor(name) }}>
                <span aria-hidden="true" className={styles.initials}>
                  {initials(name)}
                </span>
                {showStatus && <span aria-hidden="true" className={styles.status} data-status={status} />}
              </span>
              {showTooltip && (
                <span aria-hidden="true" className={styles.tip}>
                  {name}
                </span>
              )}
            </li>
          );
        })}
        {(hidden > 0 || expanded) && names.length > limit && (
          <li className={styles.item} style={{ "--mf-ag-i": visible.length, zIndex: 0 } as React.CSSProperties}>
            <button
              type="button"
              className={`${styles.avatar} ${styles.more}`}
              aria-expanded={expanded}
              aria-label={expanded ? "Show fewer members" : `Show ${hidden} more: ${names.slice(limit).join(", ")}`}
              onClick={toggle}
            >
              {expanded ? (
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              ) : (
                `+${hidden}`
              )}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
