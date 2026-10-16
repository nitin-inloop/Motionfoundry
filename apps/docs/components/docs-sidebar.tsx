"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavIndex } from "../lib/nav";

/** Friendlier sidebar labels for the doc `category` values in content/docs/*.mdx. */
const DOC_GROUP_LABEL: Record<string, string> = {
  Overview: "Getting Started",
  Configuration: "Setup",
  "Core Concepts": "Guides",
  "Quality & Standards": "Guides",
  "Open Source": "Project",
};

function SidebarLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  const ref = React.useRef<HTMLAnchorElement>(null);
  React.useEffect(() => {
    // Keep the current page visible inside the scrollable sidebar.
    if (active) ref.current?.scrollIntoView({ block: "nearest" });
  }, [active]);
  return (
    <Link
      ref={ref}
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-muted text-foreground" : "text-foreground/85 hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

function Group({ title, href, count, active, children }: { title: string; href?: string; count?: number; active?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      {href ? (
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={`flex items-center gap-2 px-2.5 pb-1.5 text-xs font-medium transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {title}
          {count !== undefined && <span className="ml-auto font-mono text-[11px] font-normal">{count}</span>}
        </Link>
      ) : (
        <div className="px-2.5 pb-1.5 text-xs font-medium text-muted-foreground">{title}</div>
      )}
      {children}
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <div className="px-2.5 pb-1 pt-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 first:pt-0">{children}</div>;
}

/** Groups items by a key, preserving first-seen order (or an explicit key order). */
function groupBy<T>(items: T[], key: (item: T) => string, order?: string[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const k of order ?? []) map.set(k, []);
  for (const item of items) {
    const k = key(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return [...map.entries()].filter(([, list]) => list.length > 0);
}

export function DocsSidebar({ nav }: { nav: NavIndex }) {
  const pathname = usePathname() ?? "";
  const docGroups = groupBy(nav.docs, (d) => DOC_GROUP_LABEL[d.category] ?? d.category);

  return (
    <aside
      aria-label="Documentation"
      className="mf-scrollbar sticky top-[var(--header-height)] hidden h-[calc(100vh-var(--header-height))] w-64 shrink-0 overflow-y-auto border-r border-border/60 py-8 pr-4 lg:block"
    >
      <div className="space-y-8">
        <Group title="Docs">
          {docGroups.map(([label, docs]) => (
            <React.Fragment key={label}>
              <SubHeading>{label}</SubHeading>
              {docs.map((d) => (
                <SidebarLink key={d.slug} href={`/docs/${d.slug}`} active={pathname === `/docs/${d.slug}`}>
                  {d.title}
                </SidebarLink>
              ))}
            </React.Fragment>
          ))}
        </Group>

        {/* Every component across all collections (including unlisted ones), ordered Scroll first. */}
        <SidebarLink href="/components" active={pathname === "/components"}>
          All Components
          <span className="ml-auto font-mono text-[11px] font-normal text-muted-foreground">{nav.allComponents.length}</span>
        </SidebarLink>

        {nav.collections.map((col) => {
          const items = nav.components.filter((c) => c.collection === col.id);
          const byCategory = groupBy(items, (c) => c.category, nav.categories);
          const href = `/collections/${col.id}`;
          return (
            <Group key={col.id} title={col.name} href={href} count={col.count} active={pathname === href}>
              {items.length === 0 && <p className="px-2.5 py-1 text-xs text-muted-foreground/70">Coming soon</p>}
              {byCategory.length > 1
                ? byCategory.map(([category, list]) => (
                    <React.Fragment key={category}>
                      <SubHeading>{category}</SubHeading>
                      {list.map((c) => (
                        <SidebarLink key={c.slug} href={`/components/${c.slug}`} active={pathname === `/components/${c.slug}`}>
                          {c.name}
                        </SidebarLink>
                      ))}
                    </React.Fragment>
                  ))
                : items.map((c) => (
                    <SidebarLink key={c.slug} href={`/components/${c.slug}`} active={pathname === `/components/${c.slug}`}>
                      {c.name}
                    </SidebarLink>
                  ))}
            </Group>
          );
        })}

        <Group title="Design Systems" href="/designs" count={nav.designs.length} active={pathname === "/designs"}>
          {nav.designs.map((d) => (
            <SidebarLink key={d.id} href={`/designs/${d.id}`} active={pathname === `/designs/${d.id}`}>
              <span className="h-3 w-3 shrink-0 rounded-full border border-white/15" style={{ background: d.accent }} aria-hidden="true" />
              {d.brand}
            </SidebarLink>
          ))}
        </Group>
      </div>
    </aside>
  );
}
