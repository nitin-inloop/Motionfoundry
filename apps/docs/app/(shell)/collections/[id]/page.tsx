import { notFound } from "next/navigation";
import { BRAND_CONFIG } from "../../../../lib/brand";
import { getCategories, getCollection, getCollections, getComponentsByCollection, toCatalog } from "../../../../lib/registry";
import { ComponentCatalog } from "../../../../components/component-catalog";
import { CodeBlock } from "../../../../components/code-block";
import { Callout, DocsPage } from "../../../../components/docs-page";
import { PageHeader } from "../../../../components/page-header";

export function generateStaticParams() {
  return getCollections().map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collection = getCollection(id);
  return collection ? { title: `${collection.name} — ${BRAND_CONFIG.name}`, description: collection.description } : {};
}

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collection = getCollection(id);
  if (!collection) notFound();
  const components = getComponentsByCollection(id);
  const sample = components.slice(0, 3).map((c) => c.slug).join(" ");
  const others = getCollections().filter((c) => c.id !== id);

  return (
    <DocsPage wide>
      <PageHeader
        title={collection.name}
        description={collection.description}
        previous={{ href: "/components", title: "All Components" }}
        next={others[0] ? { href: `/collections/${others[0].id}`, title: others[0].name } : undefined}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Callout>
          {id === "studio-kit" ? (
            <>
              New in v{BRAND_CONFIG.version}. Read the <a href="/docs/studio-kit" className="font-medium underline underline-offset-4">Studio Kit guide</a> for conventions, migration notes, and a full example — or open any card and apply a{" "}
              <a href="/designs" className="font-medium underline underline-offset-4">design system preset</a>.
            </>
          ) : (
            <>
              The original {components.length} precision primitives. Start with the <a href="/docs/getting-started" className="font-medium underline underline-offset-4">Getting Started</a> guide.
            </>
          )}
        </Callout>
        <CodeBlock code={`npx ${BRAND_CONFIG.cliName} list --collection ${id}\nnpx ${BRAND_CONFIG.cliName} add ${sample}`} language="bash" />
      </div>
      <ComponentCatalog components={toCatalog(components)} categories={getCategories()} collections={getCollections()} initialCollection={id} showCollectionFilter={false} />
    </DocsPage>
  );
}
