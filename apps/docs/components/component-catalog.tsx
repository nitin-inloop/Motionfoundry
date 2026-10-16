"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CatalogComponent, RegistryCollection } from "../lib/registry";
import {
  ALL,
  DEFAULT_FILTERS,
  ENGINE_OPTIONS,
  NEW_VERSION_LABEL,
  SORT_OPTIONS,
  isNewComponent,
  parseCatalogFilters,
  serializeCatalogFilters,
  type CatalogFilters,
  type SortMode,
} from "../lib/catalog-filters";
import { PreviewThumbnail } from "./component-preview";

/** Thumbnails scale differently depending on how much room the component needs. */
const THUMB_SCALE: Record<string, number> = {
  "Animated Backgrounds and Visual Effects": 0.5,
  "Gradient Backgrounds": 0.5,
  "Scroll Animations": 0.5,
  "High-End Animated Cards": 0.55,
  "Reveals and Continuous Motion": 0.5,
  "Developer-Interface Animations": 0.55,
  // UI primitives are small — keep them close to full size so they read at thumbnail scale.
  "Forms and Inputs": 0.8,
  // Overlays render their closed trigger; the open state is explored on the detail page.
  "Overlays and Menus": 0.8,
  Navigation: 0.75,
  // Tables, charts, and lists need more room.
  "Data Display": 0.6,
};

