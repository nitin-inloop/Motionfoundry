import * as React from "react";
import type { DesignTheme } from "../lib/designs";
import { themeStyle } from "../lib/theme-style";

/** A miniature landing page rendered with a design system's tokens. */
export function DesignMock({ brand, theme, size = "sm" }: { brand: string; theme: DesignTheme; size?: "sm" | "lg" }) {
  const lg = size === "lg";
  const display: React.CSSProperties = {
    fontFamily: theme.fontDisplay,
    fontWeight: theme.displayWeight,
    letterSpacing: theme.displayTracking,
    lineHeight: 1.05,
  };
  const button = (primary: boolean): React.CSSProperties => ({
    borderRadius: theme.radius,
    background: primary ? theme.accent : "transparent",
    color: primary ? theme.onAccent : theme.fg,
    border: `1px solid ${primary ? theme.accent : theme.borderStrong}`,
    padding: lg ? "0.6rem 1.15rem" : "0.35rem 0.75rem",
    fontSize: lg ? "0.9rem" : "0.7rem",
    fontWeight: 500,
    whiteSpace: "nowrap",
  });

  return (
    <div className={`flex h-full flex-col ${lg ? "gap-10 p-8 md:p-12" : "gap-5 p-5"}`} style={themeStyle(theme)}>
      <div className="flex items-center justify-between" style={{ fontSize: lg ? "0.9rem" : "0.7rem" }}>
        <span style={{ ...display, fontSize: lg ? "1.1rem" : "0.85rem" }}>{brand}</span>
        <span className="flex gap-3" style={{ color: theme.muted }}>
          <span>Product</span>
          <span>Docs</span>
          {lg && <span>Pricing</span>}
        </span>
      </div>
      <div className={lg ? "max-w-2xl space-y-5" : "space-y-2.5"}>
        <p style={{ ...display, fontSize: lg ? "clamp(2.25rem, 5vw, 3.75rem)" : "1.6rem" }}>Build what moves people.</p>
        <p style={{ color: theme.muted, fontSize: lg ? "1.05rem" : "0.72rem", lineHeight: 1.5 }}>
          {lg ? "Every surface, type ramp, and accent on this card comes from the brand's DESIGN.md tokens." : "Tokens straight from DESIGN.md."}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <span style={button(true)}>Get started</span>
          <span style={button(false)}>Learn more</span>
        </div>
      </div>
      <div className="mt-auto grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "10px", padding: lg ? "1rem" : "0.5rem" }}
          >
            <div style={{ height: lg ? 6 : 4, width: "45%", borderRadius: 4, background: i === 1 ? theme.accent : theme.borderStrong }} />
            <div style={{ height: lg ? 4 : 3, width: "80%", marginTop: lg ? 10 : 6, borderRadius: 4, background: theme.border }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PaletteStrip({ theme }: { theme: DesignTheme }) {
  const swatches = [theme.bg, theme.surface, theme.fg, theme.muted, theme.accent, theme.secondary];
  return (
    <div className="flex h-2 overflow-hidden rounded-full">
      {swatches.map((c, i) => (
        <span key={i} className="flex-1" style={{ background: c }} />
      ))}
    </div>
  );
}
