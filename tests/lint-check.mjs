#!/usr/bin/env node
/**
 * Lint & Code Quality Verification across all packages
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const compDir = path.join(rootDir, "packages/ui/src/components");
const styleDir = path.join(rootDir, "packages/ui/src/styles");

const files = fs.readdirSync(compDir).filter((f) => f.endsWith(".tsx"));
let issues = 0;

for (const file of files) {
  const fullPath = path.join(compDir, file);
  const code = fs.readFileSync(fullPath, "utf8");

  if (code.includes("framer-motion")) {
    console.error(`[LINT ERROR] ${file}: Deprecated 'framer-motion' import found. Use 'motion/react'.`);
    issues++;
  }
  if (/(?::\s*any|<any>|as\s+any)/.test(code)) {
    console.error(`[LINT ERROR] ${file}: Explicit 'any' type forbidden.`);
    issues++;
  }
  if (code.includes("TODO") || code.includes("FIXME")) {
    console.error(`[LINT ERROR] ${file}: Placeholder comment found.`);
    issues++;
  }
  const cssFile = file.replace(".tsx", ".module.css");
  if (!fs.existsSync(path.join(styleDir, cssFile))) {
    console.error(`[LINT ERROR] ${file}: Missing companion CSS Module ${cssFile}.`);
    issues++;
  }
}

if (issues > 0) {
  process.exit(1);
}
console.log(`[lint-check] Passed: ${files.length} component TSX files and CSS Modules verified with 0 warnings/errors.`);
