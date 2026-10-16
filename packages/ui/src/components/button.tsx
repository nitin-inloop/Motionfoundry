"use client";

import * as React from "react";
import styles from "../styles/button.module.css";

type BuiltInIcon = "none" | "arrow" | "plus" | "download" | "sparkle" | "check";

export interface ButtonProps {
  /** Button text (ignored when children are passed) */
  label?: string;
  /** Custom content; overrides `label` */
  children?: React.ReactNode;
  /** Visual style */
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  /** Size preset; `icon` renders a square icon-only button (uses `label` as its accessible name) */
  size?: "sm" | "md" | "lg" | "icon";
  /** Built-in inline SVG icon used when no custom icon slot is provided */
  icon?: BuiltInIcon;
  /** Where the built-in icon sits */
  iconPosition?: "leading" | "trailing";
  /** Custom leading icon slot (overrides the built-in icon) */
  leadingIcon?: React.ReactNode;
  /** Custom trailing icon slot (overrides the built-in icon) */
  trailingIcon?: React.ReactNode;
  /** Show a spinner and block interaction */
  loading?: boolean;
  /** Text shown while loading (defaults to the label) */
  loadingText?: string;
  /** Disable the button */
  disabled?: boolean;
  /** Scale applied while pressed (1 = none) */
  pressScale?: number;
  /** Brand color for the default and link variants */
  accentColor?: string;
  /** Stretch to the container width */
  fullWidth?: boolean;
  /** Render an <a> with this href instead of a <button> */
  href?: string;
  /** Anchor target when `href` is set */
  target?: string;
  /** Native button type */
  type?: "button" | "submit" | "reset";
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  /** Optional className merged onto the root */
  className?: string;
  /** Optional inline styles merged onto the root */
  style?: React.CSSProperties;
}

const ICON_PATHS: Record<Exclude<BuiltInIcon, "none">, string> = {
  arrow: "M5 12h14M13 6l6 6-6 6",
  plus: "M12 5v14M5 12h14",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  check: "M5 12.5l4.5 4.5L19 7",
};

function Icon({ name }: { name: Exclude<BuiltInIcon, "none"> }) {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

export function Button({
  label = "Get started",
  children,
  variant = "default",
  size = "md",
  icon = "arrow",
  iconPosition = "trailing",
  leadingIcon,
  trailingIcon,
  loading = false,
  loadingText = "",
  disabled = false,
  pressScale = 0.97,
  accentColor = "#6366f1",
  fullWidth = false,
  href,
  target,
  type = "button",
  onClick,
  className = "",
  style,
}: ButtonProps) {
  const inactive = disabled || loading;
  const isIconOnly = size === "icon";
  const builtIn = icon !== "none" ? <Icon name={icon} /> : null;
  const lead = leadingIcon ?? (iconPosition === "leading" || isIconOnly ? builtIn : null);
  const trail = trailingIcon ?? (iconPosition === "trailing" && !isIconOnly ? builtIn : null);
  const text = loading && loadingText ? loadingText : children ?? label;

  const cls = [styles.root, styles[variant], styles[size], fullWidth ? styles.full : "", className].filter(Boolean).join(" ");
  const rootStyle = { "--mf-btn-accent": accentColor, "--mf-btn-press": String(pressScale), ...style } as React.CSSProperties;

  const content = (
    <>
      <span className={styles.spinnerSlot} data-on={loading || undefined} aria-hidden="true">
        <span className={styles.spinner} />
      </span>
      {lead && !(isIconOnly && loading) ? <span className={styles.glyph}>{lead}</span> : null}
      {isIconOnly ? null : <span className={styles.label}>{text}</span>}
      {trail ? <span className={`${styles.glyph} ${styles.trail}`}>{trail}</span> : null}
    </>
  );

  const shared = {
    className: cls,
    style: rootStyle,
    "data-loading": loading || undefined,
    "aria-busy": loading || undefined,
    "aria-label": isIconOnly ? label : undefined,
  };

  if (href) {
    return (
      <a
        {...shared}
        href={inactive ? undefined : href}
        target={target}
        rel={target === "_blank" ? "noreferrer noopener" : undefined}
        aria-disabled={inactive || undefined}
        role={inactive ? "link" : undefined}
        tabIndex={inactive ? 0 : undefined}
        onClick={(e) => {
          if (inactive) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <button {...shared} type={type} disabled={disabled} aria-disabled={loading || undefined} onClick={(e) => !inactive && onClick?.(e)}>
      {content}
    </button>
  );
}
