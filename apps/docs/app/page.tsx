import Link from "next/link";
import { BRAND_CONFIG } from "../lib/brand";
import { NEW_VERSION_LABEL, getAllComponents, getCategories, getCollections, getComponentBySlug, isNewComponent } from "../lib/registry";
import { getDesigns } from "../lib/designs";
import { CodeBlock } from "../components/code-block";
import { DesignMock } from "../components/design-mock";
import { HeroActions } from "../components/hero-actions";
import { BLANK, DemoFrame, FILL, SectionHeader, ShaderTile } from "../components/landing/frames";
import {
  AccordionCards,
  AuroraRibbons,
  BarChart,
  BlurInText,
  ButtonGroup,
  Carousel,
  Combobox,
  ConfettiButton,
  ContributionHeatmap,
  CopyButton,
  CreditCard,
  EclipseGradient,
  EmberGradient,
  FlipCard,
  HoldToConfirm,
  LikeButton,
  LoadingButton,
  MeshGradient,
  Meteors,
  MoonPhaseLoader,
  NebulaGradient,
  NotificationStack,
  NumberTicker,
  OrbitLoader,
  PasswordInput,
  PlasmaGradient,
  Popover,
  ProgressBar,
  RangeSlider,
  ReorderList,
  RotatingWords,
  ScrollCoverflow,
  SilkGradient,
  SkeletonShimmer,
  StarRating,
  StickyStackCards,
  SwipeCards,
  TagInput,
  ToggleGroup,
  ToggleSwitch,
  Tooltip,
  VelocityMarquee,
  WaveGradient,
} from "@motionfoundry/ui";

/** CSS custom properties the text components read for their font size — headline and accent scale together. */

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

