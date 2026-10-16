import type { TocItem } from "../components/on-this-page";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Strips inline Markdown so a heading reads as plain text in the table of contents. */
export function plainHeading(text: string): string {
  return text.replace(/\*\*|__|`/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").trim();
}

/** Builds TOC entries from "## " / "### " headings, skipping fenced code blocks. */
export function tocFromMarkdown(markdown: string, maxDepth: 2 | 3 = 3): TocItem[] {
  const items: TocItem[] = [];
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (line.trimStart().startsWith("```")) inFence = !inFence;
    if (inFence) continue;
    const m = line.match(/^(#{2,3})\s+(.+?)\s*#*$/);
    if (!m) continue;
    const depth = m[1].length as 2 | 3;
    if (depth > maxDepth) continue;
    const title = plainHeading(m[2]);
    items.push({ id: slugify(title), title, depth });
  }
  return items;
}
