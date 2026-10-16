"use client";

import * as React from "react";

export interface TocItem {
  id: string;
  title: string;
  depth: 2 | 3;
}

/** Right-hand "On This Page" navigation with scroll-spy highlighting. */
export function OnThisPage({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = React.useState(items[0]?.id);

  React.useEffect(() => {
    const headings = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;
  return (
    <nav aria-label="On this page" className="space-y-2.5 text-sm">
      <p className="font-medium text-muted-foreground">On This Page</p>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.id} className={item.depth === 3 ? "pl-3" : undefined}>
            <a
              href={`#${item.id}`}
              className={`block transition-colors ${activeId === item.id ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
