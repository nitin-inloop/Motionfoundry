import { DOCS_PAGES } from "./docs";
import { getDesigns } from "./designs";
import { getAllComponents, getCollections } from "./registry";

/** Lightweight index of every page, built on the server and handed to client navigation. */
export interface NavIndex {
  docs: { slug: string; title: string; category: string }[];
  designs: { id: string; brand: string; category: string; accent: string; bg: string }[];
  components: { slug: string; name: string; collection: string; category: string }[];
  collections: { id: string; name: string; count: number }[];
}

export function getNavIndex(): NavIndex {
  return {
    docs: DOCS_PAGES.map(({ slug, title, category }) => ({ slug, title, category })),
    designs: getDesigns().map(({ id, brand, category, theme }) => ({ id, brand, category, accent: theme.accent, bg: theme.bg })),
    components: getAllComponents().map(({ slug, name, collection, category }) => ({ slug, name, collection, category })),
    collections: getCollections().map(({ id, name, count }) => ({ id, name, count })),
  };
}
