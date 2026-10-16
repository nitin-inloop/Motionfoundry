import * as React from "react";
import Link from "next/link";
import { LazyMount } from "../component-preview";

/** Section heading row shared by every landing section. */
export function SectionHeader({
  id,
  eyebrow,
  count,
  title,
  description,
  href,
  linkLabel,
}: {
  id: string;
  eyebrow: string;
  count?: number;
  title: React.ReactNode;
  description: React.ReactNode;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 max-w-2xl space-y-3">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span>{eyebrow}</span>
          {count ? (
            <>
              <span aria-hidden="true" className="h-px w-6 bg-border" />
              <span>{count} components</span>
            </>
          ) : null}
        </div>
        <h2 id={id} className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Link
        href={href}
        className="group inline-flex shrink-0 items-center gap-1.5 text-sm text-foreground/80 transition hover:text-foreground"
      >
        {linkLabel}
        <span aria-hidden="true" className="transition group-hover:translate-x-0.5">
          →
        </span>
      </Link>
    </div>
  );
}

/**
 * Below-the-fold live demo: a fixed-height stage (no layout shift) that only mounts its
 * component near the viewport, with a footer link to the component page.
 */
export function DemoFrame({
  slug,
  title,
  stageClassName,
  hint,
  className = "",
  padded = true,
  children,
}: {
  slug: string;
  title: string;
  stageClassName: string;
  hint?: string;
  className?: string;
  padded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card/40 transition hover:border-neutral-700 ${className}`}>
      <div className={`mf-stage relative min-h-0 flex-1 overflow-hidden ${stageClassName}`}>
        <LazyMount className={`absolute inset-0 flex items-center justify-center overflow-hidden ${padded ? "p-5" : ""}`}>{children}</LazyMount>
        {hint && (
          <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full border border-border bg-background/80 px-2.5 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur">
            {hint}
          </span>
        )}
      </div>
      <Link
        href={`/components/${slug}`}
        className="flex shrink-0 items-center justify-between border-t border-border px-4 py-2.5 text-sm"
      >
        <span className="truncate font-medium text-foreground/90">{title}</span>
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground transition group-hover:text-foreground/90">Open →</span>
      </Link>
    </div>
  );
}

/** Live shader swatch; the whole tile links to the component page. */
export function ShaderTile({
  slug,
  title,
  caption,
  className = "",
  children,
}: {
  slug: string;
  title: string;
  caption?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`/components/${slug}`}
      className={`group relative block min-w-0 overflow-hidden rounded-2xl border border-border bg-card transition hover:border-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      <LazyMount className="pointer-events-none absolute inset-0 overflow-hidden">{children}</LazyMount>
      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-3 pt-12">
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-white">{title}</span>
          {caption && <span className="block truncate text-xs text-white/60">{caption}</span>}
        </span>
        <span className="shrink-0 font-mono text-[10px] text-white/60 transition group-hover:translate-x-0.5 group-hover:text-white">Open →</span>
      </span>
    </Link>
  );
}

/** Forces a shader background to fill its tile (beats the component's inline height/border/radius). */
export const FILL = "!h-full !w-full !rounded-none !border-0";

/** Empty child suppresses a shader's built-in demo copy so only the effect shows. */
export const BLANK = <span aria-hidden="true" />;
