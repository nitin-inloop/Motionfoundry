# @motionfoundry/ui

Production-ready animated React components — **137 components** in six collections:

- **Core** (24): kinetic typography, spatial cards, canvas networks, and developer-interface choreography.
- **Studio Kit** (24): everyday product motion — text reveals, feedback buttons, interactive cards, ambient backgrounds, loaders, and list interactions.
- **Shaders** (13): animated backgrounds — including 5 dark WebGL shaders — with every color and speed exposed (formerly "Gradients").
- **UI** (50): animated, accessible UI primitives (buttons, inputs, selects, dialogs, menus, tabs, toasts, tables, charts…) with no Radix/shadcn dependency.
- **Text FX** (8): GSAP-style split-text, mask wipes, elastic letters, text on a path, rolling hovers, marker highlights, scatter, and cube-flip words — no GSAP dependency.
- **Scroll** (18): Lenis-style smooth scrolling, parallax, scroll-filled text, horizontal tracks, stacking cards, velocity marquees, zoom reveals, and timelines — no Lenis dependency.

Every component is written in TypeScript with a scoped CSS Module, ships with sensible defaults (`<FlipCard />` renders a full demo), works in React Server Component trees, and respects `prefers-reduced-motion`.

## Install

```bash
pnpm add @motionfoundry/ui motion
# npm i @motionfoundry/ui motion
```

Peer dependencies: `react` and `react-dom` 18 or 19, plus `motion` 12 or 14. Seven Studio Kit components and several Core components are pure CSS, but `motion` is required for the package bundle as a whole.

## Usage

Import the stylesheet once (for example in `app/layout.tsx`), then use any component:

```tsx
import "@motionfoundry/ui/styles.css";
import { RotatingWords, ConfettiButton, FlipCard, NotificationStack } from "@motionfoundry/ui";

export default function Page() {
  return (
    <main>
      <h1>
        <RotatingWords prefix="Ship" words={["faster", "safer", "today"]} />
      </h1>
      <ConfettiButton label="Celebrate" onClick={() => console.log("🎉")} />
      <FlipCard trigger="click" frontTitle="Front" backTitle="Back" />
      <NotificationStack messages={["Build succeeded", "Deployed"]} />
    </main>
  );
}
```

The bundle is marked `"use client"`, so you can render components directly from Server Components. Class names in `styles.css` are scoped per component and never collide with your own CSS.

## Prefer owning the source?

