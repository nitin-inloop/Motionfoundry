import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import * as UI from "../packages/ui/dist/index.mjs";
import { runCli } from "../packages/cli/dist/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const registry = JSON.parse(fs.readFileSync(path.join(rootDir, "registry/registry.json"), "utf8"));

const CORE_SLUGS = [
  "kinetic-type",
  "glyph-cascade",
  "text-morph",
  "orbiting-words",
  "aurora-headline",
  "magnetic-button",
  "velocity-button",
  "elastic-press-button",
  "constellation-card",
  "liquid-glass-card",
  "holo-tilt-card",
  "morphing-border",
  "portal-reveal-panel",
  "infinite-marquee",
  "scroll-narrative",
  "parallax-depth-scene",
  "fluid-mesh-background",
  "noise-aurora",
  "orbiting-particles",
  "liquid-blob",
  "magnetic-dock",
  "scroll-velocity-progress",
  "morphing-command-palette",
  "staggered-grid-reveal",
];

const STUDIO_KIT_SLUGS = [
  "blur-in-text",
  "typewriter",
  "number-ticker",
  "split-reveal",
  "rotating-words",
  "shimmer-text",
  "shiny-border-button",
  "confetti-button",
  "loading-button",
  "slide-fill-button",
  "toggle-switch",
  "animated-checkbox",
  "flip-card",
  "swipe-cards",
  "reveal-card",
  "draw-border-card",
  "meteors",
  "beam-lines",
  "grid-pulse",
  "orbit-loader",
  "pulse-loader",
  "notification-stack",
  "reorder-list",
  "expandable-search",
];

const EXPECTED_SLUGS = [...CORE_SLUGS, ...STUDIO_KIT_SLUGS];
const CONTROL_TYPES = new Set(["text", "range", "select", "boolean", "color", "list"]);

const RETIRED_SLUGS = [
  "text-reveal",
  "blur-text",
  "typewriter-text",
  "gradient-text",
  "ripple-button",
  "shimmer-button",
  "spotlight-card",
  "animated-border-card",
  "hover-tilt-card",
  "aurora-background",
  "particle-background",
  "scroll-reveal",
  "staggered-list",
  "animated-counter",
  "skeleton-loader",
  "animated-tooltip",
  "expandable-panel",
  "floating-dock",
  "cursor-glow",
  "page-transition",
  "animated-tabs",
  "perspective-grid",
  "bento-grid-card",
];

test("1. Registry contains 24 Core + 24 Studio Kit components across 7 categories", () => {
  assert.equal(registry.components.length, 48, "Expected exactly 48 components in registry");
  assert.equal(registry.totalComponents, 48);
  assert.equal(registry.categories.length, 7, "Expected 7 architectural categories");
  const actualSlugs = registry.components.map((c) => c.slug);
  assert.deepEqual(actualSlugs, EXPECTED_SLUGS, "Registry component slugs must match the 48 specified components");
  assert.deepEqual(
    registry.collections.map((c) => [c.id, c.count]),
    [["core", 24], ["studio-kit", 24]]
  );
  for (const comp of registry.components) {
    const expectedCollection = STUDIO_KIT_SLUGS.includes(comp.slug) ? "studio-kit" : "core";
    assert.equal(comp.collection, expectedCollection, `${comp.slug} must belong to ${expectedCollection}`);
    assert.ok(registry.categories.includes(comp.category), `${comp.slug} has unknown category ${comp.category}`);
    assert.ok(comp.files.length === 2, `${comp.slug} must include both .tsx and .module.css files`);
    assert.ok(comp.controls.length >= 3, `${comp.slug} must expose interactive controls`);
    assert.ok(comp.propsApi.length >= 3, `${comp.slug} must document props API`);
    for (const control of comp.controls) {
      assert.ok(CONTROL_TYPES.has(control.type), `${comp.slug}.${control.prop} uses unknown control type ${control.type}`);
      assert.ok(control.prop in comp.defaultProps, `${comp.slug}.${control.prop} needs a defaultProps value`);
    }
  }
});

test("2. Registry source code matches actual packages/ui/src implementation files byte-for-byte", () => {
  for (const comp of registry.components) {
    const diskTsx = fs
      .readFileSync(path.join(rootDir, "packages/ui/src/components", `${comp.slug}.tsx`), "utf8")
      .replace(/\r\n/g, "\n");
    const diskCss = fs
      .readFileSync(path.join(rootDir, "packages/ui/src/styles", `${comp.slug}.module.css`), "utf8")
      .replace(/\r\n/g, "\n");
    const regTsx = comp.files.find((f) => f.path.endsWith(".tsx")).content;
    const regCss = comp.files.find((f) => f.path.endsWith(".css")).content;

    assert.equal(regTsx, diskTsx, `Registry TSX mismatch for ${comp.slug}`);
    assert.equal(regCss, diskCss, `Registry CSS mismatch for ${comp.slug}`);
    assert.ok(!diskTsx.includes("framer-motion"), `${comp.slug} must not use deprecated framer-motion`);
  }
});

