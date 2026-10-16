import Link from "next/link";
import { BRAND_CONFIG } from "../lib/brand";
import { getAllComponents, getCategories, getCollections } from "../lib/registry";
import { CodeBlock } from "../components/code-block";
import { HeroActions } from "../components/hero-actions";
import { DesignMock } from "../components/design-mock";
import { getDesigns } from "../lib/designs";
import {
  BlurInText,
  ConfettiButton,
  LoadingButton,
  ConstellationCard,
  FlipCard,
  HoloTiltCard,
  LiquidGlassCard,
  Meteors,
  NotificationStack,
  NumberTicker,
  OrbitLoader,
  ReorderList,
  RotatingWords,
  SwipeCards,
  ToggleSwitch,
} from "@motionfoundry/ui";

function Tile({ slug, title, className = "", children }: { slug: string; title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card/40 transition hover:border-neutral-600 ${className}`}>
      <div className="mf-stage flex flex-1 items-center justify-center overflow-hidden p-6">{children}</div>
      <Link href={`/components/${slug}`} className="flex items-center justify-between border-t border-border px-4 py-2.5 text-sm">
        <span className="font-medium text-foreground/90">{title}</span>
        <span className="font-mono text-[11px] text-muted-foreground transition group-hover:text-foreground/90">Open →</span>
      </Link>
    </div>
  );
}

export default function HomePage() {
  const components = getAllComponents();
  const categories = getCategories();
  const collections = getCollections();
  const studioKitCount = components.filter((c) => c.collection === "studio-kit").length;
  const designs = getDesigns();

  return (
    <div className="space-y-28 pb-24">
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div className="space-y-7">
            <Link
              href="/collections/studio-kit"
              className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 font-mono text-xs text-sky-300 hover:border-sky-400/50"
            >
              v{BRAND_CONFIG.version} • New: Studio Kit — {studioKitCount} components →
            </Link>
            <BlurInText
              as="h1"
              text="Motion primitives forged for production React"
              className="text-5xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl"
            />
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Copy the source with one CLI command or import the package. Every component is typed, SSR-safe, and respects reduced motion.
            </p>
            <HeroActions componentCount={components.length} />
          </div>
          <CodeBlock
            filename="terminal"
            language="bash"
            code={`# copy components (source + CSS module) into your app\nnpx ${BRAND_CONFIG.cliName} add rotating-words confetti-button flip-card\n\n# or install the package\npnpm add ${BRAND_CONFIG.packageScope} motion`}
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 md:grid-cols-4">
        {[
          { value: components.length, label: "Animated components" },
          { value: categories.length, label: "Categories" },
          { value: designs.length, label: "Design system presets" },
          { value: 100, label: "Reduced-motion aware", suffix: "%" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card/40 p-5">
            <NumberTicker value={stat.value} suffix={stat.suffix ?? ""} className="text-3xl font-semibold tracking-tight text-foreground" />
            <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="font-mono text-xs uppercase tracking-wider text-sky-400">New in v{BRAND_CONFIG.version}</div>
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
            <Link key={d.id} href={`/designs/${d.id}`} className="group overflow-hidden rounded-xl border border-border transition hover:border-neutral-600">
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

      <section className="mx-auto grid max-w-7xl gap-5 px-6 md:grid-cols-2">
        {collections.map((c) => (
          <Link key={c.id} href={`/collections/${c.id}`} className="group rounded-2xl border border-border bg-card/40 p-7 transition hover:border-neutral-600">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{c.name}</h3>
              <span className="font-mono text-xs text-muted-foreground">{c.count} components</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
            <span className="mt-5 inline-block text-sm text-foreground/80 transition group-hover:translate-x-1">Browse collection →</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