The [`motionfoundry`](https://www.npmjs.com/package/motionfoundry) CLI copies a component's `.tsx` and `.module.css` into your project instead:

```bash
npx motionfoundry add rotating-words confetti-button flip-card
```

## Components

### Scroll (18)

**Scroll Animations**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `SmoothScroll` | `smooth-scroll` | no |
| `ParallaxLayers` | `parallax-layers` | no |
| `ScrollFillText` | `scroll-fill-text` | no |
| `HorizontalScroll` | `horizontal-scroll` | no |
| `StickyStackCards` | `sticky-stack-cards` | no |
| `VelocityMarquee` | `velocity-marquee` | no |
| `ScrollZoomReveal` | `scroll-zoom-reveal` | no |
| `ScrollTimeline` | `scroll-timeline` | no |
| `ScrollCoverflow` | `scroll-coverflow` | no |
| `SplitScreenScroll` | `split-screen-scroll` | no |
| `PinnedSteps` | `pinned-steps` | no |
| `ParallaxColumns` | `parallax-columns` | no |
| `ScrollWordSwap` | `scroll-word-swap` | no |
| `ScrollTiltCards` | `scroll-tilt-cards` | no |
| `ScrollPathDraw` | `scroll-path-draw` | no |
| `ScrollFocusList` | `scroll-focus-list` | no |
| `SnapSections` | `snap-sections` | no |
| `ScrollColorShift` | `scroll-color-shift` | no |


### Shaders (13)

**Gradient Backgrounds**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `MeshGradient` | `mesh-gradient` | no |
| `AuroraRibbons` | `aurora-ribbons` | no |
| `ConicGradient` | `conic-gradient` | no |
| `LiquidGradient` | `liquid-gradient` | no |
| `WaveGradient` | `wave-gradient` | no |
| `GradientOrbs` | `gradient-orbs` | no |
| `GrainGradient` | `grain-gradient` | no |
| `SpotlightGradient` | `spotlight-gradient` | no |
| `NebulaGradient` | `nebula-gradient` | no |
| `PlasmaGradient` | `plasma-gradient` | no |
| `SilkGradient` | `silk-gradient` | no |
| `EmberGradient` | `ember-gradient` | no |
| `EclipseGradient` | `eclipse-gradient` | no |


### UI (50)

**Interactive Buttons and Controls**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `Button` | `button` | no |
| `IconButton` | `icon-button` | no |
| `ButtonGroup` | `button-group` | no |
| `CopyButton` | `copy-button` | yes |
| `ToggleGroup` | `toggle-group` | yes |
| `LikeButton` | `like-button` | yes |
| `SplitButton` | `split-button` | yes |
| `HoldToConfirm` | `hold-to-confirm` | no |

**Forms and Inputs**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `FloatingInput` | `floating-input` | yes |
| `OtpInput` | `otp-input` | yes |
| `PasswordInput` | `password-input` | yes |
| `TagInput` | `tag-input` | yes |
| `NumberStepper` | `number-stepper` | yes |
| `RangeSlider` | `range-slider` | yes |
| `RadioCards` | `radio-cards` | yes |
| `SegmentedControl` | `segmented-control` | yes |
| `Select` | `select` | yes |
| `Combobox` | `combobox` | yes |
| `FileDropzone` | `file-dropzone` | yes |
| `StarRating` | `star-rating` | yes |

**Overlays and Menus**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `Dialog` | `dialog` | yes |
| `Drawer` | `drawer` | yes |
| `BottomSheet` | `bottom-sheet` | yes |
| `Popover` | `popover` | yes |
| `HoverCard` | `hover-card` | yes |
| `Tooltip` | `tooltip` | yes |
| `DropdownMenu` | `dropdown-menu` | yes |
| `ContextMenu` | `context-menu` | yes |
| `AlertDialog` | `alert-dialog` | yes |
| `Toast` | `toast` | yes |

**Navigation**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `Tabs` | `tabs` | yes |
| `Breadcrumb` | `breadcrumb` | yes |
| `Pagination` | `pagination` | yes |
| `Stepper` | `stepper` | yes |
| `Accordion` | `accordion` | yes |
| `NavigationMenu` | `navigation-menu` | yes |
| `SidebarNav` | `sidebar-nav` | yes |
| `Menubar` | `menubar` | yes |

**Data Display**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `AvatarGroup` | `avatar-group` | no |
| `Badge` | `badge` | yes |
| `ProgressRing` | `progress-ring` | no |
| `StatCard` | `stat-card` | no |
| `BarChart` | `bar-chart` | no |
| `Sparkline` | `sparkline` | no |
| `TreeView` | `tree-view` | yes |
| `DataTable` | `data-table` | yes |
| `ActivityFeed` | `activity-feed` | yes |
| `ContributionHeatmap` | `contribution-heatmap` | no |
| `ImageCompare` | `image-compare` | no |
| `Carousel` | `carousel` | yes |


### Text FX (8) — in the package, not listed on the site

**Advanced Text Animations**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `SplitText` | `split-text` | no |
| `MaskWipeText` | `mask-wipe-text` | no |
| `ElasticLetters` | `elastic-letters` | no |
| `TextOnPath` | `text-on-path` | no |
| `RollingText` | `rolling-text` | no |
| `MarkerHighlight` | `marker-highlight` | no |
| `ScatterText` | `scatter-text` | no |
| `CubeFlipWords` | `cube-flip-words` | no |


### Studio Kit (24) — in the package, not listed on the site

**Advanced Text Animations**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `BlurInText` | `blur-in-text` | yes |
| `Typewriter` | `typewriter` | yes |
| `NumberTicker` | `number-ticker` | yes |
| `SplitReveal` | `split-reveal` | yes |
| `RotatingWords` | `rotating-words` | yes |
| `ShimmerText` | `shimmer-text` | no |

**Interactive Buttons and Controls**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `ShinyBorderButton` | `shiny-border-button` | no |
| `ConfettiButton` | `confetti-button` | yes |
| `LoadingButton` | `loading-button` | yes |
| `SlideFillButton` | `slide-fill-button` | yes |
| `ToggleSwitch` | `toggle-switch` | yes |
| `AnimatedCheckbox` | `animated-checkbox` | yes |

**High-End Animated Cards**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `FlipCard` | `flip-card` | yes |
| `SwipeCards` | `swipe-cards` | yes |
| `RevealCard` | `reveal-card` | yes |
| `DrawBorderCard` | `draw-border-card` | yes |

**Animated Backgrounds and Visual Effects**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `Meteors` | `meteors` | no |
| `BeamLines` | `beam-lines` | no |
| `GridPulse` | `grid-pulse` | no |

**Developer-Interface Animations**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `ReorderList` | `reorder-list` | yes |
| `ExpandableSearch` | `expandable-search` | yes |

**Loaders and Feedback**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `OrbitLoader` | `orbit-loader` | no |
| `PulseLoader` | `pulse-loader` | no |
| `NotificationStack` | `notification-stack` | yes |


### Core (24) — in the package, not listed on the site

**Advanced Text Animations**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `KineticType` | `kinetic-type` | yes |
| `GlyphCascade` | `glyph-cascade` | no |
| `TextMorph` | `text-morph` | yes |
| `OrbitingWords` | `orbiting-words` | no |
| `AuroraHeadline` | `aurora-headline` | yes |

**Interactive Buttons and Controls**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `MagneticButton` | `magnetic-button` | yes |
| `VelocityButton` | `velocity-button` | no |
| `ElasticPressButton` | `elastic-press-button` | yes |

**High-End Animated Cards**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `ConstellationCard` | `constellation-card` | no |
| `LiquidGlassCard` | `liquid-glass-card` | no |
| `HoloTiltCard` | `holo-tilt-card` | yes |
| `MorphingBorder` | `morphing-border` | no |

**Reveals and Continuous Motion**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `PortalRevealPanel` | `portal-reveal-panel` | yes |
| `InfiniteMarquee` | `infinite-marquee` | no |
| `ScrollNarrative` | `scroll-narrative` | yes |
| `ParallaxDepthScene` | `parallax-depth-scene` | yes |

**Animated Backgrounds and Visual Effects**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `FluidMeshBackground` | `fluid-mesh-background` | no |
| `NoiseAurora` | `noise-aurora` | no |
| `OrbitingParticles` | `orbiting-particles` | no |
| `LiquidBlob` | `liquid-blob` | no |

**Developer-Interface Animations**

| Component | Slug | Needs `motion` |
| --- | --- | --- |
| `MagneticDock` | `magnetic-dock` | yes |
| `ScrollVelocityProgress` | `scroll-velocity-progress` | no |
| `MorphingCommandPalette` | `morphing-command-palette` | yes |
| `StaggeredGridReveal` | `staggered-grid-reveal` | yes |

Full prop tables, live playgrounds, and accessibility notes for every component are in the documentation site (`apps/docs`, run `pnpm dev` from the repository root).

## Accessibility

- Split-text effects expose the full sentence to assistive technology and hide the animated fragments.
- Loaders use `role="status"`, toasts announce via a polite live region, switches and checkboxes use the right roles and `aria-checked`.
- Every pointer gesture (swipe, drag-to-reorder, hover reveals, flips) has a keyboard equivalent.
- Under `prefers-reduced-motion: reduce`, components render their settled state.

## License

MIT
