import Link from "next/link";
import { notFound } from "next/navigation";
import { BRAND_CONFIG, repoFileUrl } from "../../../../lib/brand";
import { getAllComponents, getCollection, getComponentBySlug } from "../../../../lib/registry";
import { getDesignPresets } from "../../../../lib/designs";
import { buildComponentMarkdown, COMPONENT_TOC } from "../../../../lib/component-doc";
import { DocsPage } from "../../../../components/docs-page";
import { PageHeader, PagerFooter } from "../../../../components/page-header";
import { ComponentPlayground } from "../../../../components/component-playground";

export function generateStaticParams() {
  return getAllComponents().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const component = getComponentBySlug(slug);
  return component ? { title: `${component.name} — ${BRAND_CONFIG.name}`, description: component.description } : {};
}

export default async function ComponentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const component = getComponentBySlug(slug);
  if (!component) notFound();

  // Paginate within the component's own collection so Studio Kit and Core read as separate tracks.
  const siblings = getAllComponents().filter((c) => c.collection === component.collection);
  const index = siblings.findIndex((c) => c.slug === slug);
  const toLink = (c?: { slug: string; name: string }) => (c ? { href: `/components/${c.slug}`, title: c.name } : undefined);
  const previous = toLink(siblings[index - 1]);
  const next = toLink(siblings[index + 1]);
  const collectionName = getCollection(component.collection)?.name ?? component.collection;
  const isCore = component.collection === "core";
  const badge = "rounded-md bg-card px-2 py-0.5 font-mono text-xs text-muted-foreground";

  return (
    <DocsPage toc={COMPONENT_TOC}>
      <PageHeader
        title={component.name}
        description={component.description}
        markdown={buildComponentMarkdown(component)}
        sourceUrl={repoFileUrl(`packages/ui/src/components/${component.slug}.tsx`)}
        previous={previous}
        next={next}
        eyebrow={
          <>
            <Link href={`/collections/${component.collection}`} className={`rounded-md px-2 py-0.5 font-mono text-xs ${isCore ? "bg-card text-foreground/80" : "bg-sky-500/10 text-sky-300"}`}>
              {collectionName}
            </Link>
            <span className={badge}>{component.category}</span>
            <span className={badge}>{component.requiresMotion ? "motion/react" : "no dependencies"}</span>
          </>
        }
      />
      <ComponentPlayground component={component} presets={getDesignPresets()} />
      <PagerFooter previous={previous} next={next} />
    </DocsPage>
  );
}
