<p align="center"><img src="apps/docs/public/logo.png" width="96" height="96" alt="MotionFoundry logo" /></p>

# MotionFoundry (`@motionfoundry/ui` v2.4.1)

> **Get started:** see [SETUP.md](./SETUP.md) for prerequisites, running the docs site, builds, tests, and deployment.
> Repository: https://github.com/nitin-inloop/Motionfoundry

Precision-engineered, open-source animated React component library, CLI source installer, and interactive documentation platform built with **Next.js App Router**, **TypeScript**, **Motion (`motion/react`)**, **SVG**, **HTML5 Canvas**, and **scoped CSS Modules**.

## 142 Animated Components

### Core (24)

1. **Advanced Text Animations**: `KineticType`, `GlyphCascade`, `TextMorph`, `OrbitingWords`, `AuroraHeadline`
2. **Interactive Buttons and Controls**: `MagneticButton`, `VelocityButton`, `ElasticPressButton`
3. **High-End Animated Cards**: `ConstellationCard`, `LiquidGlassCard`, `HoloTiltCard`, `MorphingBorder`
4. **Reveals and Continuous Motion**: `PortalRevealPanel`, `InfiniteMarquee`, `ScrollNarrative`, `ParallaxDepthScene`
5. **Animated Backgrounds and Visual Effects**: `FluidMeshBackground`, `NoiseAurora`, `OrbitingParticles`, `LiquidBlob`
6. **Developer-Interface Animations**: `MagneticDock`, `ScrollVelocityProgress`, `MorphingCommandPalette`, `StaggeredGridReveal`

### Studio Kit (24) — new in v2.1

Hand-picked from the Swirl Studio Kit prototypes and rebuilt on MotionFoundry conventions (see `apps/docs/content/docs/studio-kit.mdx`):

1. **Advanced Text Animations**: `BlurInText`, `Typewriter`, `NumberTicker`, `SplitReveal`, `RotatingWords`, `ShimmerText`
2. **Interactive Buttons and Controls**: `ShinyBorderButton`, `ConfettiButton`, `LoadingButton`, `SlideFillButton`, `ToggleSwitch`, `AnimatedCheckbox`
3. **High-End Animated Cards**: `FlipCard`, `SwipeCards`, `RevealCard`, `DrawBorderCard`
4. **Animated Backgrounds and Visual Effects**: `Meteors`, `BeamLines`, `GridPulse`
5. **Loaders and Feedback**: `OrbitLoader`, `PulseLoader`, `NotificationStack`
6. **Developer-Interface Animations**: `ReorderList`, `ExpandableSearch`

### Scroll (18), Shaders (13) & UI (50) — the headline collections

The docs site leads with these three. **UI** (new in v2.3) is 50 animated primitives built from scratch — buttons, inputs, selects, dialogs, drawers, menus, tabs, toasts, tables, charts, and more — following WAI-ARIA patterns with no Radix or shadcn dependency. **Shaders** (formerly Gradients) adds 5 dark WebGL backgrounds in v2.3, and **Scroll** adds 10 more smooth-scroll effects. See `apps/docs/content/docs/gradients-text-scroll.mdx`.

### Gradients → Shaders (8 from v2.2)

`MeshGradient`, `AuroraRibbons`, `ConicGradient`, `LiquidGradient`, `WaveGradient`, `GradientOrbs`, `GrainGradient`, `SpotlightGradient` — animated backgrounds with every color, speed, and texture exposed as props.

### Text FX (8) — new in v2.2

`SplitText`, `MaskWipeText`, `ElasticLetters`, `TextOnPath`, `RollingText`, `MarkerHighlight`, `ScatterText`, `CubeFlipWords` — GSAP-style eases and staggers, built from scratch (no GSAP dependency).

### Scroll (8) — new in v2.2

`SmoothScroll`, `ParallaxLayers`, `ScrollFillText`, `HorizontalScroll`, `StickyStackCards`, `VelocityMarquee`, `ScrollZoomReveal`, `ScrollTimeline` — Lenis-style smooth scrolling, built from scratch (no Lenis dependency); each renders its own scroll viewport.

## 11 Brand Design Systems

`design-md/` vendors DESIGN.md files from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT) for **Vercel, Cursor, Claude, Framer, Apple, Airbnb, Expo, ElevenLabs, Runway, Resend, and Spotify**. Each has a curated theme in `design-md/themes.json`. The docs site renders a page per brand (tokens, type specimen, live re-skinned components, full spec), and every component playground has a **Design** picker. Components read `--mf-*` CSS variables (with their original values as fallbacks), so any wrapper can adopt a brand theme.

## Repository Layout

| Path | Purpose |
| --- | --- |
| `packages/ui/src/components/*.tsx` + `src/styles/*.module.css` | Component source (single source of truth) |
| `registry/components/*.json` | Per-component metadata: description, controls, props API, a11y notes, Tailwind variant |
| `registry/registry.json` | Generated manifest consumed by the CLI and docs (`scripts/build-registry.mjs`) |
| `packages/ui` | `@motionfoundry/ui` — compiled ESM/CJS bundle, types, `styles.css` |
| `packages/cli` | `motionfoundry` CLI — copies component source into apps |
| `apps/docs` | Next.js docs site with live previews and prop playgrounds (imports components from source) |
| `apps/docs/content/docs/*.mdx` | Documentation copy; `scripts/build-docs.mjs` generates `apps/docs/lib/docs.ts` |
| `design-md/` | Vendored DESIGN.md files + `themes.json`; `scripts/build-designs.mjs` generates `registry/designs.json` |

## Quickstart & Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Regenerate registry, design systems, and docs data; build @motionfoundry/ui and the CLI
node scripts/build-registry.mjs
node scripts/build-designs.mjs
node scripts/build-docs.mjs
node packages/ui/scripts/build.mjs
node packages/cli/scripts/build.mjs

# 3. Run the docs site with live component playgrounds
pnpm dev

# 4. Try the CLI component installer
node packages/cli/dist/index.mjs list --collection studio-kit
node packages/cli/dist/index.mjs add rotating-words confetti-button flip-card --dir ./examples/nextjs-app

# 5. Run lint, typecheck, and automated test suite
node tests/lint-check.mjs
node tests/typecheck.mjs
node --test tests/motionfoundry.test.mjs
```

## Adding a Component

1. Write `packages/ui/src/components/<slug>.tsx` and `packages/ui/src/styles/<slug>.module.css`.
2. Export it (and its `Props` type) from `packages/ui/src/index.ts` — export order is registry order.
3. Add `registry/components/<slug>.json` with metadata (`files` may be `[]`).
4. Run `node scripts/build-registry.mjs`; the docs site picks it up automatically.