/** Column spans for a 6-column grid so any number of collection cards fills complete rows. */
function collectionSpan(index: number, total: number): string {
  if (total <= 1) return "lg:col-span-6";
  const rem = total % 3;
  // Rows of three, except the first row(s) take the remainder as halves (5 → 2 + 3, 4 → 2 + 2, 7 → 2 + 2 + 3).
  const halves = rem === 0 ? 0 : rem === 2 ? 2 : 4;
  return index < Math.min(halves, total) ? "lg:col-span-3" : "lg:col-span-2";
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

/** Cards & loaders bento: fills full rows at 2 columns (sm) and 4 columns (lg). */
const CARD_TILES: { slug: string; fallback: string; className: string; render: React.ReactNode }[] = [
  {
    slug: "credit-card",
    fallback: "Credit Card",
    className: "sm:col-span-2",
    render: (
      <div className="scale-[0.72]">
        <CreditCard />
      </div>
    ),
  },
  { slug: "accordion-cards", fallback: "Accordion Cards", className: "sm:col-span-2", render: <AccordionCards height={190} /> },
  { slug: "progress-bar", fallback: "Progress Bar", className: "", render: <ProgressBar autoPlay /> },
  { slug: "moon-phase-loader", fallback: "Moon Phase Loader", className: "", render: <MoonPhaseLoader /> },
  { slug: "skeleton-shimmer", fallback: "Skeleton Shimmer", className: "sm:col-span-2", render: <SkeletonShimmer /> },
];

/** UI bento: spans sum to full rows at 2 columns (sm) and 4 columns (lg). */
const UI_TILES: { slug: string; fallback: string; className: string; render: React.ReactNode }[] = [
  { slug: "bar-chart", fallback: "Bar Chart", className: "sm:col-span-2 row-span-2", render: <BarChart /> },
  { slug: "like-button", fallback: "Like Button", className: "", render: <LikeButton /> },
  { slug: "star-rating", fallback: "Star Rating", className: "", render: <StarRating /> },
  { slug: "contribution-heatmap", fallback: "Contribution Heatmap", className: "sm:col-span-2", render: <ContributionHeatmap /> },
  { slug: "range-slider", fallback: "Range Slider", className: "", render: <RangeSlider /> },
  { slug: "toggle-group", fallback: "Toggle Group", className: "", render: <ToggleGroup /> },
  { slug: "hold-to-confirm", fallback: "Hold to Confirm", className: "", render: <HoldToConfirm /> },
  { slug: "copy-button", fallback: "Copy Button", className: "", render: <CopyButton /> },
  { slug: "combobox", fallback: "Combobox", className: "", render: <Combobox /> },
  { slug: "tag-input", fallback: "Tag Input", className: "", render: <TagInput /> },
  { slug: "carousel", fallback: "Carousel", className: "sm:col-span-2", render: <div className="w-full px-4"><Carousel height={150} /></div> },
  { slug: "button-group", fallback: "Button Group", className: "", render: <ButtonGroup /> },
  { slug: "password-input", fallback: "Password Input", className: "", render: <div className="w-full origin-center scale-[0.82]"><PasswordInput /></div> },
  { slug: "popover", fallback: "Popover", className: "", render: <Popover /> },
  { slug: "tooltip", fallback: "Tooltip", className: "", render: <Tooltip /> },
];

/** Studio Kit bento (3 columns at md): every row is full. */
const STUDIO_TILES: { slug: string; fallback: string; className: string; render: React.ReactNode }[] = [
  { slug: "meteors", fallback: "Meteors", className: "md:col-span-2", render: <Meteors className="h-full w-full rounded-xl" /> },
  { slug: "confetti-button", fallback: "Confetti Button", className: "", render: <ConfettiButton /> },
  { slug: "flip-card", fallback: "Flip Card", className: "md:row-span-2", render: <FlipCard /> },
  { slug: "swipe-cards", fallback: "Swipe Cards", className: "md:row-span-2", render: <SwipeCards /> },
  { slug: "notification-stack", fallback: "Notification Stack", className: "md:row-span-2", render: <NotificationStack /> },
  { slug: "orbit-loader", fallback: "Orbit Loader", className: "", render: <OrbitLoader /> },
  { slug: "toggle-switch", fallback: "Toggle Switch", className: "", render: <ToggleSwitch /> },
  { slug: "reorder-list", fallback: "Reorder List", className: "md:row-span-2", render: <ReorderList /> },
  { slug: "loading-button", fallback: "Loading Button", className: "md:col-span-2", render: <LoadingButton /> },
];

/** Backgrounds default to a fixed pixel height; let the hero gradient grow with its content. */
const HERO_GRADIENT_STYLE: React.CSSProperties = { height: "auto", border: "none" };

export default function HomePage() {
  const components = getAllComponents();
  const categories = getCategories();
  // Listed collections first, each group in display order.
  const collections = [...getCollections()].sort((a, b) => Number(b.listed) - Number(a.listed) || a.order - b.order);
  const designs = getDesigns();
  const countIn = (id: string) => components.filter((c) => c.collection === id).length;
  const collection = (id: string) => collections.find((c) => c.id === id);
  const newComponents = components.filter(isNewComponent);
  const newCollectionIds = new Set(newComponents.map((c) => c.collection));

  const scroll = collection("scroll");
  const shaders = collection("shaders");
  const ui = collection("ui");
  const studioKit = collection("studio-kit");
  const scrollName = scroll?.name ?? "Scroll";

  const newCollectionNames = collections.filter((col) => newComponents.some((c) => c.collection === col.id)).map((c) => c.name);
  const newCollectionList =
    newCollectionNames.length > 1 ? `${newCollectionNames.slice(0, -1).join(", ")} & ${newCollectionNames[newCollectionNames.length - 1]}` : newCollectionNames[0] ?? "";

  return (
    <div className="space-y-28 overflow-x-clip pb-24 sm:space-y-36">
      <section className="relative overflow-hidden border-b border-border">
        <MeshGradient borderRadius={0} style={HERO_GRADIENT_STYLE}>
          {/* Cancels the background’s 2rem content padding so the hero aligns with the rest of the page. */}
          <div className="-m-8 w-[calc(100%+4rem)] self-stretch bg-gradient-to-b from-background/30 via-background/50 to-background text-left">
            <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.15fr_1fr] lg:items-center">
              <div className="min-w-0 space-y-7">
                {newComponents.length > 0 ? (
                  <Link
                    href="/components?new=1"
                    className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 font-mono text-xs text-emerald-200 backdrop-blur hover:border-emerald-300/50"
                  >
                    <span className="min-w-0 truncate">
                      {NEW_VERSION_LABEL} • New: {newCollectionList} — {newComponents.length} components →
                    </span>
                  </Link>
                ) : (
                  <Link
                    href="/collections/scroll"
                    className="inline-flex max-w-full items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 font-mono text-xs text-sky-300 backdrop-blur hover:border-sky-400/50"
                  >
                    <span className="min-w-0 truncate">v{BRAND_CONFIG.version} • {components.length} components →</span>
                  </Link>
                )}
                <BlurInText
                  as="h1"
                  text="Motion primitives forged for production React"
                  className="text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl"
                />
                <p className="max-w-xl text-lg leading-relaxed text-foreground/75">
                  {components.length} animated components across {collections.length} collections. Copy the source with one CLI command or import the package — every
                  component is typed, SSR-safe, and respects reduced motion.
                </p>
                <HeroActions
                  componentCount={components.length}
                  secondary={newComponents.length > 0 ? { label: `What's new in ${NEW_VERSION_LABEL}`, href: "/components?new=1" } : { label: "Browse Scroll", href: "/collections/scroll" }}
                />
              </div>
              <div className="min-w-0">
                <CodeBlock
                  filename="terminal"
                  language="bash"
                  code={`# copy components (source + CSS module) into your app\nnpx ${BRAND_CONFIG.cliName} add mesh-gradient split-text smooth-scroll\n\n# or install the package\npnpm add ${BRAND_CONFIG.packageScope} motion`}
                />
              </div>
            </div>
          </div>
        </MeshGradient>
      </section>

      {/* 2 — Scroll */}
      <section className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6" aria-labelledby="scroll-heading">
        <SectionHeader
          id="scroll-heading"
          eyebrow={scrollName}
          count={countIn("scroll")}
          title="Scroll-driven storytelling"
          description={scroll?.description ?? "Sticky stacks, velocity marquees, and coverflows — each demo runs in its own scroll viewport."}
          href="/collections/scroll"
          linkLabel={`Browse ${scrollName}`}
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

      {/* 4 — Stats */}
      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:px-6 md:grid-cols-4" aria-label="Library at a glance">
        {[
          { value: components.length, label: "Animated components" },
          { value: collections.length, label: "Collections" },
          { value: categories.length, label: "Categories" },
          { value: designs.length, label: "Design system presets" },
        ].map((stat) => (
          <div key={stat.label} className="min-w-0 rounded-2xl border border-border bg-card/40 p-5">
            <NumberTicker value={stat.value} suffix="" className="text-3xl font-semibold tracking-tight text-foreground" />
            <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </section>


      {/* 6 — Cards & loaders */}
      <section className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6" aria-labelledby="cards-heading">
        <SectionHeader
          id="cards-heading"
          eyebrow={ui?.name ?? "UI"}
          title="Cards & loaders"
          description="The newest pieces: a tilting credit card, expanding accordion cards, and loading states that actually feel alive."
          href="/components"
          linkLabel="Browse all components"
        />
        <div className="grid auto-rows-[280px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CARD_TILES.map((t) => (
            <DemoFrame key={t.slug} slug={t.slug} title={meta(t.slug, t.fallback).title} stageClassName="" className={t.className}>
              {t.render}
            </DemoFrame>
          ))}
        </div>
      </section>

      {/* 7 — UI */}
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

      {/* 8a — Studio Kit */}
      <section className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6" aria-labelledby="studio-kit-heading">
        <SectionHeader
          id="studio-kit-heading"
          eyebrow={studioKit?.name ?? "Studio Kit"}
          count={countIn("studio-kit")}
          title={
            <>
              Studio Kit: <RotatingWords prefix="" words={["feedback", "delight", "clarity", "momentum"]} />
            </>
          }
          description={`${countIn("studio-kit")} everyday motion patterns, rebuilt on the ${BRAND_CONFIG.name} conventions: CSS Modules, typed props, keyboard support, and zero Tailwind or icon dependencies.`}
          href="/docs/studio-kit"
          linkLabel="Read the Studio Kit guide"
        />
        <div className="grid auto-rows-[260px] grid-cols-1 gap-4 md:grid-cols-3">
          {STUDIO_TILES.map((t) => (
            <DemoFrame key={t.slug} slug={t.slug} title={meta(t.slug, t.fallback).title} stageClassName="" className={t.className}>
              {t.render}
            </DemoFrame>
          ))}
        </div>
      </section>

      {/* 8b — Design systems */}
      <section className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6" aria-labelledby="designs-heading">
        <SectionHeader
          id="designs-heading"
          eyebrow="Design systems"
          title={`${designs.length} brand DESIGN.md presets`}
          description={`${joinNames(designs.map((d) => d.brand))} — browse their tokens, then re-skin any component with one click.`}
          href="/designs"
          linkLabel="Browse all designs"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {designs.slice(0, 8).map((d) => (
            <Link key={d.id} href={`/designs/${d.id}`} className="group min-w-0 overflow-hidden rounded-xl border border-border transition hover:border-neutral-600">
              <div className="h-52 overflow-hidden">
                <DesignMock brand={d.brand} theme={d.theme} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 8c — Collections */}
      <section className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6" aria-labelledby="collections-heading">
        <div className="space-y-2">
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Collections</div>
          <h2 id="collections-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {collections.length} collections, one set of conventions
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {collections.map((c, i) => (
            <Link
              key={c.id}
              href={`/collections/${c.id}`}
              className={`group flex min-w-0 flex-col rounded-2xl border border-border bg-card/40 p-6 transition hover:border-neutral-600 ${collectionSpan(i, collections.length)} ${
                collections.length % 2 === 1 && i === collections.length - 1 ? "sm:col-span-2" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 text-xl font-semibold">{c.name}</h3>
                <div className="flex shrink-0 items-center gap-1.5">
                  {newCollectionIds.has(c.id) && (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">New</span>
                  )}
                  <span className="font-mono text-xs text-muted-foreground">{countIn(c.id)} components</span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
              <span className="mt-auto inline-block pt-5 text-sm text-foreground/80 transition group-hover:translate-x-1">Browse collection →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
