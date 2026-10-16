"use client";

import * as React from "react";
import { Check, Download } from "lucide-react";

export function ColorSwatch({ name, value, role }: { name: string; value: string; role: string }) {
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(id);
  }, [copied]);

  return (
    <button
      type="button"
      title={role || name}
      onClick={() => navigator.clipboard?.writeText(value).then(() => setCopied(true), () => setCopied(false))}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition hover:border-neutral-600"
    >
      <span className="relative block h-20 w-full" style={{ background: value }}>
        {copied && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
            <Check className="h-5 w-5" />
          </span>
        )}
      </span>
      <span className="space-y-0.5 p-3">
        <span className="block truncate text-[13px] font-medium text-foreground">{name}</span>
        <span className="block truncate font-mono text-xs text-muted-foreground">{copied ? "Copied!" : value}</span>
      </span>
    </button>
  );
}

export function DownloadDesignButton({ id, raw }: { id: string; raw: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const url = URL.createObjectURL(new Blob([raw], { type: "text/markdown" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `${id}-DESIGN.md`;
        a.click();
        URL.revokeObjectURL(url);
      }}
      className="inline-flex h-8 items-center gap-2 rounded-lg bg-foreground px-3 text-sm font-medium text-background hover:opacity-90"
    >
      <Download className="h-4 w-4" /> Download DESIGN.md
    </button>
  );
}
