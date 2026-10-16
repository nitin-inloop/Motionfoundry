"use client";

import * as React from "react";
import Link from "next/link";
import type { CatalogComponent, RegistryCollection } from "../lib/registry";
import { PreviewThumbnail } from "./component-preview";

const ALL = "All";

/** Thumbnails scale differently depending on how much room the component needs. */
const THUMB_SCALE: Record<string, number> = {
  "Animated Backgrounds and Visual Effects": 0.5,
  "High-End Animated Cards": 0.55,
  "Reveals and Continuous Motion": 0.5,
  "Developer-Interface Animations": 0.55,
};

export function ComponentCard({ component }: { component: CatalogComponent }) {
  return (
    <article className="group flex flex-col gap-3 rounded-2xl border border-border bg-card/40 p-3 transition hover:border-neutral-600">
      <PreviewThumbnail name={component.name} props={component.defaultProps} scale={THUMB_SCALE[component.category] ?? 0.66} />
      <Link href={`/components/${component.slug}`} className="flex flex-1 flex-col gap-1.5 rounded-lg px-1.5 pb-1 outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-foreground">{component.name}</h3>
          {component.collection === "studio-kit" ? (
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] text-sky-300">Studio Kit</span>
          ) : (
            <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">Core</span>
          )}
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{component.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2 font-mono text-[11px] text-muted-foreground">
          <span>{component.category}</span>
          <span className="text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground">Open →</span>
        </div>
      </Link>
    </article>
  );
}

export function ComponentCatalog({
  components,
  categories,
  collections,
  initialCollection = ALL,
  initialCategory = ALL,
  showCollectionFilter = true,
}: {
  components: CatalogComponent[];
  categories: string[];
  collections: RegistryCollection[];
  initialCollection?: string;
  initialCategory?: string;
  showCollectionFilter?: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [collection, setCollection] = React.useState(initialCollection);
  const [category, setCategory] = React.useState(initialCategory);

  const visibleCategories = categories.filter((c) => components.some((comp) => comp.category === c));
  const q = query.trim().toLowerCase();
  const filtered = components.filter(
    (c) =>
      (collection === ALL || c.collection === collection) &&
      (category === ALL || c.category === category) &&
      (!q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.tags.some((t) => t.includes(q)))
  );

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-3 py-1 text-xs transition ${
      active ? "border-transparent bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:border-neutral-600 hover:text-foreground/90"
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, description, or tag…"
          aria-label="Search components"
          className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground outline-none transition placeholder:text-neutral-600 focus:border-ring lg:max-w-sm"
        />
        {showCollectionFilter && (
          <div className="flex gap-1.5" role="group" aria-label="Filter by collection">
            {[{ id: ALL, name: "All collections" }, ...collections].map((c) => (
              <button key={c.id} type="button" aria-pressed={collection === c.id} onClick={() => setCollection(c.id)} className={chip(collection === c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mf-scrollbar flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filter by category">
        {[ALL, ...visibleCategories].map((c) => (
          <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={chip(category === c)}>
            {c}
          </button>
        ))}
      </div>
      <p className="font-mono text-xs text-muted-foreground" aria-live="polite">
        Showing {filtered.length} of {components.length} components
      </p>
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">No components match those filters.</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((comp) => (
            <ComponentCard key={comp.slug} component={comp} />
          ))}
        </div>
      )}
    </div>
  );
}
