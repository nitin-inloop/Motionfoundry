#!/usr/bin/env node
/**
 * TypeScript Contract & Export Verification
 * - Every registry component is exported (with its Props type) from packages/ui/src/index.ts.
 * - The compiler accepts the whole package (tsc --noEmit).
 * - dist/types contains a declaration for every component.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const uiDir = path.join(rootDir, "packages/ui");
const registry = JSON.parse(fs.readFileSync(path.join(rootDir, "registry/registry.json"), "utf8"));
const indexTs = fs.readFileSync(path.join(uiDir, "src/index.ts"), "utf8");

for (const comp of registry.components) {
  if (!indexTs.includes(`export { ${comp.name}, type ${comp.name}Props }`)) {
    throw new Error(`Missing typed export for ${comp.name} in packages/ui/src/index.ts`);
  }
  const dts = path.join(uiDir, "dist/types/components", `${comp.slug}.d.ts`);
  if (!fs.existsSync(dts)) {
    throw new Error(`Missing ${path.relative(rootDir, dts)} — run node packages/ui/scripts/build.mjs`);
  }
  const declarations = fs.readFileSync(dts, "utf8");
  if (!declarations.includes(`export interface ${comp.name}Props`) || !declarations.includes(`export declare function ${comp.name}(`)) {
    throw new Error(`Incomplete declarations for ${comp.name} in ${path.relative(rootDir, dts)}`);
  }
}

const tsc = createRequire(path.join(uiDir, "package.json")).resolve("typescript/bin/tsc");
execFileSync(process.execPath, [tsc, "--noEmit", "-p", path.join(uiDir, "tsconfig.json")], { stdio: "inherit" });

console.log(`[typecheck] Passed: tsc --noEmit clean; all ${registry.components.length} component exports and declarations verified.`);
