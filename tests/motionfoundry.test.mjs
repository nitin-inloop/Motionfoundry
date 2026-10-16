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

const GRADIENT_SLUGS = [
  "mesh-gradient",
  "aurora-ribbons",
  "conic-gradient",
  "liquid-gradient",
  "wave-gradient",
  "gradient-orbs",
  "grain-gradient",
  "spotlight-gradient",
];

const TEXT_FX_SLUGS = [
  "split-text",
  "mask-wipe-text",
  "elastic-letters",
  "text-on-path",
  "rolling-text",
  "marker-highlight",
  "scatter-text",
  "cube-flip-words",
];

const SCROLL_SLUGS = [
  "smooth-scroll",
  "parallax-layers",
  "scroll-fill-text",
  "horizontal-scroll",
  "sticky-stack-cards",
  "velocity-marquee",
  "scroll-zoom-reveal",
  "scroll-timeline",
];

const SHADER_V23_SLUGS = ["nebula-gradient", "plasma-gradient", "silk-gradient", "ember-gradient", "eclipse-gradient"];

const SCROLL_V23_SLUGS = [
  "scroll-coverflow",
  "split-screen-scroll",
  "pinned-steps",
  "parallax-columns",
  "scroll-word-swap",
  "scroll-tilt-cards",
  "scroll-path-draw",
  "scroll-focus-list",
  "snap-sections",
  "scroll-color-shift",
];

const UI_SLUGS = [
  "button", "icon-button", "button-group", "copy-button", "toggle-group", "like-button", "split-button",
  "floating-input", "otp-input", "password-input", "tag-input", "number-stepper", "range-slider", "radio-cards",
  "segmented-control", "select", "combobox", "file-dropzone", "star-rating",
  "tabs", "breadcrumb", "pagination", "stepper", "accordion",
  "navigation-menu", "sidebar-nav", "menubar",
  "dialog", "drawer", "bottom-sheet", "popover", "dropdown-menu", "context-menu", "hover-card", "tooltip", "toast", "alert-dialog",
  "avatar-group", "badge", "progress-ring", "stat-card", "data-table", "activity-feed", "bar-chart", "sparkline", "tree-view",
  "contribution-heatmap", "image-compare", "carousel",
];

const UI_V24_SLUGS = ["rotating-icons", "moon-phase-loader", "credit-card", "accordion-cards", "progress-bar", "skeleton-shimmer"];

// Registry order follows packages/ui/src/index.ts export order (grouped by collection).
const COLLECTION_SLUGS = {
  core: CORE_SLUGS,
  "studio-kit": STUDIO_KIT_SLUGS,
  shaders: [...GRADIENT_SLUGS, ...SHADER_V23_SLUGS],
  "text-fx": TEXT_FX_SLUGS,
  scroll: [...SCROLL_SLUGS, ...SCROLL_V23_SLUGS],
  ui: [...UI_SLUGS, ...UI_V24_SLUGS],
};
const LISTED_ORDER = ["scroll", "shaders", "ui"];

const EXPECTED_SLUGS = Object.values(COLLECTION_SLUGS).flat();
const TOTAL = EXPECTED_SLUGS.length;
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

