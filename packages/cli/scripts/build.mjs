import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
fs.mkdirSync(new URL("../dist", import.meta.url), { recursive: true });
fs.copyFileSync(new URL("../src/index.ts", import.meta.url), new URL("../dist/index.mjs", import.meta.url));
// Ship the registry inside the package so `npx motionfoundry add` works outside this monorepo.
fs.copyFileSync(new URL("../../../registry/registry.json", import.meta.url), new URL("../dist/registry.json", import.meta.url));
console.log(`[motionfoundry CLI] Built dist/index.mjs + dist/registry.json (v${pkg.version})`);
