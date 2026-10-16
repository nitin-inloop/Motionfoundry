import { BRAND_CONFIG } from "./brand";
import type { PropValue, RegistryComponent } from "./registry";

export const COMPONENT_TOC = [
  { id: "preview", title: "Preview", depth: 2 as const },
  { id: "installation", title: "Installation", depth: 2 as const },
  { id: "usage", title: "Usage", depth: 2 as const },
  { id: "props", title: "Props", depth: 2 as const },
  { id: "accessibility", title: "Accessibility", depth: 2 as const },
  { id: "source", title: "Source", depth: 2 as const },
];

function formatProp(name: string, value: PropValue): string {
  if (typeof value === "string") return value.includes('"') ? `${name}={${JSON.stringify(value)}}` : `${name}="${value}"`;
  if (typeof value === "boolean") return value ? name : `${name}={false}`;
  return `${name}={${JSON.stringify(value)}}`;
}

/** JSX usage snippet containing only the props that differ from the defaults. */
export function buildUsage(component: RegistryComponent, props: Record<string, PropValue>, defaults: Record<string, PropValue>): string {
  const attrs = Object.entries(props)
    .filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(defaults[key]))
    .map(([key, value]) => formatProp(key, value));
  const tag =
    attrs.length === 0
      ? `<${component.name} />`
      : attrs.join(" ").length < 56
        ? `<${component.name} ${attrs.join(" ")} />`
        : `<${component.name}\n${attrs.map((a) => `      ${a}`).join("\n")}\n    />`;
  return [`import { ${component.name} } from "${BRAND_CONFIG.packageScope}";`, "", "export function Example() {", "  return (", `    ${tag}`, "  );", "}"].join("\n");
}

/** Markdown version of a component page, used by "Copy Page". */
export function buildComponentMarkdown(component: RegistryComponent): string {
  const rows = component.propsApi.map((p) => `| \`${p.name}\` | \`${p.type.replace(/\|/g, "\\|")}\` | \`${p.default}\` | ${p.description} |`).join("\n");
  return [
    `# ${component.name}`,
    "",
    component.description,
    "",
    "## Installation",
    "",
    "```bash",
    `npx ${BRAND_CONFIG.cliName} add ${component.slug}`,
    "```",
    "",
    "## Usage",
    "",
    "```tsx",
    buildUsage(component, component.defaultProps, component.defaultProps),
    "```",
    "",
    "## Props",
    "",
    "| Prop | Type | Default | Description |",
    "| --- | --- | --- | --- |",
    rows,
    "",
    "## Accessibility",
    "",
    component.a11yNotes,
    "",
  ].join("\n");
}
