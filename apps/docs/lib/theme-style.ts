import type * as React from "react";
import type { DesignTheme } from "./designs";

/**
 * Maps a design theme onto the --mf-* variables every MotionFoundry component reads
 * (each CSS Module uses `var(--mf-token, <default>)`), plus base colors for the wrapper itself.
 */
export function themeStyle(theme: DesignTheme): React.CSSProperties {
  return {
    "--mf-bg": theme.bg,
    "--mf-surface": theme.surface,
    "--mf-surface-raised": theme.surfaceRaised,
    "--mf-fg": theme.fg,
    "--mf-muted": theme.muted,
    "--mf-subtle": theme.subtle,
    "--mf-border": theme.border,
    "--mf-border-strong": theme.borderStrong,
    "--mf-accent": theme.accent,
    backgroundColor: theme.bg,
    color: theme.fg,
    fontFamily: theme.fontBody,
  } as React.CSSProperties;
}

/** Picks a theme color for a component's color prop, based on what the prop is for. */
export function themeColorFor(prop: string, index: number, theme: DesignTheme): string {
  const p = prop.toLowerCase();
  if (p.includes("text")) return theme.onAccent.startsWith("#") ? theme.onAccent : "#ffffff";
  if (p.includes("base")) return theme.subtle.startsWith("#") ? theme.subtle : theme.accent;
  if (p.includes("secondary") || p.includes("to") || p.includes("colorb")) return theme.secondary;
  return index % 2 === 0 ? theme.accent : theme.secondary;
}
