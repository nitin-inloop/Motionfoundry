"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavIndex } from "../lib/nav";

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

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <div className="px-2.5 pb-1.5 text-xs font-medium text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

export function DocsSidebar({ nav }: { nav: NavIndex }) {
  const pathname = usePathname() ?? "";
  const core = nav.components.filter((c) => c.collection === "core");
  const studio = nav.components.filter((c) => c.collection === "studio-kit");

  return (
    <aside
      aria-label="Documentation"
      className="mf-scrollbar sticky top-[var(--header-height)] hidden h-[calc(100vh-var(--header-height))] w-64 shrink-0 overflow-y-auto border-r border-border/60 py-8 pr-4 lg:block"
    >
      <div className="space-y-8">
        <Group title="Sections">
          {nav.docs.map((d) => (
            <SidebarLink key={d.slug} href={`/docs/${d.slug}`} active={pathname === `/docs/${d.slug}`}>
              {d.title}
            </SidebarLink>
          ))}
        </Group>
        <Group title="Browse">
          <SidebarLink href="/components" active={pathname === "/components"}>
            All Components
          </SidebarLink>
          <SidebarLink href="/collections/studio-kit" active={pathname === "/collections/studio-kit"}>
            Studio Kit
          </SidebarLink>
          <SidebarLink href="/collections/core" active={pathname === "/collections/core"}>
            Core
          </SidebarLink>
          <SidebarLink href="/designs" active={pathname === "/designs"}>
            Design Systems
          </SidebarLink>
        </Group>
        <Group title="Design Systems">
          {nav.designs.map((d) => (
            <SidebarLink key={d.id} href={`/designs/${d.id}`} active={pathname === `/designs/${d.id}`}>
              <span className="h-3 w-3 shrink-0 rounded-full border border-white/15" style={{ background: d.accent }} aria-hidden="true" />
              {d.brand}
            </SidebarLink>
          ))}
        </Group>
        <Group title="Studio Kit">
          {studio.map((c) => (
            <SidebarLink key={c.slug} href={`/components/${c.slug}`} active={pathname === `/components/${c.slug}`}>
              {c.name}
            </SidebarLink>
          ))}
        </Group>
        <Group title="Core Components">
          {core.map((c) => (
            <SidebarLink key={c.slug} href={`/components/${c.slug}`} active={pathname === `/components/${c.slug}`}>
              {c.name}
            </SidebarLink>
          ))}
        </Group>
      </div>
    </aside>
  );
}
