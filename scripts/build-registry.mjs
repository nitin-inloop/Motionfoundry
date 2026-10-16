#!/usr/bin/env node
/**
 * Registry builder — keeps registry/ in sync with packages/ui/src.
 *
 * - Component order comes from the export order in packages/ui/src/index.ts.
 * - Metadata (description, controls, propsApi, ...) lives in registry/components/<slug>.json.
 * - File contents are always refreshed from packages/ui/src/components/<slug>.tsx and
 *   packages/ui/src/styles/<slug>.module.css, so registry source never drifts from the package.
 * - Writes registry/components/<slug>.json and the aggregated registry/registry.json.
 *
 * Usage: node scripts/build-registry.mjs [--check]
 *   --check  Exit 1 if any registry file is out of date instead of writing.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uiDir = path.join(rootDir, "packages/ui");
const registryDir = path.join(rootDir, "registry");
const checkOnly = process.argv.includes("--check");

const CATEGORIES = [
  "Advanced Text Animations",
  "Interactive Buttons and Controls",
  "High-End Animated Cards",
  "Reveals and Continuous Motion",
  "Animated Backgrounds and Visual Effects",
  "Developer-Interface Animations",
  "Loaders and Feedback",
];

const COLLECTIONS = [
  {
    id: "core",
    name: "Core",
    description: "The original 24 precision primitives: kinetic type, spatial cards, canvas networks, and developer-interface choreography.",
  },
  {
    id: "studio-kit",
    name: "Studio Kit",
    description: "24 hand-picked everyday motion patterns ported from Swirl Studio Kit: text reveals, feedback buttons, interactive cards, ambient backgrounds, loaders, and list interactions.",
  },
];

const pkg = JSON.parse(fs.readFileSync(path.join(uiDir, "package.json"), "utf8"));
const indexTs = fs.readFileSync(path.join(uiDir, "src/index.ts"), "utf8");
const slugs = [...indexTs.matchAll(/from "\.\/components\/([a-z0-9-]+)"/g)].map((m) => m[1]);

const errors = [];
const stale = [];
const components = [];

function writeIfChanged(filePath, content) {
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
  if (current === content) return;
  if (checkOnly) {
    stale.push(path.relative(rootDir, filePath));
    return;
  }
  fs.writeFileSync(filePath, content, "utf8");
}

for (const slug of slugs) {
  const metaPath = path.join(registryDir, "components", `${slug}.json`);
  const tsxPath = path.join(uiDir, "src/components", `${slug}.tsx`);
  const cssPath = path.join(uiDir, "src/styles", `${slug}.module.css`);

  for (const required of [metaPath, tsxPath, cssPath]) {
    if (!fs.existsSync(required)) errors.push(`${slug}: missing ${path.relative(rootDir, required)}`);
  }
  if (!fs.existsSync(metaPath) || !fs.existsSync(tsxPath) || !fs.existsSync(cssPath)) continue;

  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  const tsx = fs.readFileSync(tsxPath, "utf8");

  if (meta.slug !== slug) errors.push(`${slug}: metadata slug is "${meta.slug}"`);
  if (!CATEGORIES.includes(meta.category)) errors.push(`${slug}: unknown category "${meta.category}"`);
  if (!tsx.includes(`export function ${meta.name}(`)) errors.push(`${slug}: ${meta.name} is not exported from ${slug}.tsx`);
  for (const control of meta.controls ?? []) {
    if (!(control.prop in (meta.defaultProps ?? {}))) errors.push(`${slug}: control "${control.prop}" has no defaultProps value`);
  }

  const entry = {
    ...meta,
    collection: meta.collection ?? "core",
    files: [
      { path: `components/ui/${slug}.tsx`, type: "registry:component", content: tsx },
      // Installed next to components/ui/ so the component's "../styles/<slug>.module.css" import resolves.
      { path: `components/styles/${slug}.module.css`, type: "registry:style", content: fs.readFileSync(cssPath, "utf8") },
    ],
  };

  writeIfChanged(metaPath, JSON.stringify(entry, null, 2) + "\n");
  components.push(entry);
}

if (errors.length > 0) {
  for (const err of errors) console.error(`[build-registry] ${err}`);
  process.exit(1);
}

const registry = {
  $schema: "https://motionfoundry.dev/schema/registry.json",
  name: "motionfoundry",
  brandName: "MotionFoundry",
  packageName: pkg.name,
  version: pkg.version,
  license: pkg.license,
  totalComponents: components.length,
  categories: CATEGORIES.filter((c) => components.some((comp) => comp.category === c)),
  collections: COLLECTIONS.map((c) => ({ ...c, count: components.filter((comp) => comp.collection === c.id).length })),
  components,
};

writeIfChanged(path.join(registryDir, "registry.json"), JSON.stringify(registry, null, 2) + "\n");

if (checkOnly && stale.length > 0) {
  console.error(`[build-registry] Out of date (run node scripts/build-registry.mjs):\n  ${stale.join("\n  ")}`);
  process.exit(1);
}

console.log(`[build-registry] ${checkOnly ? "Verified" : "Wrote"} ${components.length} components across ${registry.categories.length} categories (v${pkg.version}).`);
