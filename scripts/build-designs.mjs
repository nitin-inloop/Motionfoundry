#!/usr/bin/env node
/**
 * Design-system builder — turns design-md/<id>/DESIGN.md + design-md/themes.json into
 * registry/designs.json for the docs site.
 *
 * DESIGN.md files come in two formats (both from VoltAgent/awesome-design-md):
 * - YAML frontmatter with colors / typography / rounded tokens, followed by prose.
 * - Prose only, with "- **Name** (`#hex`): role" color bullets and a "### Hierarchy" type table.
 *
 * Usage: node scripts/build-designs.mjs [--check]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const designDir = path.join(rootDir, "design-md");
const outFile = path.join(rootDir, "registry/designs.json");
const checkOnly = process.argv.includes("--check");

const THEME_KEYS = ["bg", "surface", "surfaceRaised", "fg", "muted", "subtle", "border", "borderStrong", "accent", "onAccent", "secondary", "radius", "fontDisplay", "fontBody", "displayWeight", "displayTracking"];
const HEX = /^#[0-9a-f]{6}$/i;

const config = JSON.parse(fs.readFileSync(path.join(designDir, "themes.json"), "utf8"));
const errors = [];

function splitFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { tokens: {}, body: raw };
  let tokens;
  try {
    tokens = parseYaml(match[1]);
  } catch {
    // Some upstream files leave ": " unquoted inside top-level prose values (invalid YAML).
    // Quote those scalars instead of editing the vendored file.
    const repaired = match[1].replace(/^(name|description): (?!["'|>])(.*)$/gm, (_, key, value) => `${key}: ${JSON.stringify(value)}`);
    tokens = parseYaml(repaired);
  }
  return { tokens: tokens ?? {}, body: match[2] };
}

/** "- **Spotify Green** (`#1ed760`): Primary brand accent" → { name, value, role } */
function parseProseColors(body) {
  const colors = [];
  for (const m of body.matchAll(/^- \*\*([^*]+)\*\* \(`(#[0-9a-fA-F]{3,8})`\):?\s*(.*)$/gm)) {
    colors.push({ name: m[1].trim(), value: m[2].toLowerCase(), role: m[3].trim() });
  }
  return colors;
}

/** Parses the first markdown table under "### Hierarchy" into typography roles. */
function parseProseTypography(body) {
  const section = body.split(/^### Hierarchy\s*$/m)[1];
  if (!section) return [];
  const rows = section.split("\n").filter((l) => l.startsWith("|")).slice(2);
  const roles = [];
  for (const row of rows) {
    const cells = row.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 6) break;
    const [role, font, size, weight, lineHeight, letterSpacing] = cells;
    roles.push({ role, fontFamily: font, fontSize: size.replace(/\s*\(.*\)/, ""), fontWeight: weight, lineHeight, letterSpacing });
  }
  return roles;
}

function firstParagraphAfter(body, headingPattern) {
  const parts = body.split(headingPattern);
  if (parts.length < 2) return "";
  return parts[1].trim().split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim();
}

const designs = [];
for (const entry of config.designs) {
  const file = path.join(designDir, entry.id, "DESIGN.md");
  if (!fs.existsSync(file)) {
    errors.push(`${entry.id}: missing design-md/${entry.id}/DESIGN.md`);
    continue;
  }
  for (const key of THEME_KEYS) {
    if (entry.theme?.[key] === undefined) errors.push(`${entry.id}: theme.${key} is required`);
  }
  for (const key of ["accent", "secondary"]) {
    if (!HEX.test(entry.theme?.[key] ?? "")) errors.push(`${entry.id}: theme.${key} must be a #rrggbb hex (it feeds color pickers)`);
  }

  const raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const { tokens, body: rawBody } = splitFrontmatter(raw);
  // Prose-format files open with their own "# Design System Inspired by X" title; the page renders its own.
  const body = rawBody.replace(/^\s*# [^\n]+\n+/, "").trim();

  const colors = tokens.colors
    ? Object.entries(tokens.colors).map(([name, value]) => ({ name, value: String(value), role: "" }))
    : parseProseColors(body);
  const typography = tokens.typography
    ? Object.entries(tokens.typography).map(([role, t]) => ({
        role,
        fontFamily: String(t.fontFamily ?? ""),
        fontSize: String(t.fontSize ?? ""),
        fontWeight: String(t.fontWeight ?? ""),
        lineHeight: String(t.lineHeight ?? ""),
        letterSpacing: String(t.letterSpacing ?? ""),
      }))
    : parseProseTypography(body);
  const rounded = tokens.rounded ? Object.entries(tokens.rounded).map(([name, value]) => ({ name, value: String(value) })) : [];
  const description =
    (typeof tokens.description === "string" && tokens.description.trim()) ||
    firstParagraphAfter(body, /^## (?:1\. )?(?:Visual Theme[^\n]*|Overview)\s*$/m) ||
    entry.tagline;
  const headings = [...body.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());

  if (colors.length === 0) errors.push(`${entry.id}: no colors could be parsed`);
  if (typography.length === 0) errors.push(`${entry.id}: no typography roles could be parsed`);

  designs.push({
    id: entry.id,
    brand: entry.brand,
    category: entry.category,
    mode: entry.mode,
    tagline: entry.tagline,
    description: description.replace(/\s+/g, " ").trim(),
    theme: entry.theme,
    colors,
    typography,
    rounded,
    headings,
    path: `design-md/${entry.id}/DESIGN.md`,
    body,
    raw,
  });
}

if (errors.length > 0) {
  for (const err of errors) console.error(`[build-designs] ${err}`);
  process.exit(1);
}

const output = JSON.stringify({ source: config.source, count: designs.length, designs }, null, 2) + "\n";
const current = fs.existsSync(outFile) ? fs.readFileSync(outFile, "utf8") : "";
if (checkOnly && current !== output) {
  console.error("[build-designs] registry/designs.json is out of date (run node scripts/build-designs.mjs)");
  process.exit(1);
}
if (!checkOnly && current !== output) fs.writeFileSync(outFile, output, "utf8");
console.log(`[build-designs] ${checkOnly ? "Verified" : "Wrote"} ${designs.length} design systems: ${designs.map((d) => d.id).join(", ")}`);
