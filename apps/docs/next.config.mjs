import path from "node:path";
import { fileURLToPath } from "node:url";

const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The docs import @motionfoundry/ui from source (see the tsconfig "paths" alias) so every
  // preview runs exactly the code that ships in the package and the CLI registry.
  transpilePackages: ["@motionfoundry/ui"],
  outputFileTracingRoot: monorepoRoot,
  turbopack: { root: monorepoRoot },
};

export default nextConfig;
