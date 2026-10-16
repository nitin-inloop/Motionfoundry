import Link from "next/link";
import { BRAND_CONFIG } from "../lib/brand";
import { NEW_VERSION_LABEL, getAllComponents, getComponentBySlug, getListedCollections, getListedComponents, isNewComponent } from "../lib/registry";
import { getDesigns } from "../lib/designs";
import { DesignMock } from "../components/design-mock";
import { HeroActions, RollingCta } from "../components/hero-actions";
import { BLANK, DemoFrame, FILL, SectionHeader, ShaderTile } from "../components/landing/frames";
import { InstallCommand } from "../components/landing/install-command";
import {
  // Text
  CubeFlipWords,
  MarkerHighlight,
  SplitText,
  // Shaders
  AuroraRibbons,
  EclipseGradient,
  EmberGradient,
  NebulaGradient,
  PlasmaGradient,
  SilkGradient,
  SpotlightGradient,
  WaveGradient,
  // Scroll
  ScrollCoverflow,
  StickyStackCards,
  VelocityMarquee,
  // UI
  AvatarGroup,
  Badge,
  Button,
  DataTable,
  Dialog,
  DropdownMenu,
  FloatingInput,
  OtpInput,
  ProgressRing,
  SegmentedControl,
  Select,
  Sparkline,
  StatCard,
  Tabs,
  Toast,
} from "@motionfoundry/ui";

/** CSS custom properties the text components read for their font size — lets the hero scale fluidly. */
type SizeVars = React.CSSProperties & Record<`--${string}`, string>;
const HEADLINE_SIZE = "clamp(2.25rem, 1rem + 6vw, 5.25rem)";
const HEADLINE_STYLE: SizeVars = { "--mf-st-size": HEADLINE_SIZE, padding: 0 };
const ACCENT_STYLE: SizeVars = { "--mf-cf-size": HEADLINE_SIZE };
const CLOSING_STYLE: SizeVars = { "--mf-mh-size": "clamp(1.875rem, 1rem + 4vw, 3.5rem)" };

