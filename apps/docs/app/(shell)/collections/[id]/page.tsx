import { notFound } from "next/navigation";
import { BRAND_CONFIG } from "../../../../lib/brand";
import { NEW_VERSION_LABEL, getCategories, getCollection, getCollections, getComponentsByCollection, getListedCollections, isNewComponent, toCatalog } from "../../../../lib/registry";
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
  const all = getCollections();
  // Prev/next only cycle through listed collections. Unlisted collections (still reachable by URL) point to the first listed one.
  const listed = getListedCollections();
  const index = listed.findIndex((c) => c.id === id);
  const nextCollection = index === -1 ? listed[0] : listed.length > 1 ? listed[(index + 1) % listed.length] : undefined;
  const isNew = components.some(isNewComponent);

  return (
    <DocsPage wide>
      <PageHeader
        title={collection.name}
        description={collection.description}
        previous={{ href: "/components", title: "Components" }}
        next={nextCollection ? { href: `/collections/${nextCollection.id}`, title: nextCollection.name } : undefined}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Callout>
          {id === "studio-kit" ? (
            <>
              Introduced in v2.1. Read the <a href="/docs/studio-kit" className="font-medium underline underline-offset-4">Studio Kit guide</a> for conventions, migration notes, and a full example — or open any card and apply a{" "}
              <a href="/designs" className="font-medium underline underline-offset-4">design system preset</a>.
            </>
          ) : id === "core" ? (
            <>
              The original {components.length} precision primitives. Start with the <a href="/docs/getting-started" className="font-medium underline underline-offset-4">Getting Started</a> guide.
            </>
          ) : (
            <>
              {isNew ? <>New in {NEW_VERSION_LABEL}. </> : null}
              {components.length} components, each with live prop controls. Start with the <a href="/docs/getting-started" className="font-medium underline underline-offset-4">Getting Started</a> guide, or open any card and apply a{" "}
              <a href="/designs" className="font-medium underline underline-offset-4">design system preset</a>.
            </>
          )}
        </Callout>
        <CodeBlock code={`npx ${BRAND_CONFIG.cliName} list --collection ${id}\nnpx ${BRAND_CONFIG.cliName} add ${sample}`} language="bash" />
      </div>
      <ComponentCatalog components={toCatalog(components)} categories={getCategories()} collections={all} lockedCollection={id} readUrlOnMount />
    </DocsPage>
  );
}
