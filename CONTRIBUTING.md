# Contributing to MotionFoundry

Thank you for contributing to MotionFoundry! Our monorepo is structured so you can add or improve an animated component without modifying unrelated platform code.

## Adding a New Component

1. **Create the Component Source**: Add `packages/ui/src/components/<slug>.tsx` using TypeScript, `"use client"` (if interactive), and `motion/react` (only when spring physics or layout animations are needed).
2. **Create the Scoped Stylesheet**: Add `packages/ui/src/styles/<slug>.module.css` with `@media (prefers-reduced-motion: reduce)` fallbacks.
3. **Export from `@motionfoundry/ui`**: Re-export the component and its `<Name>Props` interface in `packages/ui/src/index.ts`.
4. **Sync the Registry**: Run the registry generator so `registry/registry.json` and `registry/components/<slug>.json` embed the exact `.tsx` and `.module.css` source files.
5. **Run Checks**:
   - `node packages/ui/scripts/build.mjs`
   - `node tests/lint-check.mjs`
   - `node tests/typecheck.mjs`
   - `node --test tests/motionfoundry.test.mjs`
