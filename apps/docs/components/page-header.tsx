"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Copy, ExternalLink } from "lucide-react";

export interface PageLink {
  href: string;
  title: string;
}

function CopyPageButton({ markdown, sourceUrl }: { markdown: string; sourceUrl?: string }) {
  const [copied, setCopied] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  React.useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menuOpen]);

  const copy = () => {
    navigator.clipboard?.writeText(markdown).then(() => setCopied(true), () => setCopied(false));
    setMenuOpen(false);
  };

  return (
    <div ref={menuRef} className="relative flex items-center rounded-lg bg-card text-sm">
      <button type="button" onClick={copy} className="flex h-8 items-center gap-2 rounded-l-lg px-3 font-medium hover:bg-muted">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy Page"}
      </button>
      <span className="h-4 w-px bg-border" aria-hidden="true" />
      <button
        type="button"
        aria-label="More page actions"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onClick={() => setMenuOpen((o) => !o)}
        className="flex h-8 items-center rounded-r-lg px-2 hover:bg-muted"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      {menuOpen && (
        <div role="menu" className="absolute right-0 top-10 z-20 w-56 rounded-lg border border-border bg-[#141414] p-1 shadow-xl">
          <button type="button" role="menuitem" onClick={copy} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left hover:bg-muted">
            <Copy className="h-4 w-4" /> Copy page as Markdown
          </button>
          {sourceUrl && (
            <a role="menuitem" href={sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md px-2.5 py-2 hover:bg-muted">
              <ExternalLink className="h-4 w-4" /> View source on GitHub
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow,
  markdown,
  sourceUrl,
  previous,
  next,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  markdown?: string;
  sourceUrl?: string;
  previous?: PageLink;
  next?: PageLink;
  children?: React.ReactNode;
}) {
  const arrow = "flex h-8 w-8 items-center justify-center rounded-lg bg-card transition-colors hover:bg-muted";
  return (
    <header className="space-y-3">
      {eyebrow && <div className="flex flex-wrap items-center gap-2">{eyebrow}</div>}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        <div className="flex items-center gap-2 pt-1">
          {markdown && <CopyPageButton markdown={markdown} sourceUrl={sourceUrl} />}
          {previous ? (
            <Link href={previous.href} aria-label={`Previous: ${previous.title}`} title={previous.title} className={arrow}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          ) : (
            <span className={`${arrow} opacity-40`} aria-hidden="true">
              <ArrowLeft className="h-4 w-4" />
            </span>
          )}
          {next ? (
            <Link href={next.href} aria-label={`Next: ${next.title}`} title={next.title} className={arrow}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className={`${arrow} opacity-40`} aria-hidden="true">
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
      {description && <p className="text-lg text-muted-foreground">{description}</p>}
      {children}
    </header>
  );
}

export function PagerFooter({ previous, next }: { previous?: PageLink; next?: PageLink }) {
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 border-t border-border pt-6 text-sm">
      {previous ? (
        <Link href={previous.href} className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 font-medium hover:bg-muted">
          <ArrowLeft className="h-4 w-4" /> {previous.title}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 font-medium hover:bg-muted">
          {next.title} <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
