import { DOCS_PAGES } from "./docs";
import { getDesigns } from "./designs";
import { getListedCategories, getListedCollections, getListedComponents } from "./registry";

/**
 * Lightweight index of every navigable page, built on the server and handed to client navigation
 * (sidebar, header, search). Only LISTED collections and their components are included — unlisted
 * collections keep their pages (reachable by URL) but never appear in navigation or search.
 */
export interface NavIndex {
  docs: { slug: string; title: string; category: string }[];
  designs: { id: string; brand: string; category: string; accent: string; bg: string }[];
  /** Components in listed collections, in collection order and then registry order. */
  components: { slug: string; name: string; collection: string; category: string }[];
  /** Listed collections, sorted by `order`. */
  collections: { id: string; name: string; count: number; order: number }[];
  /** Categories used by listed components, in registry order (used for sidebar sub-groups). */
  categories: string[];
}

export function getNavIndex(): NavIndex {
  const components = getListedComponents();
  return {
    docs: DOCS_PAGES.map(({ slug, title, category }) => ({ slug, title, category })),
    designs: getDesigns().map(({ id, brand, category, theme }) => ({ id, brand, category, accent: theme.accent, bg: theme.bg })),
    components: components.map(({ slug, name, collection, category }) => ({ slug, name, collection, category })),
    collections: getListedCollections().map(({ id, name, order }) => ({
      id,
      name,
      order,
      // Count from the registry entries so in-progress additions are reflected immediately.
      count: components.filter((c) => c.collection === id).length,
    })),
    categories: getListedCategories(),
  };
}
