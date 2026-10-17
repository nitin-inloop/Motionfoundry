"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus, Search, X } from "lucide-react";
import { BRAND_CONFIG } from "../lib/brand";
import type { NavIndex } from "../lib/nav";
import { CommandPalette } from "./command-palette";
import { GitHubIcon, LogoMark } from "./icons";

type NavItem = { href: string; label: string; match: (p: string) => boolean };

/** Home, Docs, Components (all), one entry per listed collection (Scroll, Shaders, UI…), Designs, Changelog. */
function buildNav(nav: NavIndex): NavItem[] {
  const collectionOf = new Map(nav.allComponents.map((c) => [`/components/${c.slug}`, c.collection]));
  const listedIds = new Set(nav.collections.map((col) => col.id));
  const knownIds = new Set(nav.allCollections.map((col) => col.id));
  return [
    { href: "/", label: "Home", match: (p) => p === "/" },
    { href: "/docs/getting-started", label: "Docs", match: (p) => p.startsWith("/docs") && p !== "/docs/changelog" },
    {
      // Opens the first component directly (Scroll first) — there is no catalog grid.
      href: nav.components[0] ? `/components/${nav.components[0].slug}` : "/components",
      label: "Components",
      // Component pages highlight their collection; only unlisted collections (no header item of their own) fall back to "Components".
      match: (p: string) => {
        if (p === "/components") return true;
        const owner = collectionOf.get(p) ?? (p.startsWith("/collections/") ? p.slice("/collections/".length) : undefined);
        // Only real collections count — an unknown /collections/<id> is a 404 and highlights nothing.
        return owner !== undefined && knownIds.has(owner) && !listedIds.has(owner);
      },
    },
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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const NAV = React.useMemo(() => buildNav(nav), [nav]);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 h-[var(--header-height)] bg-background">
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-4 px-4 md:gap-6 md:px-8">
        <Link href="/" aria-label={`${BRAND_CONFIG.name} home`} className="flex shrink-0 items-center gap-2">
          <LogoMark size={28} className="h-7 w-7" />
          <span className="hidden font-semibold tracking-tight sm:inline">{BRAND_CONFIG.name}</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="mf-scrollbar hidden min-w-0 items-center gap-0.5 overflow-x-auto text-sm font-medium md:flex" aria-label="Main">
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
            className="hidden h-9 items-center gap-2 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            <GitHubIcon className="h-[18px] w-[18px]" />
            <span className="hidden lg:inline">GitHub</span>
          </a>
          <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
          <Link
            href="/docs/installation"
            className="hidden h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-sm font-medium text-background transition-opacity hover:opacity-90 sm:flex"
          >
            <Plus className="h-4 w-4" />
            <span>Install</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-foreground/80 hover:bg-muted md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 top-[var(--header-height)] z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
          <nav
            className="fixed inset-x-0 top-[var(--header-height)] z-40 max-h-[calc(100vh-var(--header-height))] overflow-y-auto border-b border-border bg-background px-4 pb-6 pt-3 md:hidden"
            aria-label="Mobile navigation"
          >
            <div className="space-y-1">
              {NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={item.match(pathname) ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors ${
                    item.match(pathname) ? "bg-muted text-foreground" : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/docs/installation"
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Install
                </Link>
                <a
                  href={BRAND_CONFIG.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <GitHubIcon className="h-[18px] w-[18px]" />
                  GitHub
                </a>
              </div>
            </div>
          </nav>
        </>
      )}

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} nav={nav} />
    </header>
  );
}
