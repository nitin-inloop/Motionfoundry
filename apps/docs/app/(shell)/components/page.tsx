import { getListedCategories, getListedCollections, getListedComponents, toCatalog } from "../../../lib/registry";
import { parseCatalogFilters } from "../../../lib/catalog-filters";
import { ComponentCatalog } from "../../../components/component-catalog";
import { DocsPage } from "../../../components/docs-page";
import { PageHeader } from "../../../components/page-header";

export const metadata = { title: "Components — MotionFoundry" };

export default async function ComponentsCatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  // Only listed collections appear in the catalog; unlisted ones stay reachable via /collections/[id] and /components/[slug].
  const components = getListedComponents();
  const categories = getListedCategories();
  const collections = getListedCollections();
  const initialFilters = parseCatalogFilters(params, { collections: collections.map((c) => c.id), categories });
  const next = collections[0];
  return (
    <DocsPage wide>
      <PageHeader
        title="Components"
        description={`All ${components.length} animated components across ${collections.length} collections: ${collections.map((c) => c.name).join(", ")}. Every card is a live preview.`}
        next={next ? { href: `/collections/${next.id}`, title: next.name } : undefined}
      />
      <ComponentCatalog components={toCatalog(components)} categories={categories} collections={collections} initialFilters={initialFilters} />
    </DocsPage>
  );
}
