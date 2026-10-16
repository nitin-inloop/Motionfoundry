"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../styles/sidebar-nav.module.css";

export type SidebarNavIcon = "home" | "inbox" | "chart" | "folder" | "users" | "settings" | "help";

export interface SidebarNavItem {
  /** Unique id used for the active state */
  id: string;
  /** Visible label (also the accessible name when collapsed) */
  label: string;
  /** Built-in icon */
  icon?: SidebarNavIcon;
  /** Optional count badge */
  badge?: number;
}

export interface SidebarNavGroup {
  /** Group heading (hidden when collapsed) */
  label: string;
  /** Links in this group */
  items: SidebarNavItem[];
}

export interface SidebarNavProps {
  /** Grouped navigation links */
  groups?: SidebarNavGroup[];
  /** Controlled active item id */
  value?: string;
  /** Initially active item id (uncontrolled) */
  defaultValue?: string;
  /** Called when an item is activated */
  onValueChange?: (id: string) => void;
  /** Controlled collapsed state */
  collapsed?: boolean;
  /** Start collapsed to icons (uncontrolled) */
  defaultCollapsed?: boolean;
  /** Called when the collapse toggle is used */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Workspace title shown at the top */
  title?: string;
  /** Show count badges */
  showBadges?: boolean;
  /** Show the collapse toggle button */
  showToggle?: boolean;
  /** Expanded width in pixels */
  width?: number;
  /** Accent color for the active pill and badges */
  accentColor?: string;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const DEFAULT_GROUPS: SidebarNavGroup[] = [
  {
    label: "Workspace",
    items: [
      { id: "home", label: "Home", icon: "home" },
      { id: "inbox", label: "Inbox", icon: "inbox", badge: 12 },
      { id: "analytics", label: "Analytics", icon: "chart" },
      { id: "projects", label: "Projects", icon: "folder", badge: 3 },
    ],
  },
  {
    label: "Organization",
    items: [
      { id: "team", label: "Team", icon: "users" },
      { id: "settings", label: "Settings", icon: "settings" },
      { id: "help", label: "Help & support", icon: "help" },
    ],
  },
];

const ICON_PATHS: Record<SidebarNavIcon, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  inbox: "M3 13h5l1.5 3h5L16 13h5M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  folder: "M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z",
  users: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M22 19v-1a4 4 0 0 0-3-3.87M16 4.13a3 3 0 0 1 0 5.74",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.8 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 1.2 14H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.6 7a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 7 2.6 1.7 1.7 0 0 0 8 1.1V1a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V7a1.7 1.7 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
};

function Icon({ name }: { name: SidebarNavIcon }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

export function SidebarNav({
  groups = DEFAULT_GROUPS,
  value,
  defaultValue = "inbox",
  onValueChange,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  title = "Acme Inc.",
  showBadges = true,
  showToggle = true,
  width = 240,
  accentColor = "#6366f1",
  className = "",
  style,
}: SidebarNavProps) {
  const reduceMotion = useReducedMotion();
  const pillId = React.useId();
  const listId = React.useId();
  const listRef = React.useRef<HTMLDivElement>(null);
  const [activeState, setActiveState] = React.useState(defaultValue);
  const [collapsedState, setCollapsedState] = React.useState(defaultCollapsed);
  const active = value ?? activeState;
  const isCollapsed = collapsed ?? collapsedState;

  const select = (id: string) => {
    if (value === undefined) setActiveState(id);
    onValueChange?.(id);
  };

  const toggle = () => {
    const next = !isCollapsed;
    if (collapsed === undefined) setCollapsedState(next);
    onCollapsedChange?.(next);
  };

  // Up/Down/Home/End move focus between items (the list is also reachable with Tab).
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("[data-sidebar-item]") ?? []);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1) return;
    const targets: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: buttons.length - 1 };
    if (!(event.key in targets)) return;
    event.preventDefault();
    buttons[(targets[event.key] + buttons.length) % buttons.length]?.focus();
  };

  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 34 };

  return (
    <motion.nav
      aria-label={title || "Sidebar"}
      className={`${styles.root} ${className}`.trim()}
      data-collapsed={isCollapsed || undefined}
      animate={{ width: isCollapsed ? 64 : width }}
      initial={false}
      transition={spring}
      style={{ "--mf-sn-accent": accentColor, ...style } as React.CSSProperties}
    >
      <div className={styles.header}>
        <span className={styles.logo} aria-hidden="true" />
        {!isCollapsed && <span className={styles.title}>{title}</span>}
        {showToggle && (
          <button
            type="button"
            className={styles.toggle}
            onClick={toggle}
            aria-expanded={!isCollapsed}
            aria-controls={listId}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M9 4v16" />
            </svg>
          </button>
        )}
      </div>

      <div id={listId} ref={listRef} className={styles.groups} onKeyDown={onKeyDown}>
        {groups.map((group) => (
          <div key={group.label} className={styles.group}>
            <div className={styles.groupLabel} aria-hidden={isCollapsed || undefined}>
              {isCollapsed ? <span className={styles.groupRule} /> : group.label}
            </div>
            <ul className={styles.list}>
              {group.items.map((item) => {
                const isActive = item.id === active;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-sidebar-item=""
                      className={styles.item}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={isCollapsed ? item.label : undefined}
                      title={isCollapsed ? item.label : undefined}
                      onClick={() => select(item.id)}
                    >
                      {isActive && <motion.span layoutId={`${pillId}-pill`} className={styles.pill} transition={spring} aria-hidden="true" />}
                      {item.icon && <Icon name={item.icon} />}
                      {!isCollapsed && <span className={styles.label}>{item.label}</span>}
                      {showBadges && item.badge !== undefined && (
                        <span className={isCollapsed ? styles.badgeDot : styles.badge} aria-label={`${item.badge} new`}>
                          {isCollapsed ? null : item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </motion.nav>
  );
}
