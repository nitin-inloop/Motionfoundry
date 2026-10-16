import { getAllComponentsOrdered, getCollectionsListedFirst, getUsedCategories, toCatalog } from "../../../lib/registry";
import { parseCatalogFilters } from "../../../lib/catalog-filters";
import { ComponentCatalog } from "../../../components/component-catalog";
import { DocsPage } from "../../../components/docs-page";
import { PageHeader } from "../../../components/page-header";

export const metadata = { title: "All Components — MotionFoundry" };

export default async function ComponentsCatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  // Every collection, listed ones first (Scroll, Shaders, UI), then Text FX, Studio Kit, Core — each in registry order.
  const components = getAllComponentsOrdered();
  const categories = getUsedCategories();
  const collections = getCollectionsListedFirst();
  const initialFilters = parseCatalogFilters(params, { collections: collections.map((c) => c.id), categories });
  const next = collections[0];
  return (
    <DocsPage wide>
      <PageHeader
        title="All Components"
        description={`Every one of the ${components.length} animated components, across all ${collections.length} collections: ${collections.map((c) => c.name).join(", ")}. Filter by collection or category — every card is a live preview.`}
        next={next ? { href: `/collections/${next.id}`, title: next.name } : undefined}
      />
      <ComponentCatalog components={toCatalog(components)} categories={categories} collections={collections} initialFilters={initialFilters} />
    </DocsPage>
  );
}