/** Display name + one-line caption from the registry (falls back while a component is still being registered). */
function meta(slug: string, fallback: string) {
  const c = getComponentBySlug(slug);
  const description = c?.description ?? "";
  const firstSentence = description.split(/(?<=\.)\s/)[0] ?? "";
  return { title: c?.name ?? fallback, caption: firstSentence.length > 0 && firstSentence.length <= 72 ? firstSentence.replace(/\.$/, "") : undefined };
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

const SHADERS: { slug: string; fallback: string; className: string; render: React.ReactNode }[] = [
  {
    slug: "nebula-gradient",
    fallback: "Nebula Gradient",
    className: "col-span-2 row-span-2",
    render: <NebulaGradient className={FILL}>{BLANK}</NebulaGradient>,
  },
  { slug: "silk-gradient", fallback: "Silk Gradient", className: "", render: <SilkGradient className={FILL}>{BLANK}</SilkGradient> },
  { slug: "eclipse-gradient", fallback: "Eclipse Gradient", className: "", render: <EclipseGradient className={FILL}>{BLANK}</EclipseGradient> },
  { slug: "plasma-gradient", fallback: "Plasma Gradient", className: "", render: <PlasmaGradient className={FILL}>{BLANK}</PlasmaGradient> },
  { slug: "ember-gradient", fallback: "Ember Gradient", className: "", render: <EmberGradient className={FILL}>{BLANK}</EmberGradient> },
  { slug: "wave-gradient", fallback: "Wave Gradient", className: "col-span-2", render: <WaveGradient className={FILL}>{BLANK}</WaveGradient> },
  { slug: "aurora-ribbons", fallback: "Aurora Ribbons", className: "col-span-2", render: <AuroraRibbons className={FILL}>{BLANK}</AuroraRibbons> },
];

/** UI bento: spans sum to full rows at 2 columns (sm) and 4 columns (lg). */
const UI_TILES: { slug: string; fallback: string; className: string; render: React.ReactNode }[] = [
  { slug: "data-table", fallback: "Data Table", className: "sm:col-span-2 row-span-2", render: <DataTable /> },
  { slug: "stat-card", fallback: "Stat Card", className: "", render: <StatCard /> },
  { slug: "progress-ring", fallback: "Progress Ring", className: "", render: <ProgressRing /> },
  { slug: "tabs", fallback: "Tabs", className: "sm:col-span-2", render: <Tabs /> },
  { slug: "otp-input", fallback: "OTP Input", className: "", render: <OtpInput /> },
  { slug: "floating-input", fallback: "Floating Input", className: "", render: <FloatingInput /> },
  { slug: "segmented-control", fallback: "Segmented Control", className: "", render: <SegmentedControl /> },
  { slug: "button", fallback: "Button", className: "", render: <Button /> },
  { slug: "select", fallback: "Select", className: "", render: <Select /> },
  { slug: "dropdown-menu", fallback: "Dropdown Menu", className: "", render: <DropdownMenu /> },
  { slug: "toast", fallback: "Toast", className: "sm:col-span-2", render: <Toast /> },
  { slug: "avatar-group", fallback: "Avatar Group", className: "", render: <AvatarGroup /> },
  { slug: "badge", fallback: "Badge", className: "", render: <Badge /> },
  { slug: "dialog", fallback: "Dialog", className: "", render: <Dialog /> },
  { slug: "sparkline", fallback: "Sparkline", className: "", render: <Sparkline /> },
];

export default function HomePage() {
  const all = getAllComponents();
  const listed = getListedComponents();
  const collections = getListedCollections();
  const designs = getDesigns();
  const countIn = (id: string) => all.filter((c) => c.collection === id).length;
  const collection = (id: string) => collections.find((c) => c.id === id);
  const newListed = listed.filter(isNewComponent);

  const scroll = collection("scroll");
  const shaders = collection("shaders");
  const ui = collection("ui");

  return (
    <div className="space-y-28 overflow-x-clip pb-24 sm:space-y-36">
      {/* 1 — Hero: typography first, one quiet spotlight inside a framed panel. */}
      <section className="px-4 pt-6 sm:px-6" aria-labelledby="hero-heading">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-border bg-background">
          <SpotlightGradient
            color1="#525252"
            color2="#262626"
            backgroundColor="#0a0a0a"
            radius={480}
            gridType="dots"
            gridOpacity={0.06}
            speed={0.45}
            borderRadius={0}
            className="!h-auto !border-0"
          >
            <div className="flex w-full min-w-0 flex-col items-center py-12 text-center sm:py-20">
              {newListed.length > 0 ? (
                <Link
                  href="/components?new=1"
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background/70 px-3.5 py-1 text-xs text-muted-foreground backdrop-blur transition hover:border-neutral-600 hover:text-foreground"
                >
                  <span className="font-mono text-foreground/90">{NEW_VERSION_LABEL}</span>
                  <span aria-hidden="true" className="h-3 w-px bg-border" />
                  <span className="min-w-0 truncate">{newListed.length} new components →</span>
                </Link>
              ) : (
                <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background/70 px-3.5 py-1 text-xs text-muted-foreground backdrop-blur">
                  <span className="font-mono text-foreground/90">v{BRAND_CONFIG.version}</span>
                  <span aria-hidden="true" className="h-3 w-px bg-border" />
                  <span>Open source · {BRAND_CONFIG.license}</span>
                </span>
              )}

              <div id="hero-heading" className="mt-8 flex max-w-5xl flex-col items-center">
                <SplitText
                  as="h1"
                  text="Motion components"
                  splitBy="chars"
                  stagger={0.03}
                  fromBlur={8}
                  className="!font-semibold"
                  style={HEADLINE_STYLE}
                />
                <CubeFlipWords
                  as="p"
                  prefix="built for"
                  words={["scroll", "shaders", "interfaces"]}
                  color="#737373"
                  accentColor="#fafafa"
                  className="!font-semibold"
                  style={ACCENT_STYLE}
                />
              </div>

              <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {listed.length} animated React components across {joinNames(collections.map((c) => c.name))}. Copy the source with one command —
                typed, SSR-safe, and respectful of reduced motion.
              </p>

              <HeroActions className="mt-9" primary={{ label: "Get started", href: "/docs/getting-started" }} secondary={{ label: "Explore Scroll", href: "/collections/scroll" }} />

              <InstallCommand className="mt-6" command={`npx ${BRAND_CONFIG.cliName} add split-text cube-flip-words`} />
            </div>
          </SpotlightGradient>

          <nav aria-label="Collections" className="grid grid-cols-1 divide-y divide-border border-t border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {collections.map((c) => (
              <Link key={c.id} href={`/collections/${c.id}`} className="group flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-card/60">
                <span className="text-sm font-medium text-foreground/90">{c.name}</span>
                <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  {countIn(c.id)}
                  <span aria-hidden="true" className="transition group-hover:translate-x-0.5 group-hover:text-foreground">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* 2 — Scroll */}
      <section className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6" aria-labelledby="scroll-heading">
        <SectionHeader
          id="scroll-heading"
          eyebrow={scroll?.name ?? "Scroll"}
          count={countIn("scroll")}
          title="Scroll-driven storytelling"
          description={scroll?.description ?? "Sticky stacks, velocity marquees, and coverflows — each demo runs in its own scroll viewport."}
          href="/collections/scroll"
          linkLabel={`Browse ${scroll?.name ?? "Scroll"}`}
        />
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <DemoFrame slug="sticky-stack-cards" title={meta("sticky-stack-cards", "Sticky Stack Cards").title} stageClassName="h-[440px]" hint="Scroll inside ↓" padded={false}>
            <StickyStackCards height={440} borderRadius={0} className="!border-0" />
          </DemoFrame>
          <DemoFrame slug="velocity-marquee" title={meta("velocity-marquee", "Velocity Marquee").title} stageClassName="h-[440px]" hint="Scroll inside ↕" padded={false}>
            <VelocityMarquee height={440} borderRadius={0} className="!border-0" />
          </DemoFrame>
          <DemoFrame
            slug="scroll-coverflow"
            title={meta("scroll-coverflow", "Scroll Coverflow").title}
            stageClassName="h-[400px]"
            hint="Scroll inside ↓"
            padded={false}
            className="md:col-span-2"
          >
            <ScrollCoverflow className={FILL} />
          </DemoFrame>
        </div>
      </section>

      {/* 3 — Shaders */}
      <section className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6" aria-labelledby="shaders-heading">
        <SectionHeader
          id="shaders-heading"
          eyebrow={shaders?.name ?? "Shaders"}
          count={countIn("shaders")}
          title="Living backgrounds, tuned for dark UI"
          description={shaders?.description ?? "Animated shader backgrounds that sit quietly behind any section."}
          href="/collections/shaders"
          linkLabel={`Browse ${shaders?.name ?? "Shaders"}`}
        />
        <div className="grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[200px] md:grid-cols-4">
          {SHADERS.map((s) => {
            const m = meta(s.slug, s.fallback);
            return (
              <ShaderTile key={s.slug} slug={s.slug} title={m.title} caption={m.caption} className={s.className}>
                {s.render}
              </ShaderTile>
            );
          })}
        </div>
      </section>

      {/* 4 — UI */}
      <section className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6" aria-labelledby="ui-heading">
        <SectionHeader
          id="ui-heading"
          eyebrow={ui?.name ?? "UI"}
          count={countIn("ui")}
          title="Everyday primitives, with motion built in"
          description={ui?.description ?? "Inputs, menus, overlays, and data display — accessible, keyboard-friendly, and animated with restraint."}
          href="/collections/ui"
          linkLabel={`Browse ${ui?.name ?? "UI"}`}
        />
        <div className="grid auto-rows-[240px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {UI_TILES.map((t) => (
            <DemoFrame key={t.slug} slug={t.slug} title={meta(t.slug, t.fallback).title} stageClassName="" className={t.className}>
              {t.render}
            </DemoFrame>
          ))}
        </div>
      </section>

      {/* 5 — Design systems */}
      <section className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6" aria-labelledby="designs-heading">
        <SectionHeader
          id="designs-heading"
          eyebrow="Design systems"
          title="Re-skin everything with a DESIGN.md"
          description={`${designs.length} brand presets — browse their tokens, then preview any component in that brand with one click.`}
          href="/designs"
          linkLabel="Browse designs"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {designs.slice(0, 4).map((d) => (
            <Link key={d.id} href={`/designs/${d.id}`} className="group min-w-0 overflow-hidden rounded-2xl border border-border transition hover:border-neutral-600">
              <div className="h-48 overflow-hidden">
                <DesignMock brand={d.brand} theme={d.theme} />
              </div>
              <div className="flex items-center justify-between border-t border-border bg-card/40 px-4 py-2.5 text-sm">
                <span className="truncate font-medium text-foreground/90">{d.brand}</span>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground transition group-hover:text-foreground/90">{d.mode}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6 — Closing CTA */}
      <section className="px-4 sm:px-6" aria-labelledby="cta-heading">
        <div className="mf-stage mx-auto flex max-w-7xl flex-col items-center rounded-3xl border border-border px-6 py-16 text-center sm:py-24">
          <div id="cta-heading">
            <MarkerHighlight
              as="h2"
              text="Ship interfaces that feel considered."
              highlight={["considered"]}
              color="rgba(163, 163, 163, 0.3)"
              textColor="#fafafa"
              trigger="inView"
              className="!font-semibold"
              style={CLOSING_STYLE}
            />
          </div>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Start with one component or all {listed.length}. Every file lands in your repo, so you own the motion.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <RollingCta label="Get started" href="/docs/getting-started" />
            <Link href="/components" className="text-sm text-foreground/80 underline decoration-neutral-600 underline-offset-4 transition hover:text-foreground">
              Browse all components
            </Link>
          </div>
          <InstallCommand className="mt-8" command={`npx ${BRAND_CONFIG.cliName} add sticky-stack-cards`} />
        </div>
      </section>
    </div>
  );
}
