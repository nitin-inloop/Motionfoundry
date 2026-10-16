import { DOCS_PAGES } from "./docs";
import { getDesigns } from "./designs";
import { getAllComponentsOrdered, getCollectionsListedFirst, getListedCategories, getListedCollections, getListedComponents } from "./registry";

type NavComponent = { slug: string; name: string; collection: string; category: string };
type NavCollection = { id: string; name: string; count: number; order: number };

/**
 * Lightweight index of every navigable page, built on the server and handed to client navigation
 * (sidebar, header, search). `components` / `collections` hold LISTED collections only (header
 * collection links, sidebar collection groups). `allComponents` / `allCollections` cover every
 * collection and back the "All Components" catalog link and search.
 */
export interface NavIndex {
  docs: { slug: string; title: string; category: string }[];
  designs: { id: string; brand: string; category: string; accent: string; bg: string }[];
  /** Components in listed collections, in collection order and then registry order. */
  components: NavComponent[];
  /** Listed collections, sorted by `order`. */
  collections: NavCollection[];
  /** Categories used by listed components, in registry order (used for sidebar sub-groups). */
  categories: string[];
  /** Every component (listed collections first, then by collection order, then registry order). */
  allComponents: NavComponent[];
  /** Every collection, listed first, each group sorted by `order`. */
  allCollections: (NavCollection & { listed: boolean })[];
}

const toNavComponent = ({ slug, name, collection, category }: NavComponent): NavComponent => ({ slug, name, collection, category });

export function getNavIndex(): NavIndex {
  const components = getListedComponents();
  const allComponents = getAllComponentsOrdered();
  // Count from the registry entries so in-progress additions are reflected immediately.
  const countOf = (id: string) => allComponents.filter((c) => c.collection === id).length;
  return {
    docs: DOCS_PAGES.map(({ slug, title, category }) => ({ slug, title, category })),
    designs: getDesigns().map(({ id, brand, category, theme }) => ({ id, brand, category, accent: theme.accent, bg: theme.bg })),
    components: components.map(toNavComponent),
    collections: getListedCollections().map(({ id, name, order }) => ({ id, name, order, count: countOf(id) })),
    categories: getListedCategories(),
    allComponents: allComponents.map(toNavComponent),
    allCollections: getCollectionsListedFirst().map(({ id, name, order, listed }) => ({ id, name, order, listed, count: countOf(id) })),
  };
}
