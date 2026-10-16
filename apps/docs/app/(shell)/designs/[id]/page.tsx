import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AnimatedCheckbox,
  ConfettiButton,
  LoadingButton,
  MagneticButton,
  NotificationStack,
  OrbitLoader,
  RotatingWords,
  ShinyBorderButton,
  SlideFillButton,
  ToggleSwitch,
} from "@motionfoundry/ui";
import { BRAND_CONFIG, repoFileUrl } from "../../../../lib/brand";
import { DESIGN_SOURCE, getDesign, getDesigns } from "../../../../lib/designs";
import { tocFromMarkdown } from "../../../../lib/slug";
import { Callout, DocsPage, SectionHeading } from "../../../../components/docs-page";
import { PageHeader, PagerFooter } from "../../../../components/page-header";
import { DesignThemePreview } from "../../../../components/design-theme-preview";
import { ColorSwatch, DownloadDesignButton } from "../../../../components/design-client";
import { CodeBlock } from "../../../../components/code-block";
import { Prose } from "../../../../components/prose";

export function generateStaticParams() {
  return getDesigns().map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const design = getDesign(id);
  return design ? { title: `${design.brand} Design System — ${BRAND_CONFIG.name}`, description: design.tagline } : {};
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-36 flex-col rounded-xl p-4" style={{ background: "var(--mf-surface)", border: "1px solid var(--mf-border)" }}>
      <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--mf-subtle)" }}>
        {label}
      </span>
      <div className="flex flex-1 items-center justify-center py-3">{children}</div>
    </div>
  );
}

