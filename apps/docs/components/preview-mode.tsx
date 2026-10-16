"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import type { PreviewMode } from "../lib/theme-style";

const STORAGE_KEY = "mf-preview-mode";

/**
 * The user's preferred preview mode (default "dark"), persisted in localStorage.
 * Read after mount so server and first client render agree (no hydration mismatch).
 */
export function useStoredPreviewMode(): [PreviewMode, (mode: PreviewMode) => void] {
  const [mode, setMode] = React.useState<PreviewMode>("dark");
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") setMode(stored);
    } catch {
      // Storage unavailable (privacy mode) — keep the default.
    }
  }, []);
  const update = React.useCallback((next: PreviewMode) => {
    setMode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage failures.
    }
  }, []);
  return [mode, update];
}

/** Dark | Light segmented control for preview stages. */
export function PreviewModeToggle({ mode, onChange }: { mode: PreviewMode; onChange: (mode: PreviewMode) => void }) {
  const options: { id: PreviewMode; label: string; Icon: typeof Moon }[] = [
    { id: "dark", label: "Dark", Icon: Moon },
    { id: "light", label: "Light", Icon: Sun },
  ];
  return (
    <div role="group" aria-label="Preview background" className="inline-flex h-8 items-center rounded-md bg-muted p-0.5">
      {options.map(({ id, label, Icon }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(id)}
            className={`flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