test("1. Registry contains all 142 components across 6 collections and 13 categories", () => {
  assert.equal(TOTAL, 142);
  assert.equal(registry.components.length, TOTAL, `Expected exactly ${TOTAL} components in registry`);
  assert.equal(registry.totalComponents, TOTAL);
  assert.equal(registry.categories.length, 13, "Expected 13 categories");
  const actualSlugs = registry.components.map((c) => c.slug);
  assert.deepEqual([...actualSlugs].sort(), [...EXPECTED_SLUGS].sort(), "Registry component slugs must match the specified components");
  assert.deepEqual(
    Object.fromEntries(registry.collections.map((c) => [c.id, c.count])),
    Object.fromEntries(Object.entries(COLLECTION_SLUGS).map(([id, slugs]) => [id, slugs.length]))
  );
  const listed = registry.collections.filter((c) => c.listed).sort((a, b) => a.order - b.order).map((c) => c.id);
  assert.deepEqual(listed, LISTED_ORDER, "Docs navigation lists Scroll, Shaders, then UI");
  for (const comp of registry.components) {
    const expectedCollection = Object.keys(COLLECTION_SLUGS).find((id) => COLLECTION_SLUGS[id].includes(comp.slug));
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

test("3. Accessibility & Reduced Motion support verified for all 142 components", () => {
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
  assert.equal(compFiles.length, TOTAL);
  assert.equal(styleFiles.length, TOTAL);
  assert.equal(regFiles.length, TOTAL);

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

test("7. All 18 documentation pages exist, including the Studio Kit, Design Systems, and v2.2 guides", () => {
  const docsContentDir = path.join(rootDir, "apps/docs/content/docs");
  const mdxFiles = fs.readdirSync(docsContentDir).filter((f) => f.endsWith(".mdx"));
  assert.equal(mdxFiles.length, 18, "Expected all 18 documentation pages");
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
  assert.match(out, /Verified 142 components/);
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

test("11. v2.2 additions keep complete metadata, rich controls, and no third-party animation engines", () => {
  for (const slug of [...GRADIENT_SLUGS, ...TEXT_FX_SLUGS, ...SCROLL_SLUGS]) {
    const comp = registry.components.find((c) => c.slug === slug);
    assert.ok(comp, `${slug} missing from registry`);
    assert.equal(comp.version, "2.2.0", `${slug} must be versioned 2.2.0`);
    assert.ok(comp.controls.length >= 4, `${slug} must be customizable (>= 4 controls)`);
    const tsx = comp.files[0].content;
    assert.ok(!/from ["'](gsap|lenis|@studio-freight\/lenis|framer-motion)/.test(tsx), `${slug} must be built from scratch`);
    assert.ok(comp.dependencies.every((d) => d === "react" || d === "motion"), `${slug} may only depend on react/motion`);
    if (GRADIENT_SLUGS.includes(slug)) {
      assert.ok(comp.controls.filter((c) => c.type === "color").length >= 2, `${slug} must expose its gradient colors`);
    }
  }
});

test("12. v2.3 additions: dark shaders, more scroll, and 50 UI primitives built from scratch", () => {
  const forbidden = /from ["'](gsap|lenis|@studio-freight\/lenis|framer-motion|@radix-ui\/[^"']+|radix-ui|@headlessui\/react|@floating-ui\/[^"']+|three|lucide-react)["']/;
  for (const slug of [...SHADER_V23_SLUGS, ...SCROLL_V23_SLUGS, ...UI_SLUGS]) {
    const comp = registry.components.find((c) => c.slug === slug);
    assert.ok(comp, `${slug} missing from registry`);
    assert.equal(comp.version, "2.3.0", `${slug} must be versioned 2.3.0`);
    assert.ok(comp.controls.length >= 4, `${slug} must be customizable (>= 4 controls)`);
    assert.ok(comp.dependencies.every((d) => d === "react" || d === "motion"), `${slug} may only depend on react/motion`);
    assert.ok(!forbidden.test(comp.files[0].content), `${slug} must be built from scratch`);
  }
  const uiCategories = new Set(UI_SLUGS.map((slug) => registry.components.find((c) => c.slug === slug).category));
  for (const cat of ["Interactive Buttons and Controls", "Forms and Inputs", "Overlays and Menus", "Navigation", "Data Display"]) {
    assert.ok(uiCategories.has(cat), `UI collection should include ${cat}`);
  }
});

test("13. CLI keeps the renamed 'gradients' collection working as an alias for 'shaders'", () => {
  const res = runCli(["list", "--collection", "gradients"]);
  assert.equal(res.code, 0);
  assert.equal(res.count, COLLECTION_SLUGS.shaders.length);
});

test("14. v2.4 additions: card, loader, and rotating-icon components with full metadata", () => {
  for (const slug of UI_V24_SLUGS) {
    const comp = registry.components.find((c) => c.slug === slug);
    assert.ok(comp, `${slug} missing from registry`);
    assert.equal(comp.version, "2.4.0", `${slug} must be versioned 2.4.0`);
    assert.equal(comp.collection, "ui");
    assert.ok(comp.controls.length >= 4, `${slug} must be customizable`);
    assert.ok(comp.dependencies.every((d) => d === "react" || d === "motion"));
  }
  const landing = fs.readFileSync(path.join(rootDir, "apps/docs/app/page.tsx"), "utf8");
  // The landing restores the original v2.2 hero and showcases the v2.4 cards & loaders.
  assert.ok(!landing.includes("<MeshGradient"), "hero has a plain black background (no shader)");
  assert.ok(!landing.includes("<PlasmaGradient"), "Plasma was removed from the landing");
  assert.ok(!landing.includes("HoldToConfirm"), "HoldToConfirm was removed");
  for (const name of ["<BlurInText", "<EclipseGradient", "<CreditCard", "<AccordionCards", "<ProgressBar", "<MoonPhaseLoader", "<SkeletonShimmer"]) {
    assert.ok(landing.includes(name), `landing should render ${name.slice(1)}`);
  }
  assert.ok(!landing.includes("scroll-color-heading"), "the color-follows-scroll section was removed");
});
