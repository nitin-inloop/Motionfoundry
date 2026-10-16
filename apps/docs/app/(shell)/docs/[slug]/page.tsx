import { notFound } from "next/navigation";
import { BRAND_CONFIG, repoFileUrl } from "../../../../lib/brand";
import { DOCS_PAGES, getDocBySlug } from "../../../../lib/docs";
import { tocFromMarkdown } from "../../../../lib/slug";
import { DocsPage } from "../../../../components/docs-page";
import { PageHeader, PagerFooter } from "../../../../components/page-header";
import { Prose } from "../../../../components/prose";
import { CodeBlock, type CodeLanguage } from "../../../../components/code-block";

export function generateStaticParams() {
  return DOCS_PAGES.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getDocBySlug(slug);
  return doc ? { title: `${doc.title} — ${BRAND_CONFIG.name} Docs`, description: doc.summary } : {};
}

function detectLanguage(code: string): CodeLanguage {
  const first = code.trimStart();
  if (/^(#|npx |pnpm |npm |node |ls )/.test(first)) return "bash";
  if (/^(\/\*|:root|@media|\.)/.test(first)) return "css";
  if (/^MIT License/.test(first)) return "text";
  return "tsx";
}

export default async function DocDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getDocBySlug(slug);
  if (!doc) notFound();

  const index = DOCS_PAGES.findIndex((d) => d.slug === doc.slug);
  const prev = DOCS_PAGES[index - 1];
  const next = DOCS_PAGES[index + 1];
  const previous = prev ? { href: `/docs/${prev.slug}`, title: prev.title } : undefined;
  const following = next ? { href: `/docs/${next.slug}`, title: next.title } : undefined;
  const language = detectLanguage(doc.code);
  const markdown = `# ${doc.title}\n\n${doc.summary}\n\n${doc.body}\n\n\`\`\`${language}\n${doc.code}\n\`\`\`\n`;

  return (
    <DocsPage toc={tocFromMarkdown(doc.body)}>
      <PageHeader
        title={doc.title}
        description={doc.summary}
        markdown={markdown}
        sourceUrl={repoFileUrl(`apps/docs/content/docs/${doc.slug}.mdx`)}
        previous={previous}
        next={following}
      />
      <Prose markdown={doc.body} />
      <CodeBlock code={doc.code} language={language} filename={language === "bash" ? "terminal" : language === "text" ? "LICENSE" : undefined} />
      <PagerFooter previous={previous} next={following} />
    </DocsPage>
  );
}
