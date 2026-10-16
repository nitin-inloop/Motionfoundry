"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { NavIndex } from "../lib/nav";

type Item = { href: string; label: string; group: string; hint: string };

/** Docs, design systems, and components from LISTED collections only (nav.components is pre-filtered). */
function toItems(nav: NavIndex): Item[] {
  const collectionNames = new Map(nav.collections.map((col) => [col.id, col.name]));
  return [
    ...nav.docs.map((d) => ({ href: `/docs/${d.slug}`, label: d.title, group: "Docs", hint: d.category })),
    ...nav.collections.map((col) => ({ href: `/collections/${col.id}`, label: `${col.name} collection`, group: "Collections", hint: `${col.count} components` })),
    ...nav.components
      .filter((c) => collectionNames.has(c.collection))
      .map((c) => ({
        href: `/components/${c.slug}`,
        label: c.name,
        group: collectionNames.get(c.collection) ?? "Components",
        hint: c.category,
      })),
    ...nav.designs.map((d) => ({ href: `/designs/${d.id}`, label: `${d.brand} design system`, group: "Designs", hint: d.category })),
  ];
}

export function CommandPalette({ open, onOpenChange, nav }: { open: boolean; onOpenChange: (v: boolean) => void; nav: NavIndex }) {
  const router = useRouter();
  const items = React.useMemo(() => toItems(nav), [nav]);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const results = items.filter((i) => !q || i.label.toLowerCase().includes(q) || i.hint.toLowerCase().includes(q) || i.group.toLowerCase().includes(q)).slice(0, 40);
  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));
  const go = (item?: Item) => {
    if (!item) return;
    onOpenChange(false);
    router.push(item.href);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-24" onClick={() => onOpenChange(false)}>
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-[#141414] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive(Math.min(activeIndex + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive(Math.max(activeIndex - 1, 0));
              } else if (e.key === "Enter") {
                go(results[activeIndex]);
              } else if (e.key === "Escape") {
                onOpenChange(false);
              }
            }}
            aria-label="Search"
            placeholder="Search docs, components, and design systems…"
            className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <ul className="mf-scrollbar max-h-80 overflow-y-auto p-2 text-sm" role="listbox" aria-label="Results">
          {results.length === 0 && <li className="px-3 py-6 text-center text-muted-foreground">No results.</li>}
          {results.map((item, idx) => (
            <li key={item.href} role="option" aria-selected={idx === activeIndex}>
              <button
                type="button"
                onMouseEnter={() => setActive(idx)}
                onClick={() => go(item)}
                className={`flex w-full items-center justify-between gap-4 rounded-md px-3 py-2 text-left ${idx === activeIndex ? "bg-muted text-foreground" : "text-foreground/80"}`}
              >
                <span className="truncate">{item.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {item.group} · {item.hint}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
