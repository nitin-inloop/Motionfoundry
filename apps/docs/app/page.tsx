import Link from "next/link";
import { BRAND_CONFIG } from "../lib/brand";
import { NEW_VERSION_LABEL, getAllComponents, getCategories, getCollections, isNewComponent, type RegistryCollection } from "../lib/registry";
import { CodeBlock } from "../components/code-block";
import { HeroActions } from "../components/hero-actions";
import { DesignMock } from "../components/design-mock";
import { LazyMount } from "../components/component-preview";
import { getDesigns } from "../lib/designs";
import {
  AuroraRibbons,
  BlurInText,
  ConfettiButton,
  ConicGradient,
  ConstellationCard,
  CubeFlipWords,
  FlipCard,
  GrainGradient,
  HoloTiltCard,
  LiquidGlassCard,
  LiquidGradient,
  LoadingButton,
  MarkerHighlight,
  MeshGradient,
  Meteors,
  NotificationStack,
  NumberTicker,
  OrbitLoader,
  ReorderList,
  RollingText,
  RotatingWords,
  SmoothScroll,
  SplitText,
  SwipeCards,
  ToggleSwitch,
  VelocityMarquee,
} from "@motionfoundry/ui";

function Tile({ slug, title, className = "", children }: { slug: string; title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card/40 transition hover:border-neutral-600 ${className}`}>
      <div className="mf-stage flex flex-1 items-center justify-center overflow-hidden p-6">{children}</div>
      <Link href={`/components/${slug}`} className="flex items-center justify-between border-t border-border px-4 py-2.5 text-sm">
        <span className="font-medium text-foreground/90">{title}</span>
        <span className="font-mono text-[11px] text-muted-foreground transition group-hover:text-foreground/90">Open →</span>
      </Link>
    </div>
  );
}

/** Below-the-fold tile: fixed-height stage (no layout shift) that only mounts its demo near the viewport. */
function LazyTile({
  slug,
  title,
  stageClassName,
  hint,
  children,
}: {
  slug: string;
  title: string;
  stageClassName: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card/40 transition hover:border-neutral-600">
      <div className={`mf-stage relative overflow-hidden ${stageClassName}`}>
        <LazyMount className="absolute inset-0 flex items-center justify-center overflow-hidden">{children}</LazyMount>
        {hint && (
          <span className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full border border-border bg-background/80 px-2.5 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur">
            {hint}
          </span>
        )}
      </div>
      <Link href={`/components/${slug}`} className="flex items-center justify-between border-t border-border px-4 py-2.5 text-sm">
        <span className="font-medium text-foreground/90">{title}</span>
        <span className="font-mono text-[11px] text-muted-foreground transition group-hover:text-foreground/90">Open →</span>
      </Link>
    </div>
  );
}

/** Small live gradient swatch; the whole tile links to the component page. */
function GradientTile({ slug, title, children }: { slug: string; title: string; children: React.ReactNode }) {
  return (
    <Link
      href={`/components/${slug}`}
      className="group relative block h-40 min-w-0 overflow-hidden rounded-xl border border-border bg-card transition hover:border-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <LazyMount className="pointer-events-none absolute inset-0 overflow-hidden">{children}</LazyMount>
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 text-sm">
        <span className="font-medium text-white">{title}</span>
        <span className="font-mono text-[10px] text-white/70 transition group-hover:translate-x-0.5 group-hover:text-white">Open →</span>
      </span>
    </Link>
  );
}

/** Empty children suppress a background's built-in demo copy so only the effect shows in a swatch. */
const SWATCH = <span aria-hidden="true" />;
/** Backgrounds default to a fixed pixel height; let them fill their tile / grow with the hero instead. */
const SWATCH_STYLE: React.CSSProperties = { height: "100%", border: "none" };
const HERO_GRADIENT_STYLE: React.CSSProperties = { height: "auto", border: "none" };

function CollectionIntro({
  id,
  fallbackName,
  count,
  collections,
  children,
}: {
  id: string;
  fallbackName: string;
  count: number;
  collections: RegistryCollection[];
  children: React.ReactNode;
}) {
  const collection = collections.find((c) => c.id === id);
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <h3 className="text-xl font-semibold tracking-tight">{collection?.name ?? fallbackName}</h3>
        {count > 0 && <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{count} components</span>}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{collection?.description ?? children}</p>
      <Link href={`/collections/${id}`} className="mt-1 text-sm text-foreground/80 underline decoration-neutral-600 underline-offset-4 hover:text-foreground">
        Browse collection →
      </Link>
    </div>
  );
}

/** Column spans for a 6-column grid so any number of collection cards fills complete rows. */
function collectionSpan(index: number, total: number): string {
  if (total <= 1) return "lg:col-span-6";
  const rem = total % 3;
  // Rows of three, except the first row(s) take the remainder as halves (5 → 2 + 3, 4 → 2 + 2, 7 → 2 + 2 + 3).
  const halves = rem === 0 ? 0 : rem === 2 ? 2 : 4;
  return index < Math.min(halves, total) ? "lg:col-span-3" : "lg:col-span-2";
}

export default function HomePage() {
  const components = getAllComponents();
  const categories = getCategories();
  const collections = getCollections();
  const designs = getDesigns();
  const countIn = (id: string) => components.filter((c) => c.collection === id).length;
  const studioKitCount = countIn("studio-kit");
  const newComponents = components.filter(isNewComponent);
  const newCollections = collections.filter((col) => newComponents.some((c) => c.collection === col.id));
  const newCollectionNames = newCollections.map((c) => c.name);
  const newCollectionList =
    newCollectionNames.length > 1 ? `${newCollectionNames.slice(0, -1).join(", ")} & ${newCollectionNames[newCollectionNames.length - 1]}` : newCollectionNames[0] ?? "";

  return (
    <div className="space-y-28 overflow-x-clip pb-24">
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
                    href="/collections/studio-kit"
                    className="inline-flex max-w-full items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 font-mono text-xs text-sky-300 backdrop-blur hover:border-sky-400/50"
                  >
                    <span className="min-w-0 truncate">
                      v{BRAND_CONFIG.version} • Studio Kit — {studioKitCount} components →
                    </span>
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
                  secondary={
                    newComponents.length > 0
                      ? { label: `What's new in ${NEW_VERSION_LABEL}`, href: "/components?new=1" }
                      : { label: "Browse Studio Kit", href: "/collections/studio-kit" }
                  }
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

      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 md:grid-cols-4">
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

      <section id="new" className="mx-auto max-w-7xl scroll-mt-24 space-y-12 px-6" aria-labelledby="new-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="font-mono text-xs uppercase tracking-wider text-emerald-300">New in {NEW_VERSION_LABEL}</div>
            <h2 id="new-heading" className="text-3xl font-semibold tracking-tight">
              {newComponents.length > 0 ? `${newComponents.length} new components` : "New components"}: gradients, text effects, and scroll
            </h2>
            <p className="max-w-2xl text-muted-foreground">
              Three new collections — living gradient backgrounds, character-level text effects, and scroll-driven storytelling. Every tile below is the real component.
            </p>
          </div>
          <Link href="/components?new=1" className="text-sm text-foreground/80 underline decoration-neutral-600 underline-offset-4 hover:text-foreground">
            See everything new →
          </Link>
        </div>

        <div className="grid gap-6 border-t border-border pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]">
          <CollectionIntro id="gradients" fallbackName="Gradients" count={countIn("gradients")} collections={collections}>
            Animated mesh, conic, liquid, and grain gradients that drop in behind any section as a background.
          </CollectionIntro>
          <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
            <GradientTile slug="aurora-ribbons" title="Aurora Ribbons">
              <AuroraRibbons borderRadius={0} style={SWATCH_STYLE}>
                {SWATCH}
              </AuroraRibbons>
            </GradientTile>
            <GradientTile slug="liquid-gradient" title="Liquid">
              <LiquidGradient borderRadius={0} style={SWATCH_STYLE}>
                {SWATCH}
              </LiquidGradient>
            </GradientTile>
            <GradientTile slug="conic-gradient" title="Conic">
              <ConicGradient borderRadius={0} style={SWATCH_STYLE}>
                {SWATCH}
              </ConicGradient>
            </GradientTile>
            <GradientTile slug="grain-gradient" title="Grain">
              <GrainGradient borderRadius={0} style={SWATCH_STYLE}>
                {SWATCH}
              </GrainGradient>
            </GradientTile>
          </div>
        </div>

        <div className="grid gap-6 border-t border-border pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]">
          <CollectionIntro id="text-fx" fallbackName="Text FX" count={countIn("text-fx")} collections={collections}>
            Split, mask, roll, and highlight headlines letter by letter — accessible to screen readers by default.
          </CollectionIntro>
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            <LazyTile slug="split-text" title="Split Text" stageClassName="h-44">
              <div className="scale-[0.75] sm:scale-[0.85]">
                <SplitText />
              </div>
            </LazyTile>
            <LazyTile slug="cube-flip-words" title="Cube Flip Words" stageClassName="h-44">
              <div className="scale-[0.75] sm:scale-[0.85]">
                <CubeFlipWords />
              </div>
            </LazyTile>
            <LazyTile slug="rolling-text" title="Rolling Text" stageClassName="h-44">
              <div className="scale-[0.75] sm:scale-[0.85]">
                <RollingText />
              </div>
            </LazyTile>
            <LazyTile slug="marker-highlight" title="Marker Highlight" stageClassName="h-44">
              <div className="scale-[0.6] sm:scale-[0.62]">
                <MarkerHighlight />
              </div>
            </LazyTile>
          </div>
        </div>

        <div className="grid gap-6 border-t border-border pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]">
          <CollectionIntro id="scroll" fallbackName="Scroll" count={countIn("scroll")} collections={collections}>
            Smooth scrolling, parallax, sticky stacks, and scroll-linked reveals — each renders its own scroll viewport.
          </CollectionIntro>
          <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <LazyTile slug="smooth-scroll" title="Smooth Scroll" stageClassName="h-[380px]" hint="Scroll inside ↓">
              <div className="h-full w-full [&>*]:max-h-full">
                <SmoothScroll />
              </div>
            </LazyTile>
            <LazyTile slug="velocity-marquee" title="Velocity Marquee" stageClassName="h-[380px]" hint="Scroll inside ↕">
              <div className="h-full w-full [&>*]:max-h-full">
                <VelocityMarquee />
              </div>
            </LazyTile>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="font-mono text-xs uppercase tracking-wider text-sky-400">Studio Kit · v2.1</div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Studio Kit: <RotatingWords prefix="" words={["feedback", "delight", "clarity", "momentum"]} />
            </h2>
            <p className="max-w-2xl text-muted-foreground">
              {studioKitCount} everyday motion patterns, rebuilt on the {BRAND_CONFIG.name} conventions: CSS Modules, typed props, keyboard support, and zero Tailwind or icon dependencies.
            </p>
          </div>
          <Link href="/docs/studio-kit" className="text-sm text-foreground/80 underline decoration-neutral-600 underline-offset-4 hover:text-white">
            Read the Studio Kit guide →
          </Link>
        </div>

        <div className="grid auto-rows-[260px] grid-cols-1 gap-4 md:grid-cols-3">
          <Tile slug="meteors" title="Meteors" className="md:col-span-2">
            <Meteors className="h-full w-full rounded-xl" />
          </Tile>
          <Tile slug="confetti-button" title="Confetti Button">
            <ConfettiButton />
          </Tile>
          <Tile slug="flip-card" title="Flip Card" className="md:row-span-2">
            <FlipCard />
          </Tile>
          <Tile slug="swipe-cards" title="Swipe Cards" className="md:row-span-2">
            <SwipeCards />
          </Tile>
          <Tile slug="notification-stack" title="Notification Stack" className="md:row-span-2">
            <NotificationStack />
          </Tile>
          <Tile slug="orbit-loader" title="Orbit Loader">
            <OrbitLoader />
          </Tile>
          <Tile slug="toggle-switch" title="Toggle Switch">
            <ToggleSwitch />
          </Tile>
          <Tile slug="reorder-list" title="Reorder List" className="md:row-span-2">
            <ReorderList />
          </Tile>
          <Tile slug="loading-button" title="Loading Button" className="md:col-span-2">
            <LoadingButton />
          </Tile>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Design systems</div>
            <h2 className="text-3xl font-semibold tracking-tight">{designs.length} brand DESIGN.md presets</h2>
            <p className="max-w-2xl text-muted-foreground">
              Vercel, Cursor, Claude, Framer, Apple, Airbnb, Expo, ElevenLabs, Runway, Resend, and Spotify — browse their tokens, then re-skin any component with one click.
            </p>
          </div>
          <Link href="/designs" className="text-sm text-foreground/80 underline decoration-neutral-600 underline-offset-4 hover:text-foreground">
            Browse all designs →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {designs.slice(0, 8).map((d) => (
            <Link key={d.id} href={`/designs/${d.id}`} className="group min-w-0 overflow-hidden rounded-xl border border-border transition hover:border-neutral-600">
              <div className="h-52">
                <DesignMock brand={d.brand} theme={d.theme} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6">
        <div className="space-y-2">
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Core collection</div>
          <h2 className="text-3xl font-semibold tracking-tight">Spatial surfaces and canvas engines</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <ConstellationCard />
          <LiquidGlassCard />
          <HoloTiltCard />
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6" aria-labelledby="collections-heading">
        <div className="space-y-2">
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Collections</div>
          <h2 id="collections-heading" className="text-3xl font-semibold tracking-tight">
            {collections.length} collections, one set of conventions
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {collections.map((c, i) => {
            const count = countIn(c.id);
            const isNew = newCollections.some((n) => n.id === c.id);
            return (
              <Link
                key={c.id}
                href={`/collections/${c.id}`}
                className={`group flex min-w-0 flex-col rounded-2xl border border-border bg-card/40 p-6 transition hover:border-neutral-600 ${collectionSpan(i, collections.length)} ${
                  collections.length % 2 === 1 && i === collections.length - 1 ? "sm:col-span-2" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-semibold">{c.name}</h3>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {isNew && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">New</span>
                    )}
                    <span className="font-mono text-xs text-muted-foreground">{count} components</span>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
                <span className="mt-auto inline-block pt-5 text-sm text-foreground/80 transition group-hover:translate-x-1">Browse collection →</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
