import Link from "next/link";
import { BRAND_CONFIG } from "../../../lib/brand";
import { DESIGN_SOURCE, getDesigns } from "../../../lib/designs";
import { Callout, DocsPage } from "../../../components/docs-page";
import { PageHeader } from "../../../components/page-header";
import { DesignMock, PaletteStrip } from "../../../components/design-mock";

export const metadata = {
  title: `Design Systems — ${BRAND_CONFIG.name}`,
  description: "11 brand design systems (DESIGN.md) from Vercel, Cursor, Claude, Framer, Apple, Airbnb, Expo, ElevenLabs, Runway, Resend, and Spotify — usable as MotionFoundry theme presets.",
};

export default function DesignsPage() {
  const designs = getDesigns();
  return (
    <DocsPage wide>
      <PageHeader
        title="Design Systems"
        description={`${designs.length} brand design languages captured as DESIGN.md files — browse the tokens, then apply any of them to MotionFoundry components as a theme preset.`}
        previous={{ href: "/components", title: "Components" }}
        next={{ href: `/designs/${designs[0].id}`, title: designs[0].brand }}
      />
      <Callout>
        A <strong>DESIGN.md</strong> is a plain-text design system an AI coding agent can read: colors, type ramp, radii, components, and do&apos;s and don&apos;ts. These come from{" "}
        <a href={DESIGN_SOURCE.repo} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
          VoltAgent/awesome-design-md
        </a>{" "}
        ({DESIGN_SOURCE.license}). Every component page has a <strong>Design</strong> picker that re-skins the live preview with one of them.
      </Callout>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {designs.map((d) => (
          <Link key={d.id} href={`/designs/${d.id}`} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card/40 transition hover:border-neutral-600">
            <div className="h-60 overflow-hidden border-b border-border">
              <DesignMock brand={d.brand} theme={d.theme} />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{d.brand}</h2>
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{d.mode}</span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{d.tagline}</p>
              <div className="mt-auto space-y-3 pt-1">
                <PaletteStrip theme={d.theme} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{d.category}</span>
                  <span className="transition group-hover:translate-x-0.5 group-hover:text-foreground">View DESIGN.md →</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </DocsPage>
  );
}
