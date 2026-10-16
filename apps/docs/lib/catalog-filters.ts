/**
 * Catalog filter state shared by the server page (parsing searchParams) and the client catalog
 * (URL sync). Deliberately free of registry.json imports so client bundles stay small.
 */

/** The current release; its label is used for the "New in vX.Y" filter. */
export const NEW_VERSION = "2.4.1";
/** Short label for NEW_VERSION, e.g. "v2.4". */
export const NEW_VERSION_LABEL = `v${NEW_VERSION.split(".").slice(0, 2).join(".")}`;
/** Last version published to npm — anything added after it counts as new. */
export const LAST_PUBLISHED_VERSION = "2.1.0";

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  return 0;
}

export function isNewComponent(component: { version: string }): boolean {
  return compareVersions(component.version, LAST_PUBLISHED_VERSION) > 0;
}

export const ALL = "All";

export type Engine = "all" | "motion" | "css";
export type SortMode = "featured" | "newest" | "az";

export interface CatalogFilters {
  q: string;
  collection: string;
  category: string;
  engine: Engine;
  sort: SortMode;
  onlyNew: boolean;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  q: "",
  collection: ALL,
  category: ALL,
  engine: "all",
  sort: "featured",
  onlyNew: false,
};

export const ENGINE_OPTIONS: { id: Engine; label: string }[] = [
  { id: "all", label: "All" },
  { id: "motion", label: "Motion" },
  { id: "css", label: "Pure CSS" },
];

export const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "az", label: "A–Z" },
];

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Parses (and validates) URL query params into filter state. Unknown values fall back to defaults. */
export function parseCatalogFilters(
  params: RawParams | URLSearchParams,
  options: { collections: string[]; categories: string[]; lockedCollection?: string }
): CatalogFilters {
  const get = (key: string) => (params instanceof URLSearchParams ? params.get(key) ?? undefined : first(params[key]));
  const collection = options.lockedCollection ?? get("collection");
  const category = get("category");
  const engine = get("engine");
  const sort = get("sort");
  const onlyNew = get("new");
  return {
    q: (get("q") ?? "").slice(0, 100),
    collection: collection && options.collections.includes(collection) ? collection : ALL,
    category: category && options.categories.includes(category) ? category : ALL,
    engine: engine === "motion" || engine === "css" ? engine : "all",
    sort: sort === "newest" || sort === "az" ? sort : "featured",
    onlyNew: onlyNew === "1" || onlyNew === "true",
  };
}

/** Serializes filter state to a canonical query string (defaults omitted). */
export function serializeCatalogFilters(filters: CatalogFilters, options: { lockedCollection?: boolean } = {}): string {
  const params = new URLSearchParams();
  if (!options.lockedCollection && filters.collection !== ALL) params.set("collection", filters.collection);
  if (filters.category !== ALL) params.set("category", filters.category);
  if (filters.engine !== "all") params.set("engine", filters.engine);
  if (filters.q.trim()) params.set("q", filters.q);
  if (filters.sort !== "featured") params.set("sort", filters.sort);
  if (filters.onlyNew) params.set("new", "1");
  return params.toString();
}
