# Changelog

## [2.1.0] - 2026-10-16

### Added
- **Design systems**: 11 DESIGN.md files from VoltAgent/awesome-design-md (Vercel, Cursor, Claude, Framer, Apple, Airbnb, Expo, ElevenLabs, Runway, Resend, Spotify) in `design-md/`, curated themes in `design-md/themes.json`, `scripts/build-designs.mjs`, `/designs` gallery and per-brand pages, and a Design preset picker on every component playground.
- **Themeable components**: every CSS Module now reads `--mf-bg`, `--mf-fg`, `--mf-surface`, `--mf-surface-raised`, `--mf-muted`, `--mf-subtle`, `--mf-border`, `--mf-border-strong`, and `--mf-accent`, falling back to the original values.
- **Docs redesign**: docs-style shell with top navigation, sectioned sidebar, "On This Page" scroll-spy, Copy Page as Markdown, prev/next navigation, GFM rendering, and Geist typography.
- `SETUP.md` run guide; repository metadata pointing at https://github.com/nitin-inloop/Motionfoundry.
- **Studio Kit collection**: 24 components ported from Swirl Studio Kit onto MotionFoundry conventions (CSS Modules, typed props with defaults, reduced-motion support, keyboard equivalents, no Tailwind or lucide dependency): `BlurInText`, `Typewriter`, `NumberTicker`, `SplitReveal`, `RotatingWords`, `ShimmerText`, `ShinyBorderButton`, `ConfettiButton`, `LoadingButton`, `SlideFillButton`, `ToggleSwitch`, `AnimatedCheckbox`, `FlipCard`, `SwipeCards`, `RevealCard`, `DrawBorderCard`, `Meteors`, `BeamLines`, `GridPulse`, `OrbitLoader`, `PulseLoader`, `NotificationStack`, `ReorderList`, `ExpandableSearch`.
- "Loaders and Feedback" category; `collection` field and `collections` summary in the registry.
- `scripts/build-registry.mjs` (registry generated from source, `--check` mode for CI) and `scripts/build-docs.mjs` (docs data generated from MDX).
- CLI `list --collection <id>`.
- Docs site: live previews with generated prop controls, live usage snippet, Props / Accessibility / Tailwind tabs, searchable catalog with live thumbnails, `/collections/[id]` pages, and a Studio Kit guide.
- READMEs for `@motionfoundry/ui` and `motionfoundry`.

### Fixed
- `@motionfoundry/ui` dist now contains real compiled components (esbuild ESM + CJS), emitted type declarations, and a `styles.css` with per-component scoped class names. Previously it exported placeholder functions and a stylesheet whose `.root`-style classes collided globally.
- CLI ships `dist/registry.json`, so it works when installed from npm; the entry-point check now works on Windows and through `npx`/symlinked bins.
- CLI installs stylesheets to `components/styles/` so each component's `../styles/<slug>.module.css` import resolves.
- Type errors in `MagneticButton` and `ElasticPressButton` (native button handlers conflicting with Motion's `onAnimationStart`/`onDrag*`).
- Docs site had no Tailwind/PostCSS setup and component pages had no preview.

### Removed
- Unused `lucide-react` runtime dependency from `@motionfoundry/ui`.
- Hand-maintained `packages/ui/styles/styles.css` (now generated into `dist/`).

## [2.0.0] - 2026-10-16

### Changed
- Replaced the entire public component collection with 24 new components across 6 architectural categories (`KineticType`, `GlyphCascade`, `TextMorph`, `OrbitingWords`, `AuroraHeadline`, `MagneticButton`, `VelocityButton`, `ElasticPressButton`, `ConstellationCard`, `LiquidGlassCard`, `HoloTiltCard`, `MorphingBorder`, `PortalRevealPanel`, `InfiniteMarquee`, `ScrollNarrative`, `ParallaxDepthScene`, `FluidMeshBackground`, `NoiseAurora`, `OrbitingParticles`, `LiquidBlob`, `MagneticDock`, `ScrollVelocityProgress`, `MorphingCommandPalette`, `StaggeredGridReveal`).
- Upgraded interactive playground with Full-Preview Mode and expanded component-specific controls.
