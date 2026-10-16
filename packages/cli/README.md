# motionfoundry

CLI for installing [MotionFoundry](https://github.com/motionfoundry/motionfoundry) animated React components as **source files** you own. Each component is one `.tsx` file plus one scoped `.module.css`.

## Usage

```bash
# list all 72 components, or one collection
npx motionfoundry list
npx motionfoundry list --collection studio-kit
npx motionfoundry list --collection gradients

# write motionfoundry.json (detects Next.js App/Pages Router or Vite)
npx motionfoundry init

# copy components into your project
npx motionfoundry add rotating-words confetti-button flip-card
```

Files are written relative to `src/` when it exists, otherwise to the project root:

```
components/ui/flip-card.tsx
components/styles/flip-card.module.css
```

The CLI then prints the peer dependencies you still need (usually `motion`).

## Options

| Option | Description |
| --- | --- |
| `--dir <path>` | Target project directory (default: current directory) |
| `--overwrite` | Replace files that already exist (by default existing files are kept so your edits are safe) |
| `--collection <id>` | With `list`: show one collection: `core`, `studio-kit`, `gradients`, `text-fx`, or `scroll` |
| `--version`, `-v` | Print the CLI version |

## Collections

- **core**: the original 24 precision primitives (kinetic type, spatial cards, canvas networks, command palette, dock).
- **studio-kit**: 24 everyday motion patterns: `blur-in-text`, `typewriter`, `number-ticker`, `split-reveal`, `rotating-words`, `shimmer-text`, `shiny-border-button`, `confetti-button`, `loading-button`, `slide-fill-button`, `toggle-switch`, `animated-checkbox`, `flip-card`, `swipe-cards`, `reveal-card`, `draw-border-card`, `meteors`, `beam-lines`, `grid-pulse`, `orbit-loader`, `pulse-loader`, `notification-stack`, `reorder-list`, `expandable-search`.
- **gradients** (new in 2.2): `mesh-gradient`, `aurora-ribbons`, `conic-gradient`, `liquid-gradient`, `wave-gradient`, `gradient-orbs`, `grain-gradient`, `spotlight-gradient`.
- **text-fx** (new in 2.2, GSAP-style, no GSAP dependency): `split-text`, `mask-wipe-text`, `elastic-letters`, `text-on-path`, `rolling-text`, `marker-highlight`, `scatter-text`, `cube-flip-words`.
- **scroll** (new in 2.2, Lenis-style, no Lenis dependency): `smooth-scroll`, `parallax-layers`, `scroll-fill-text`, `horizontal-scroll`, `sticky-stack-cards`, `velocity-marquee`, `scroll-zoom-reveal`, `scroll-timeline`.

Prefer a package dependency? Use [`@motionfoundry/ui`](https://www.npmjs.com/package/@motionfoundry/ui).

## License

MIT
