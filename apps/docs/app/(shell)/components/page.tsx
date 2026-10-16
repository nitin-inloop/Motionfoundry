import { getAllComponents, getCategories, getCollections, toCatalog } from "../../../lib/registry";
import { ComponentCatalog } from "../../../components/component-catalog";
import { DocsPage } from "../../../components/docs-page";
import { PageHeader } from "../../../components/page-header";

export const metadata = { title: "Components — MotionFoundry" };

export default async function ComponentsCatalogPage({ searchParams }: { searchParams: Promise<{ collection?: string; category?: string }> }) {
  const { collection, category } = await searchParams;
  const components = getAllComponents();
  const categories = getCategories();
  const collections = getCollections();
  return (
    <DocsPage wide>
      <PageHeader
        title="Components"
        description={`All ${components.length} animated components across ${categories.length} categories and ${collections.length} collections. Every card is a live preview.`}
        next={{ href: "/collections/studio-kit", title: "Studio Kit" }}
      />
      <ComponentCatalog
        key={`${collection ?? ""}-${category ?? ""}`}
        components={toCatalog(components)}
        categories={categories}
        collections={collections}
        initialCollection={collections.some((c) => c.id === collection) ? collection : undefined}
        initialCategory={category && categories.includes(category) ? category : undefined}
      />
    </DocsPage>
  );
}
