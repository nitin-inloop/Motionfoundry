import type * as React from "react";
import type { DesignTheme } from "./designs";

export type PreviewMode = "dark" | "light";

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

const SYSTEM_FONT = "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/** Neutral surfaces/text for each preview mode. Dark matches the site's default stage. */
const NEUTRAL_SURFACES: Record<PreviewMode, Pick<DesignTheme, "bg" | "surface" | "surfaceRaised" | "fg" | "muted" | "subtle" | "border" | "borderStrong">> = {
  dark: {
    bg: "#0a0a0a",
    surface: "#141414",
    surfaceRaised: "#1c1c1c",
    fg: "#fafafa",
    muted: "#a3a3a3",
    subtle: "#737373",
    border: "#262626",
    borderStrong: "#404040",
  },
  light: {
    bg: "#ffffff",
    surface: "#fafafa",
    surfaceRaised: "#f4f4f5",
    fg: "#0a0a0a",
    muted: "#525252",
    subtle: "#737373",
    border: "#e5e5e5",
    borderStrong: "#d4d4d4",
  },
};

/** The MotionFoundry default (no design preset) theme for each preview mode. */
export const NEUTRAL_THEMES: Record<PreviewMode, DesignTheme> = {
  dark: {
    ...NEUTRAL_SURFACES.dark,
    accent: "#fafafa",
    onAccent: "#0a0a0a",
    secondary: "#a3a3a3",
    radius: "8px",
    fontDisplay: SYSTEM_FONT,
    fontBody: SYSTEM_FONT,
    displayWeight: 600,
    displayTracking: "-0.02em",
  },
  light: {
    ...NEUTRAL_SURFACES.light,
    accent: "#0a0a0a",
    onAccent: "#ffffff",
    secondary: "#525252",
    radius: "8px",
    fontDisplay: SYSTEM_FONT,
    fontBody: SYSTEM_FONT,
    displayWeight: 600,
    displayTracking: "-0.02em",
  },
};

/** Relative luminance (0–1) of a #rgb / #rrggbb / rgb()/rgba() color, or undefined if unparseable. */
export function colorLuminance(color: string): number | undefined {
  const value = color.trim();
  let rgb: number[] | undefined;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i.exec(value);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split("").map((c) => c + c).join("") : hex[1];
    rgb = [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
  } else {
    const fn = /^rgba?\(([^)]+)\)$/i.exec(value);
    if (fn) rgb = fn[1].split(/[,\s/]+/).slice(0, 3).map((n) => Number.parseFloat(n));
  }
  if (!rgb || rgb.some((n) => Number.isNaN(n))) return undefined;
  const [r, g, b] = rgb.map((n) => {
    const c = n / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Whether a theme is dark, judged by its background. */
export function themeMode(theme: DesignTheme): PreviewMode {
  const l = colorLuminance(theme.bg);
  return l !== undefined && l < 0.4 ? "dark" : "light";
}

/**
 * Returns `theme` adapted to `mode`. A theme already in that mode is returned unchanged; otherwise
 * the brand identity (accent, secondary, radius, fonts) is kept and the surfaces/text are swapped for
 * neutral ones of the requested mode. Accents that would vanish on the new background (e.g. a black
 * accent on a dark stage) are swapped for the foreground color.
 */
export function themeForMode(theme: DesignTheme, mode: PreviewMode): DesignTheme {
  if (themeMode(theme) === mode) return theme;
  const surfaces = NEUTRAL_SURFACES[mode];
  const accentL = colorLuminance(theme.accent);
  const invisible = accentL !== undefined && (mode === "dark" ? accentL < 0.03 : accentL > 0.85);
  return {
    ...theme,
    ...surfaces,
    accent: invisible ? surfaces.fg : theme.accent,
    onAccent: invisible ? surfaces.bg : theme.onAccent,
  };
}

/**
 * Full style for a preview stage: --mf-* variables, base colors, and a dotted background whose
 * dots contrast with the mode (light dots on dark, dark dots on light).
 */
export function stageStyle(theme: DesignTheme, mode: PreviewMode = themeMode(theme)): React.CSSProperties {
  const dot = mode === "dark" ? "rgba(250, 250, 250, 0.07)" : "rgba(10, 10, 10, 0.08)";
  return {
    ...themeStyle(theme),
    backgroundImage: `radial-gradient(${dot} 1px, transparent 1px)`,
    backgroundSize: "18px 18px",
  };
}