test("3. Accessibility & Reduced Motion support verified for all 48 components", () => {
  for (const comp of registry.components) {
    const tsx = comp.files[0].content;
    const css = comp.files[1].content;
    const hasReducedMotion =
      tsx.includes("useReducedMotion") ||
      tsx.includes("prefers-reduced-motion") ||
      css.includes("prefers-reduced-motion");
    assert.ok(hasReducedMotion, `${comp.name} must support prefers-reduced-motion`);
  }
});

test("4. @motionfoundry/ui package build exports real React components, types, and scoped styles.css", () => {
  assert.equal(UI.MOTIONFOUNDRY_BRAND, "MotionFoundry");
  assert.equal(UI.MOTIONFOUNDRY_VERSION, registry.version);
  const styles = fs.readFileSync(path.join(rootDir, "packages/ui/dist/styles.css"), "utf8");
  for (const comp of registry.components) {
    assert.equal(typeof UI[comp.name], "function", `@motionfoundry/ui must export ${comp.name}`);
    assert.ok(
      fs.existsSync(path.join(rootDir, "packages/ui/dist/types/components", `${comp.slug}.d.ts`)),
      `Missing type declarations for ${comp.slug}`
    );
  }
  // CSS Modules are compiled to file-scoped class names, so components never collide globally.
  assert.ok(!/^\.root\s*\{/m.test(styles), "dist/styles.css must not contain unscoped .root selectors");
  assert.ok(styles.includes(".confetti_button_root"), "dist/styles.css must include Studio Kit component styles");
  const esm = fs.readFileSync(path.join(rootDir, "packages/ui/dist/index.mjs"), "utf8");
  assert.ok(esm.startsWith('"use client";'), "Bundle must be a React client module");
  assert.ok(fs.existsSync(path.join(rootDir, "packages/ui/dist/index.d.ts")));
  assert.ok(fs.existsSync(path.join(rootDir, "packages/ui/dist/index.cjs")));
});

test("5. motionfoundry CLI installs new components, rejects retired slugs, and preserves files on conflict", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mf-cli-v2-test-"));
  try {
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ name: "consumer-app", dependencies: { next: "16.4.1", react: "19.0.0" } }),
      "utf8"
    );
    fs.mkdirSync(path.join(tmpDir, "src/app"), { recursive: true });

    const initRes = runCli(["init", "--dir", tmpDir]);
    assert.equal(initRes.code, 0);

    // Reject retired component slug
    const retiredRes = runCli(["add", "spotlight-card", "--dir", tmpDir]);
    assert.equal(retiredRes.code, 1, "CLI must reject retired component slugs");

    // Add Core and Studio Kit components together
    const addRes = runCli(["add", "kinetic-type", "liquid-glass-card", "magnetic-dock", "confetti-button", "--dir", tmpDir]);
    assert.equal(addRes.code, 0);
    assert.equal(addRes.addedFiles.length, 8);
    assert.deepEqual(addRes.requiredDeps, ["motion"]);

    const installedPath = path.join(tmpDir, "src/components/ui/kinetic-type.tsx");
    assert.ok(fs.existsSync(installedPath));

    // The installed component's relative CSS Module import must resolve to the installed stylesheet.
    for (const slug of ["kinetic-type", "confetti-button"]) {
      const tsxPath = path.join(tmpDir, "src/components/ui", `${slug}.tsx`);
      const cssImport = fs.readFileSync(tsxPath, "utf8").match(/from "(\.\.\/styles\/[^"]+)"/)[1];
      assert.ok(fs.existsSync(path.resolve(path.dirname(tsxPath), cssImport)), `${slug} CSS import ${cssImport} must resolve`);
    }

    // Conflict protection
    const customCode = "// User customized\n" + fs.readFileSync(installedPath, "utf8");
    fs.writeFileSync(installedPath, customCode, "utf8");

    const conflictRes = runCli(["add", "kinetic-type", "--dir", tmpDir]);
    assert.equal(conflictRes.code, 0);
    assert.equal(conflictRes.skippedFiles.length, 2);
    assert.equal(fs.readFileSync(installedPath, "utf8"), customCode);

    // Overwrite flag
    const overwriteRes = runCli(["add", "kinetic-type", "--dir", tmpDir, "--overwrite"]);
    assert.equal(overwriteRes.code, 0);
    assert.equal(overwriteRes.addedFiles.length, 2);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("5b. motionfoundry CLI lists collections and ships its own registry copy", () => {
  const listRes = runCli(["list", "--collection", "studio-kit"]);
  assert.equal(listRes.code, 0);
  assert.equal(listRes.count, 24);
  assert.equal(runCli(["list", "--collection", "does-not-exist"]).code, 1);
  const bundled = JSON.parse(fs.readFileSync(path.join(rootDir, "packages/cli/dist/registry.json"), "utf8"));
  assert.equal(bundled.components.length, registry.components.length, "packages/cli/dist/registry.json must be rebuilt with the registry");
});

