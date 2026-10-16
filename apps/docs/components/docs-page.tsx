import * as React from "react";
import Link from "next/link";
import { BRAND_CONFIG } from "../lib/brand";
import { OnThisPage, type TocItem } from "./on-this-page";

/** "Deploy your shadcn/ui app on Vercel"-style card under the table of contents. */
export function PromoCard() {
  return (
    <div className="space-y-3 rounded-xl bg-card p-6">
      <p className="text-lg font-semibold leading-snug text-foreground/90">Theme every component with a real design system</p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        11 brand DESIGN.md files — Vercel, Cursor, Claude, Apple, Spotify and more — ready to apply as presets in any playground.
      </p>
      <Link href="/designs" className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted">
        Browse Designs
      </Link>
      <p className="pt-2 text-xs text-muted-foreground">
        Open source on{" "}
        <a href={BRAND_CONFIG.repoUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">
          GitHub
        </a>
        .
      </p>
    </div>
  );
}

/**
 * Center column + right rail of the docs shell. Pass `toc` for the "On This Page" rail;
 * pages without one (catalogs, galleries) get the extra width instead.
 */
export function DocsPage({ toc, wide = false, children }: { toc?: TocItem[]; wide?: boolean; children: React.ReactNode }) {
  const hasRail = toc !== undefined;
  return (
    <div className="flex min-w-0 flex-1 gap-12">
      <article className={`mx-auto min-w-0 flex-1 space-y-8 py-10 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>{children}</article>
      {hasRail && (
        <aside className="mf-scrollbar sticky top-[var(--header-height)] hidden h-[calc(100vh-var(--header-height))] w-72 shrink-0 space-y-10 overflow-y-auto py-10 xl:block">
          <OnThisPage items={toc} />
          <PromoCard />
        </aside>
      )}
    </div>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl bg-card px-5 py-4 text-[15px] leading-relaxed text-foreground/90">{children}</div>;
}

/** Section heading with an id so it can be targeted from the table of contents. */
export function SectionHeading({ id, children, sub = false }: { id: string; children: React.ReactNode; sub?: boolean }) {
  return sub ? (
    <h3 id={id} className="scroll-mt-24 text-lg font-semibold tracking-tight">
      {children}
    </h3>
  ) : (
    <h2 id={id} className="scroll-mt-24 border-b border-border pb-2 text-2xl font-semibold tracking-tight">
      {children}
    </h2>
  );
}
