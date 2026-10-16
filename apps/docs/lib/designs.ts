import designsJson from "../../../registry/designs.json";

export interface DesignTheme {
  bg: string;
  surface: string;
  surfaceRaised: string;
  fg: string;
  muted: string;
  subtle: string;
  border: string;
  borderStrong: string;
  accent: string;
  onAccent: string;
  secondary: string;
  radius: string;
  fontDisplay: string;
  fontBody: string;
  displayWeight: number;
  displayTracking: string;
}

export interface DesignSystem {
  id: string;
  brand: string;
  category: string;
  mode: "light" | "dark";
  tagline: string;
  description: string;
  theme: DesignTheme;
  colors: { name: string; value: string; role: string }[];
  typography: { role: string; fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string; letterSpacing: string }[];
  rounded: { name: string; value: string }[];
  headings: string[];
  path: string;
  body: string;
  raw: string;
}

/** Just enough of a design system to theme a preview — safe to pass to client components. */
export type DesignPreset = Pick<DesignSystem, "id" | "brand" | "mode" | "theme">;

// registry/designs.json is generated and validated by scripts/build-designs.mjs.
const data = designsJson as unknown as { source: { repo: string; commit: string; license: string }; designs: DesignSystem[] };

export const DESIGN_SOURCE = data.source;

export function getDesigns(): DesignSystem[] {
  return data.designs;
}

export function getDesign(id: string): DesignSystem | undefined {
  return data.designs.find((d) => d.id === id);
}

export function getDesignPresets(): DesignPreset[] {
  return data.designs.map(({ id, brand, mode, theme }) => ({ id, brand, mode, theme }));
}