test("6. Zero stale component files or retired slugs remain in packages/ui, registry, apps/docs, or examples", () => {
  const compFiles = fs.readdirSync(path.join(rootDir, "packages/ui/src/components"));
  const styleFiles = fs.readdirSync(path.join(rootDir, "packages/ui/src/styles"));
  const regFiles = fs.readdirSync(path.join(rootDir, "registry/components"));
  assert.equal(compFiles.length, 48);
  assert.equal(styleFiles.length, 48);
  assert.equal(regFiles.length, 48);

  const indexTs = fs.readFileSync(path.join(rootDir, "packages/ui/src/index.ts"), "utf8");
  const regJson = fs.readFileSync(path.join(rootDir, "registry/registry.json"), "utf8");
  const docsHome = fs.readFileSync(path.join(rootDir, "apps/docs/app/page.tsx"), "utf8");
  const examplePage = fs.readFileSync(path.join(rootDir, "examples/nextjs-app/app/page.tsx"), "utf8");

  for (const retired of RETIRED_SLUGS) {
    assert.ok(!indexTs.includes(retired), `Stale slug ${retired} found in packages/ui/src/index.ts`);
    assert.ok(!regJson.includes(`"${retired}"`), `Stale slug ${retired} found in registry/registry.json`);
    assert.ok(!docsHome.includes(retired), `Stale slug ${retired} found in apps/docs/app/page.tsx`);
    assert.ok(!examplePage.includes(retired), `Stale slug ${retired} found in examples/nextjs-app/app/page.tsx`);
  }
});

test("7. All 17 documentation pages exist, including the Studio Kit and Design Systems guides", () => {
  const docsContentDir = path.join(rootDir, "apps/docs/content/docs");
  const mdxFiles = fs.readdirSync(docsContentDir).filter((f) => f.endsWith(".mdx"));
  assert.equal(mdxFiles.length, 17, "Expected all 17 documentation pages");
  const docsTs = fs.readFileSync(path.join(rootDir, "apps/docs/lib/docs.ts"), "utf8");
  for (const file of mdxFiles) {
    assert.ok(docsTs.includes(`"slug": "${file.replace(".mdx", "")}"`), `${file} must be registered in apps/docs/lib/docs.ts`);
  }
  const guide = fs.readFileSync(path.join(docsContentDir, "studio-kit.mdx"), "utf8");
  for (const slug of STUDIO_KIT_SLUGS) {
    assert.ok(guide.includes(slug), `Studio Kit guide must document ${slug}`);
  }
});

test("8. Registry JSON is in sync with packages/ui source (scripts/build-registry.mjs --check)", () => {
  const out = execFileSync(process.execPath, [path.join(rootDir, "scripts/build-registry.mjs"), "--check"], { encoding: "utf8" });
  assert.match(out, /Verified 48 components/);
});

const EXPECTED_DESIGNS = ["vercel", "cursor", "claude", "framer", "apple", "airbnb", "expo", "elevenlabs", "runwayml", "resend", "spotify"];

test("9. Design systems are vendored, parsed, and in sync (scripts/build-designs.mjs --check)", () => {
  const out = execFileSync(process.execPath, [path.join(rootDir, "scripts/build-designs.mjs"), "--check"], { encoding: "utf8" });
  assert.match(out, /Verified 11 design systems/);
  const designs = JSON.parse(fs.readFileSync(path.join(rootDir, "registry/designs.json"), "utf8")).designs;
  assert.deepEqual(designs.map((d) => d.id), EXPECTED_DESIGNS);
  assert.ok(fs.existsSync(path.join(rootDir, "design-md/LICENSE")), "Upstream MIT license must ship with the vendored files");
  for (const d of designs) {
    assert.ok(d.colors.length >= 10, `${d.id} should expose its color tokens`);
    assert.ok(d.typography.length >= 5, `${d.id} should expose its type ramp`);
    assert.match(d.theme.accent, /^#[0-9a-f]{6}$/i);
    assert.equal(d.raw, fs.readFileSync(path.join(rootDir, d.path), "utf8").replace(/\r\n/g, "\n"));
  }
});

test("10. Component CSS Modules read theme variables with their original values as fallbacks", () => {
  const stylesDir = path.join(rootDir, "packages/ui/src/styles");
  let themed = 0;
  for (const file of fs.readdirSync(stylesDir)) {
    const css = fs.readFileSync(path.join(stylesDir, file), "utf8");
    for (const m of css.matchAll(/var\(--mf-(surface-raised|border-strong|bg|fg|surface|muted|subtle|border|accent)([,)][^)]*)/g)) {
      assert.match(m[2], /^, (#[0-9a-f]{6}|var\()/i, `${file}: --mf-${m[1]} must keep a fallback value`);
      themed++;
    }
  }
  assert.ok(themed > 250, "Expected component palettes to be themeable");
});
