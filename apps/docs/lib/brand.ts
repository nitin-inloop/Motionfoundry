export const BRAND_CONFIG = {
  name: "MotionFoundry",
  tagline: "48 Precision Animated UI Primitives for React & Next.js",
  packageScope: "@motionfoundry/ui",
  cliName: "motionfoundry",
  version: "2.1.0",
  license: "MIT",
  repoUrl: "https://github.com/nitin-inloop/Motionfoundry",
  packageStatus: "Local Workspace Package (pnpm workspace — ready for npm publish)",
} as const;

/** Links to a file in the GitHub repository (main branch). */
export function repoFileUrl(filePath: string): string {
  return `${BRAND_CONFIG.repoUrl}/blob/main/${filePath}`;
}
