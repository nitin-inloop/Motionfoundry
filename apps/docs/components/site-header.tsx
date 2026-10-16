"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { BRAND_CONFIG } from "../lib/brand";
import type { NavIndex } from "../lib/nav";
import { CommandPalette } from "./command-palette";
import { GitHubIcon, LogoMark } from "./icons";

type NavItem = { href: string; label: string; match: (p: string) => boolean };

/** Home, Docs, one entry per listed collection (Scroll, Shaders, UI…), Designs, Changelog. */
function buildNav(nav: NavIndex): NavItem[] {
  const collectionOf = new Map(nav.components.map((c) => [`/components/${c.slug}`, c.collection]));
  return [
    { href: "/", label: "Home", match: (p) => p === "/" },
    { href: "/docs/getting-started", label: "Docs", match: (p) => p.startsWith("/docs") && p !== "/docs/changelog" },
    ...nav.collections.map((col) => ({
      href: `/collections/${col.id}`,
      label: col.name,
      match: (p: string) => p === `/collections/${col.id}` || collectionOf.get(p) === col.id,
    })),
    { href: "/designs", label: "Designs", match: (p) => p.startsWith("/designs") },
    { href: "/docs/changelog", label: "Changelog", match: (p) => p === "/docs/changelog" },
  ];
}

export function SiteHeader({ nav }: { nav: NavIndex }) {
  const pathname = usePathname() ?? "/";
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const NAV = React.useMemo(() => buildNav(nav), [nav]);

  return (
    <header className="sticky top-0 z-40 h-[var(--header-height)] bg-background">
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-6 px-4 md:px-8">
        <Link href="/" aria-label={`${BRAND_CONFIG.name} home`} className="flex shrink-0 items-center gap-2">
          <LogoMark size={28} className="h-7 w-7" />
          <span className="hidden font-semibold tracking-tight xl:inline">{BRAND_CONFIG.name}</span>
        </Link>
        <nav className="mf-scrollbar flex min-w-0 items-center gap-0.5 overflow-x-auto text-sm font-medium" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={item.match(pathname) ? "page" : undefined}
              className={`whitespace-nowrap rounded-md px-2.5 py-1.5 transition-colors ${
                item.match(pathname) ? "text-foreground" : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden h-9 w-64 items-center gap-2 rounded-lg bg-card px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-[#1f1f1f] md:flex xl:w-80"
          >
            <span className="flex-1 truncate">Search documentation…</span>
            <kbd className="rounded border border-border bg-background px-1.5 font-mono text-[11px]">⌘K</kbd>
          </button>
          <button type="button" aria-label="Search" onClick={() => setPaletteOpen(true)} className="rounded-md p-2 text-muted-foreground hover:text-foreground md:hidden">
            <Search className="h-4 w-4" />
          </button>
          <a
            href={BRAND_CONFIG.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 items-center gap-2 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <GitHubIcon className="h-[18px] w-[18px]" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
          <Link
            href="/docs/installation"
            className="flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span>Install</span>
          </Link>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} nav={nav} />
    </header>
  );
}
