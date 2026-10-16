# Setup Guide

How to get MotionFoundry running locally, build every package, run the checks, and ship it.

- **Repository:** https://github.com/nitin-inloop/Motionfoundry
- **What's inside:** `@motionfoundry/ui` (48 animated React components), the `motionfoundry` CLI, the Next.js docs site with live playgrounds, and 11 brand design systems (`design-md/`).

---

## 1. Prerequisites

| Tool | Version | Check | Install |
| --- | --- | --- | --- |
| Node.js | **20.9 or newer** (22 LTS recommended) | `node -v` | https://nodejs.org |
| pnpm | **9.x** (the repo pins `pnpm@9.12.0`) | `pnpm -v` | `corepack enable` (ships with Node), or `npm i -g pnpm@9` |
| Git | any recent | `git --version` | https://git-scm.com |

> **No global pnpm?** Every `pnpm …` command below also works as `npx pnpm@9.12.0 …`.

---

## 2. Clone and install

```bash
git clone https://github.com/nitin-inloop/Motionfoundry.git
cd Motionfoundry
pnpm install
```

`pnpm install` installs every workspace listed in `pnpm-workspace.yaml`:

| Workspace | Path | Purpose |
| --- | --- | --- |
| `@motionfoundry/ui` | `packages/ui` | Component source + build (ESM, CJS, types, `styles.css`) |
| `motionfoundry` | `packages/cli` | CLI that copies component source into apps |
| `@motionfoundry/docs` | `apps/docs` | Next.js documentation site |
| `motionfoundry-nextjs-example` | `examples/nextjs-app` | Minimal consumer app |

---

## 3. Run the docs site (development)

```bash
pnpm dev
```

Open **http://localhost:3000**. The site imports components straight from `packages/ui/src`, so edits to a component or its CSS Module hot-reload immediately — no package rebuild needed.

| Route | What you'll find |
| --- | --- |
| `/` | Landing page with live showcases |
| `/docs/getting-started` | Documentation (17 pages) |
| `/components` | Searchable catalog with live thumbnails |
| `/components/<slug>` | Playground: live preview, prop controls, Design preset picker, usage, props, source |
| `/collections/studio-kit` | The 24 Studio Kit components |
| `/designs` | 11 brand design systems (Vercel, Cursor, Claude, Framer, Apple, Airbnb, Expo, ElevenLabs, Runway, Resend, Spotify) |

---

## 4. Build everything (production)

```bash
pnpm build
```

This runs, in order:

1. `node scripts/build-registry.mjs` — regenerates `registry/` from `packages/ui/src` and `registry/components/*.json`
2. `node scripts/build-designs.mjs` — parses `design-md/*/DESIGN.md` + `design-md/themes.json` into `registry/designs.json`
3. `node scripts/build-docs.mjs` — generates `apps/docs/lib/docs.ts` from `apps/docs/content/docs/*.mdx`
4. `node packages/ui/scripts/build.mjs` — bundles `@motionfoundry/ui` into `packages/ui/dist/`
5. `node packages/cli/scripts/build.mjs` — builds the CLI and bundles its registry copy
6. `next build` for the docs site

Serve the production docs build:

```bash
pnpm start          # http://localhost:3000
```

---

## 5. Run the checks

```bash
pnpm check
```

`pnpm check` runs the same gates as CI (`.github/workflows/ci.yml`):

| Command | Verifies |
| --- | --- |
| `node scripts/build-registry.mjs --check` | Registry JSON matches component source |
| `node scripts/build-designs.mjs --check` | `registry/designs.json` matches `design-md/` |
| `node scripts/build-docs.mjs --check` | `apps/docs/lib/docs.ts` matches the MDX files |
| `node tests/lint-check.mjs` | No `any`, no `framer-motion`, every component has a CSS Module |
| `node tests/typecheck.mjs` | `tsc --noEmit` is clean and every export/declaration exists |
| `node --test tests/motionfoundry.test.mjs` | Registry, package bundle, CLI install flow, docs, and design systems |

> The package and CLI tests import from `dist/`, so run `pnpm build:ui` and `pnpm build:cli` (or `pnpm build`) first on a fresh clone.

---

## 6. Try the CLI locally

```bash
pnpm build:registry && pnpm build:cli

node packages/cli/dist/index.mjs list
node packages/cli/dist/index.mjs list --collection studio-kit

# install components into any project folder
node packages/cli/dist/index.mjs add rotating-words confetti-button flip-card --dir ../my-app
```

Files land in `components/ui/<slug>.tsx` and `components/styles/<slug>.module.css` (under `src/` if the target has one). Existing files are kept unless you pass `--overwrite`.

---

## 7. Common tasks

### Add or edit a component

1. Edit `packages/ui/src/components/<slug>.tsx` and `packages/ui/src/styles/<slug>.module.css`.
2. For a **new** component: export it from `packages/ui/src/index.ts` and add `registry/components/<slug>.json` (metadata, `controls`, `defaultProps`, `propsApi`; `files` may be `[]`).
3. Run `pnpm build:registry` — the docs site picks it up automatically.

### Edit documentation

Edit `apps/docs/content/docs/<page>.mdx`, then run `pnpm build:docs-content`. New pages must also be added to the `ORDER` list in `scripts/build-docs.mjs`.

### Add a design system

1. Copy a `DESIGN.md` from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) into `design-md/<id>/DESIGN.md`.
2. Add its theme to `design-md/themes.json` (`accent` and `secondary` must be `#rrggbb`).
3. Run `pnpm build:designs`.

---

## 8. Deploy the docs site

**Vercel (recommended):**

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to **`apps/docs`** (Project → Settings → Build and Deployment). Leave "Include files outside the root directory" enabled — the site reads `registry/` and `packages/ui/src/` from the monorepo.
3. Deploy. `apps/docs/vercel.json` sets the framework, install, and build commands; pnpm installs the whole workspace from the repo root. No environment variables are required.

The site's generated data (`registry/*.json`, `apps/docs/lib/docs.ts`) is committed, so the deploy only runs `next build`. Regenerate and commit those files (`pnpm build`) after changing components, designs, or docs.

**Any Node host:**

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start            # set PORT to change the port
```

---

## 9. Publish to npm

```bash
pnpm build
npm login

cd packages/ui  && npm publish --access public    # @motionfoundry/ui
cd ../cli       && npm publish                    # motionfoundry
```

Bump `version` in `packages/ui/package.json`, `packages/cli/package.json`, and `packages/ui/src/index.ts` (`MOTIONFOUNDRY_VERSION`) together, then rebuild before publishing.

---

## 10. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `pnpm: command not found` | Run `corepack enable`, or prefix commands with `npx pnpm@9.12.0` |
| `ERR_PNPM_UNSUPPORTED_ENGINE` / Next.js refuses to start | Upgrade Node to 20.9+ |
| Tests fail with `Cannot find module …/dist/index.mjs` | Run `pnpm build:ui && pnpm build:cli` first |
| `… is out of date (run node scripts/…)` in CI | Run that script locally and commit the regenerated file |
| Port 3000 already in use | `pnpm --filter @motionfoundry/docs exec next dev -p 3001` |
| Stale pages or route type errors after moving files | Delete `apps/docs/.next` and rebuild |
| Vercel: `No Next.js version detected` or missing `routes-manifest.json` | Set the project Root Directory to `apps/docs` (see section 8) |
| Windows: `EPERM` while building | Stop any running `next dev` / `next start` process, then rebuild |
