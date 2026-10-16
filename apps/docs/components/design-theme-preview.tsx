"use client";

import * as React from "react";
import type { DesignTheme } from "../lib/designs";
import { themeForMode, themeStyle, type PreviewMode } from "../lib/theme-style";
import { DesignMock } from "./design-mock";
import { PreviewModeToggle } from "./preview-mode";

/**
 * Theme preview for a design-system page: the landing-page mock plus a panel of live components
 * (passed as children, rendered on the server) that read the --mf-* variables. Starts in the design's
 * own mode; the Dark | Light toggle derives the opposite-mode variant via themeForMode.
 */
export function DesignThemePreview({
  brand,
  theme,
  initialMode,
  children,
}: {
  brand: string;
  theme: DesignTheme;
  initialMode: PreviewMode;
  children: React.ReactNode;
}) {
  const [mode, setMode] = React.useState<PreviewMode>(initialMode);
  const active = themeForMode(theme, mode);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{mode === initialMode ? `Native ${initialMode} canvas` : `Derived ${mode} variant`}</span>
        <PreviewModeToggle mode={mode} onChange={setMode} />
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <DesignMock brand={brand} theme={active} size="lg" />
      </div>
      <div className="space-y-3 rounded-xl border border-border p-4 transition-colors" style={themeStyle(active)} data-preview-mode={mode}>
        {children}
      </div>
    </div>
  );
}
