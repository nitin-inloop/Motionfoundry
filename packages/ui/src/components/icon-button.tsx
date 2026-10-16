"use client";

import * as React from "react";
import styles from "../styles/icon-button.module.css";

type IconName = "bell" | "heart" | "settings" | "share" | "plus" | "trash" | "search";

export interface IconButtonProps {
  /** Accessible name, also shown as the hover/focus label */
  label?: string;
  /** Built-in inline SVG icon */
  icon?: IconName;
  /** Custom icon; overrides `icon` */
  children?: React.ReactNode;
  /** Visual style */
  variant?: "solid" | "soft" | "outline" | "ghost";
  /** Corner shape */
  shape?: "round" | "square";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Show the floating label on hover and keyboard focus */
  showLabel?: boolean;
  /** Side the floating label appears on */
  labelSide?: "top" | "bottom";
  /** Play a ripple from the press point */
  ripple?: boolean;
  /** Brand color for solid/soft variants and the ripple */
  accentColor?: string;
  /** Disable the button */
  disabled?: boolean;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const PATHS: Record<IconName, string> = {
  bell: "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
  heart: "M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  share: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
  plus: "M12 5v14M5 12h14",
  trash: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
};

interface Ripple {
  id: number;
  x: number;
  y: number;
  r: number;
}

export function IconButton({
  label = "Notifications",
  icon = "bell",
  children,
  variant = "soft",
  shape = "round",
  size = "md",
  showLabel = true,
  labelSide = "top",
  ripple = true,
  accentColor = "#6366f1",
  disabled = false,
  onClick,
  className = "",
  style,
}: IconButtonProps) {
  const [ripples, setRipples] = React.useState<Ripple[]>([]);
  const nextId = React.useRef(0);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!ripple || disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const r = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
    const id = nextId.current++;
    setRipples((list) => [...list.slice(-3), { id, x, y, r }]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!ripple || disabled || e.repeat || (e.key !== "Enter" && e.key !== " ")) return;
    const { width, height } = e.currentTarget.getBoundingClientRect();
    const id = nextId.current++;
    setRipples((list) => [...list.slice(-3), { id, x: width / 2, y: height / 2, r: Math.hypot(width, height) / 2 }]);
  };

  const cls = [styles.root, styles[variant], styles[shape], styles[size]].filter(Boolean).join(" ");

  return (
    <span
      className={`${styles.wrap} ${className}`.trim()}
      data-side={labelSide}
      style={{ "--mf-ib-accent": accentColor, ...style } as React.CSSProperties}
    >
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        onClick={onClick}
        className={cls}
      >
        <span className={styles.ripples} aria-hidden="true">
          {ripples.map((rp) => (
            <span
              key={rp.id}
              className={styles.ripple}
              style={{ left: rp.x - rp.r, top: rp.y - rp.r, width: rp.r * 2, height: rp.r * 2 }}
              onAnimationEnd={() => setRipples((list) => list.filter((it) => it.id !== rp.id))}
            />
          ))}
        </span>
        <span className={styles.icon} aria-hidden="true">
          {children ?? (
            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={PATHS[icon] ?? PATHS.bell} />
            </svg>
          )}
        </span>
      </button>
      {showLabel && label ? (
        <span className={styles.tip} aria-hidden="true">
          {label}
        </span>
      ) : null}
    </span>
  );
}