export function ComponentCard({ component, collectionName }: { component: CatalogComponent; collectionName?: string }) {
  const isNew = isNewComponent(component);
  return (
    <article className="group flex flex-col gap-3 rounded-2xl border border-border bg-card/40 p-3 transition hover:border-neutral-600">
      <PreviewThumbnail name={component.name} props={component.defaultProps} scale={THUMB_SCALE[component.category] ?? 0.66} />
      <Link href={`/components/${component.slug}`} className="flex flex-1 flex-col gap-1.5 rounded-lg px-1.5 pb-1 outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="flex items-center justify-between gap-2">
          <h3 className="min-w-0 truncate font-semibold text-foreground">{component.name}</h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {isNew && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300" title={`New in ${NEW_VERSION_LABEL}`}>
                New
              </span>
            )}
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${
                component.collection === "core" ? "border-border text-muted-foreground" : "border-sky-500/30 bg-sky-500/10 text-sky-300"
              }`}
            >
              {collectionName ?? component.collection}
            </span>
          </div>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{component.description}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 font-mono text-[11px] text-muted-foreground">
          <span className="min-w-0 truncate">{component.category}</span>
          <span className="shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground">Open →</span>
        </div>
      </Link>
    </article>
  );
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff) return diff;
  }
  return 0;
}

function sortComponents(list: CatalogComponent[], sort: SortMode, order: Map<string, number>): CatalogComponent[] {
  const byOrder = (a: CatalogComponent, b: CatalogComponent) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0);
  const sorted = [...list];
  if (sort === "az") sorted.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "newest")
    sorted.sort((a, b) => b.addedAt.localeCompare(a.addedAt) || compareVersions(b.version, a.version) || byOrder(a, b));
  else sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || byOrder(a, b));
  return sorted;
}

const chip = (active: boolean) =>
  `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs transition outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    active ? "border-transparent bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:border-neutral-600 hover:text-foreground/90"
  }`;

function Count({ value, active }: { value: number; active: boolean }) {
  return <span className={`font-mono text-[10px] tabular-nums ${active ? "text-background/60" : "text-neutral-500"}`}>{value}</span>;
}

/** Remembers the last few query strings we pushed, so the server echo of our own writes is ignored. */
const MAX_REMEMBERED_WRITES = 8;

export function ComponentCatalog({
  components,
  categories,
  collections,
  initialFilters,
  lockedCollection,
  readUrlOnMount = false,
}: {
  components: CatalogComponent[];
  categories: string[];
  collections: RegistryCollection[];
  /** Filters parsed from searchParams on the server. Changes from outside (e.g. link navigation) reset state. */
  initialFilters?: CatalogFilters;
  /** Pins the catalog to one collection and hides the collection chips (collection pages). */
  lockedCollection?: string;
  /** For statically rendered pages: read filters from window.location after hydration. */
  readUrlOnMount?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const locked = Boolean(lockedCollection);
  const withLock = React.useCallback(
    (f: CatalogFilters): CatalogFilters => (lockedCollection ? { ...f, collection: lockedCollection } : f),
    [lockedCollection]
  );

  const [filters, setFilters] = React.useState<CatalogFilters>(() => withLock(initialFilters ?? DEFAULT_FILTERS));
  const query = serializeCatalogFilters(filters, { lockedCollection: locked });
  const initialQuery = initialFilters ? serializeCatalogFilters(withLock(initialFilters), { lockedCollection: locked }) : null;
  const written = React.useRef<string[]>([initialQuery ?? query]);

  // Static pages can't read searchParams on the server — pick them up after hydration instead.
  React.useEffect(() => {
    if (!readUrlOnMount || !window.location.search) return;
    const parsed = withLock(
      parseCatalogFilters(new URLSearchParams(window.location.search), {
        collections: collections.map((c) => c.id),
        categories,
        lockedCollection,
      })
    );
    written.current = [serializeCatalogFilters(parsed, { lockedCollection: locked })];
    setFilters(parsed);
    // Mount-only by design.
  }, []);

  // External navigation to a different filtered URL: adopt the server-parsed filters.
  React.useEffect(() => {
    if (initialQuery === null || !initialFilters || written.current.includes(initialQuery)) return;
    written.current = [initialQuery];
    setFilters(withLock(initialFilters));
    // initialQuery is the canonical serialization of initialFilters.
  }, [initialQuery]);

  // Mirror state into the query string so filtered views are shareable. Debounced so typing stays cheap.
  React.useEffect(() => {
    const current = window.location.search.replace(/^\?/, "");
    if (current === query) return;
    const id = window.setTimeout(() => {
      written.current = [...written.current.slice(-(MAX_REMEMBERED_WRITES - 1)), query];
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 250);
    return () => window.clearTimeout(id);
  }, [query, pathname, router]);

  const update = (patch: Partial<CatalogFilters>) => setFilters((f) => withLock({ ...f, ...patch }));

  // Filtering runs against a deferred search term so keystrokes never wait on the card grid.
  const deferredQ = React.useDeferredValue(filters.q);
  const q = deferredQ.trim().toLowerCase();

  const order = React.useMemo(() => new Map(components.map((c, i) => [c.slug, i])), [components]);
  const collectionNames = React.useMemo(() => new Map(collections.map((c) => [c.id, c.name])), [collections]);
  // The server passes only listed collections (already sorted by order); keep every one as a chip,
  // even if it is still empty, so the chip row is stable (Scroll, Shaders, UI).
  const shownCollections = collections;

  /** Components matching search, engine and the "new" toggle — the base for every faceted count. */
  const base = React.useMemo(
    () =>
      components.filter(
        (c) =>
          (filters.engine === "all" || (filters.engine === "motion" ? c.requiresMotion : !c.requiresMotion)) &&
          (!filters.onlyNew || isNewComponent(c)) &&
          (!q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.tags.some((t) => t.toLowerCase().includes(q)))
      ),
    [components, filters.engine, filters.onlyNew, q]
  );

  const inCollection = (c: CatalogComponent, collection: string) => collection === ALL || c.collection === collection;
  const inCategory = (c: CatalogComponent, category: string) => category === ALL || c.category === category;

  const collectionCounts = React.useMemo(() => {
    const counts = new Map<string, number>([[ALL, 0]]);
    for (const c of base) {
      if (!inCategory(c, filters.category)) continue;
      counts.set(ALL, (counts.get(ALL) ?? 0) + 1);
      counts.set(c.collection, (counts.get(c.collection) ?? 0) + 1);
    }
    return counts;
  }, [base, filters.category]);

  /** Categories that exist in the selected collection (independent of search), in registry order. */
  const visibleCategories = React.useMemo(() => {
    const present = new Set(components.filter((c) => inCollection(c, filters.collection)).map((c) => c.category));
    return categories.filter((c) => present.has(c) || c === filters.category);
  }, [categories, components, filters.collection, filters.category]);

  const categoryCounts = React.useMemo(() => {
    const counts = new Map<string, number>([[ALL, 0]]);
    for (const c of base) {
      if (!inCollection(c, filters.collection)) continue;
      counts.set(ALL, (counts.get(ALL) ?? 0) + 1);
      counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    }
    return counts;
  }, [base, filters.collection]);

  const filtered = React.useMemo(
    () =>
      sortComponents(
        base.filter((c) => inCollection(c, filters.collection) && inCategory(c, filters.category)),
        filters.sort,
        order
      ),
    [base, filters.collection, filters.category, filters.sort, order]
  );

  const newCount = React.useMemo(() => components.filter(isNewComponent).length, [components]);

  const activeCount =
    (filters.q.trim() ? 1 : 0) +
    (!locked && filters.collection !== ALL ? 1 : 0) +
    (filters.category !== ALL ? 1 : 0) +
    (filters.engine !== "all" ? 1 : 0) +
    (filters.onlyNew ? 1 : 0);

  const clearFilters = () =>
    update({ q: "", category: ALL, engine: "all", onlyNew: false, ...(locked ? {} : { collection: ALL }) });

  const selectCollection = (id: string) =>
    setFilters((f) => {
      const keepCategory = f.category === ALL || components.some((c) => inCollection(c, id) && c.category === f.category);
      return withLock({ ...f, collection: id, category: keepCategory ? f.category : ALL });
    });

  const searchId = React.useId();
  const sortId = React.useId();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <label htmlFor={searchId} className="sr-only">
            Search components
          </label>
          <input
            id={searchId}
            type="search"
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Search by name, description, or tag…"
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground outline-none transition placeholder:text-neutral-600 focus:border-ring sm:max-w-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {newCount > 0 && (
            <button
              type="button"
              aria-pressed={filters.onlyNew}
              onClick={() => update({ onlyNew: !filters.onlyNew })}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-xs transition outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                filters.onlyNew
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                  : "border-border bg-card text-muted-foreground hover:border-neutral-600 hover:text-foreground/90"
              }`}
            >
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${filters.onlyNew ? "bg-emerald-300" : "bg-neutral-600"}`} />
              New in {NEW_VERSION_LABEL}
              <Count value={newCount} active={false} />
            </button>
          )}
          <label htmlFor={sortId} className="sr-only">
            Sort components
          </label>
          <div className="relative">
            <select
              id={sortId}
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as SortMode })}
              className="appearance-none rounded-lg border border-border bg-card py-2 pl-3 pr-8 text-xs text-foreground outline-none transition hover:border-neutral-600 focus:border-ring"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  Sort: {o.label}
                </option>
              ))}
            </select>
            <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
              ▾
            </span>
          </div>
        </div>
      </div>

      {!locked && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by collection">
          {[{ id: ALL, name: "All collections" }, ...shownCollections].map((c) => {
            const active = filters.collection === c.id;
            return (
              <button key={c.id} type="button" aria-pressed={active} onClick={() => selectCollection(c.id)} className={chip(active)}>
                {c.name}
                <Count value={collectionCounts.get(c.id) ?? 0} active={active} />
              </button>
            );
          })}
        </div>
      )}

      <div className="mf-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by category">
        {[ALL, ...visibleCategories].map((c) => {
          const active = filters.category === c;
          return (
            <button key={c} type="button" aria-pressed={active} onClick={() => update({ category: c })} className={chip(active)}>
              {c === ALL ? "All categories" : c}
              <Count value={categoryCounts.get(c) ?? 0} active={active} />
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5" role="group" aria-label="Filter by animation engine">
          {ENGINE_OPTIONS.map((o) => {
            const active = filters.engine === o.id;
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={active}
                onClick={() => update({ engine: o.id })}
                className={`rounded-md px-3 py-1 text-xs transition outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground/90"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
          <p aria-live="polite" aria-atomic="true">
            Showing {filtered.length} of {components.length} components
          </p>
          {activeCount > 0 && (
            <>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px]">
                {activeCount} active filter{activeCount === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded text-foreground/80 underline decoration-neutral-600 underline-offset-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No components match those filters.{" "}
          {activeCount > 0 && (
            <button type="button" onClick={clearFilters} className="text-foreground/80 underline underline-offset-4 hover:text-foreground">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((comp) => (
            <ComponentCard key={comp.slug} component={comp} collectionName={collectionNames.get(comp.collection)} />
          ))}
        </div>
      )}
    </div>
  );
}
