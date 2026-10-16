"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

/** Compact, copyable one-line shell command. */
export function InstallCommand({ command, className = "" }: { command: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      /* clipboard unavailable (insecure context) — ignore */
    }
  };

  return (
    <div
      className={`inline-flex max-w-full items-center gap-3 rounded-full border border-border bg-background/70 py-1.5 pl-4 pr-1.5 font-mono text-[13px] text-foreground/90 backdrop-blur ${className}`}
    >
      <span aria-hidden="true" className="select-none text-muted-foreground">
        $
      </span>
      <code className="min-w-0 truncate">{command}</code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy command"}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Command copied to clipboard" : ""}
      </span>
    </div>
  );
}
