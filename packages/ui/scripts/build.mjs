#!/usr/bin/env node
/**
 * Builds @motionfoundry/ui into dist/:
 * - dist/index.mjs   ESM bundle of every component (react, react-dom and motion stay external)
 * - dist/index.cjs   CommonJS bundle
 * - dist/styles.css  All component CSS Modules, compiled with collision-free scoped class names
 * - dist/index.d.ts  Type entry point re-exporting declarations emitted to dist/types/
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, "..");
const distDir = path.join(pkgRoot, "dist");
const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, "package.json"), "utf8"));
const require = createRequire(import.meta.url);

fs.rmSync(distDir, { recursive: true, force: true });

const shared = {
  entryPoints: { index: path.join(pkgRoot, "src/index.ts") },
  bundle: true,
  outdir: distDir,
  target: "es2020",
  jsx: "automatic",
  external: ["react", "react-dom", "react/jsx-runtime", "motion", "motion/react"],
  loader: { ".module.css": "local-css" },
  // Every component is interactive, so the bundle is a client module for React Server Components.
  banner: { js: '"use client";' },
  logLevel: "warning",
  logOverride: { "unsupported-directive": "silent" },
};

await build({ ...shared, format: "esm", outExtension: { ".js": ".mjs" } });
await build({ ...shared, format: "cjs", outExtension: { ".js": ".cjs" } });

// Both builds emit the same stylesheet; publish it once under the documented name.
fs.renameSync(path.join(distDir, "index.css"), path.join(distDir, "styles.css"));

execFileSync(
  process.execPath,
  [require.resolve("typescript/bin/tsc"), "-p", path.join(pkgRoot, "tsconfig.json"), "--emitDeclarationOnly", "--outDir", path.join(distDir, "types")],
  { stdio: "inherit" }
);
fs.writeFileSync(path.join(distDir, "index.d.ts"), 'export * from "./types/index";\n', "utf8");

const componentCount = (fs.readFileSync(path.join(pkgRoot, "src/index.ts"), "utf8").match(/from "\.\/components\//g) ?? []).length;
console.log(`[@motionfoundry/ui] Built v${pkg.version}: ${componentCount} components -> dist/index.mjs, dist/index.cjs, dist/index.d.ts, dist/styles.css`);