export default async function DesignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const design = getDesign(id);
  if (!design) notFound();

  const designs = getDesigns();
  const index = designs.findIndex((d) => d.id === id);
  const toLink = (d?: { id: string; brand: string }) => (d ? { href: `/designs/${d.id}`, title: d.brand } : undefined);
  const previous = toLink(designs[index - 1]) ?? { href: "/designs", title: "Design Systems" };
  const next = toLink(designs[index + 1]);
  const { theme } = design;
  const specToc = tocFromMarkdown(design.body, 2).map((item) => ({ ...item, id: `spec-${item.id}`, depth: 3 as const }));
  const toc = [
    { id: "theme-preview", title: "Theme Preview", depth: 2 as const },
    { id: "color-palette", title: "Color Palette", depth: 2 as const },
    { id: "typography", title: "Typography", depth: 2 as const },
    ...(design.rounded.length ? [{ id: "radius", title: "Radius", depth: 2 as const }] : []),
    { id: "use-as-a-preset", title: "Use as a Preset", depth: 2 as const },
    { id: "specification", title: "Specification", depth: 2 as const },
    ...specToc,
  ];
  const typeSamples = design.typography.slice(0, 8);
  const cssVars = [
    `--mf-bg: ${theme.bg};`,
    `--mf-surface: ${theme.surface};`,
    `--mf-surface-raised: ${theme.surfaceRaised};`,
    `--mf-fg: ${theme.fg};`,
    `--mf-muted: ${theme.muted};`,
    `--mf-subtle: ${theme.subtle};`,
    `--mf-border: ${theme.border};`,
    `--mf-border-strong: ${theme.borderStrong};`,
    `--mf-accent: ${theme.accent};`,
  ];

  return (
    <DocsPage toc={toc}>
      <PageHeader
        title={`${design.brand}`}
        description={design.tagline}
        markdown={design.raw}
        sourceUrl={repoFileUrl(design.path)}
        previous={previous}
        next={next}
        eyebrow={
          <>
            <span className="rounded-md bg-card px-2 py-0.5 font-mono text-xs text-muted-foreground">{design.category}</span>
            <span className="rounded-md bg-card px-2 py-0.5 font-mono text-xs text-muted-foreground">{design.mode} canvas</span>
            <span className="rounded-md bg-card px-2 py-0.5 font-mono text-xs text-muted-foreground">DESIGN.md</span>
          </>
        }
      >
        <div className="flex flex-wrap gap-2 pt-1">
          <DownloadDesignButton id={design.id} raw={design.raw} />
          <a href={repoFileUrl(design.path)} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center rounded-lg bg-card px-3 text-sm font-medium hover:bg-muted">
            View on GitHub
          </a>
        </div>
      </PageHeader>

      <Callout>{design.description}</Callout>

      <section className="space-y-4">
        <SectionHeading id="theme-preview">Theme Preview</SectionHeading>
        <p className="text-muted-foreground">A landing-page sketch built from the tokens, followed by live MotionFoundry components re-skinned with this theme. Switch Dark | Light to preview a derived variant that keeps the brand accent, radius, and fonts.</p>
        <DesignThemePreview brand={design.brand} theme={theme} initialMode={design.mode}>
          <div className="px-1 pt-1 text-2xl" style={{ fontFamily: theme.fontDisplay, fontWeight: theme.displayWeight, letterSpacing: theme.displayTracking }}>
            <RotatingWords prefix={design.brand} words={["moves", "ships", "delights"]} accentColor={theme.accent} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Tile label="Magnetic">
              <MagneticButton label="Get started" />
            </Tile>
            <Tile label="Shiny border">
              <ShinyBorderButton label="Early access" beamColor={theme.accent} />
            </Tile>
            <Tile label="Confetti">
              <ConfettiButton label="Celebrate" accentColor={theme.accent} secondaryColor={theme.secondary} />
            </Tile>
            <Tile label="Slide fill">
              <SlideFillButton label="Continue" fillColor={theme.accent} fillTextColor={theme.onAccent.startsWith("#") ? theme.onAccent : "#ffffff"} />
            </Tile>
            <Tile label="Toggle">
              <ToggleSwitch label="Notifications" defaultChecked accentColor={theme.accent} />
            </Tile>
            <Tile label="Checkbox">
              <AnimatedCheckbox label="Ship it" defaultChecked accentColor={theme.accent} />
            </Tile>
            <Tile label="Loading">
              <LoadingButton label="Deploy" />
            </Tile>
            <Tile label="Loader">
              <OrbitLoader color={theme.accent} />
            </Tile>
            <Tile label="Toasts">
              <NotificationStack messages={[`${design.brand} build passed`, "Deployed to production"]} maxVisible={2} />
            </Tile>
          </div>
        </DesignThemePreview>
      </section>

      <section className="space-y-4">
        <SectionHeading id="color-palette">Color Palette</SectionHeading>
        <p className="text-muted-foreground">{design.colors.length} tokens. Click a swatch to copy its value.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {design.colors.map((c) => (
            <ColorSwatch key={`${c.name}-${c.value}`} name={c.name} value={c.value} role={c.role} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading id="typography">Typography</SectionHeading>
        <p className="text-muted-foreground">
          Brand typefaces are proprietary, so specimens fall back to the closest system fonts in the stack:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">{theme.fontDisplay}</code>
        </p>
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border" style={{ background: theme.bg, color: theme.fg }}>
          {typeSamples.map((t) => (
            <div key={t.role} className="grid gap-2 p-5 md:grid-cols-[180px_1fr] md:items-center">
              <div className="space-y-0.5 font-mono text-[11px]" style={{ color: theme.subtle }}>
                <div style={{ color: theme.muted }}>{t.role}</div>
                <div>
                  {t.fontSize} · {t.fontWeight}
                  {t.letterSpacing && t.letterSpacing !== "normal" ? ` · ${t.letterSpacing}` : ""}
                </div>
              </div>
              <div
                className="truncate"
                style={{
                  fontFamily: `${t.fontFamily}, ${theme.fontDisplay}`,
                  fontSize: `min(${t.fontSize || "16px"}, 56px)`,
                  fontWeight: Number.parseInt(t.fontWeight, 10) || 400,
                  letterSpacing: /px|em/.test(t.letterSpacing) ? t.letterSpacing.split(" ")[0] : undefined,
                  lineHeight: 1.2,
                }}
              >
                The quick brown fox jumps over the lazy dog
              </div>
            </div>
          ))}
        </div>
      </section>

      {design.rounded.length > 0 && (
        <section className="space-y-4">
          <SectionHeading id="radius">Radius</SectionHeading>
          <div className="flex flex-wrap gap-4">
            {design.rounded.map((r) => (
              <div key={r.name} className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 border-2 border-neutral-500 bg-card" style={{ borderRadius: r.value }} />
                <span className="text-xs font-medium">{r.name}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{r.value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <SectionHeading id="use-as-a-preset">Use as a Preset</SectionHeading>
        <p className="text-muted-foreground">
          Every MotionFoundry component reads its surfaces, text, borders, and accent from <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">--mf-*</code> CSS variables.
          Set them on any wrapper (or <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">:root</code>) to adopt the {design.brand} look, and pass the accent to color props.
        </p>
        <CodeBlock code={`.theme-${design.id} {\n${cssVars.map((l) => `  ${l}`).join("\n")}\n}`} language="css" filename="globals.css" />
        <CodeBlock
          code={`<div className="theme-${design.id}">\n  <ConfettiButton accentColor="${theme.accent}" secondaryColor="${theme.secondary}" />\n  <ToggleSwitch accentColor="${theme.accent}" />\n</div>`}
          language="tsx"
          filename="example.tsx"
        />
        <p className="text-sm text-muted-foreground">
          Building with an AI coding agent? Put this file at your project root as <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">DESIGN.md</code> and ask it to follow the
          design system — or try it on any <Link href="/components" className="underline underline-offset-4 hover:text-foreground">component page</Link> with the Design picker.
        </p>
      </section>

      <section className="space-y-4">
        <SectionHeading id="specification">Specification</SectionHeading>
        <Prose markdown={design.body} idPrefix="spec-" />
        <p className="border-t border-border pt-4 text-xs text-muted-foreground">
          Source: <a href={`${DESIGN_SOURCE.repo}/tree/main/design-md/${design.id}`} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">VoltAgent/awesome-design-md</a> ({DESIGN_SOURCE.license}). An
          inspired analysis of public marketing surfaces — not an official {design.brand} asset.
        </p>
      </section>

      <PagerFooter previous={previous} next={next} />
    </DocsPage>
  );
}
