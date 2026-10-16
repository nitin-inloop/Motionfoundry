#!/usr/bin/env node
/**
 * motionfoundry CLI — Install verified animated React components and scoped CSS modules
 * Commands:
 *   npx motionfoundry list [--collection <core|studio-kit>]
 *   npx motionfoundry init [--dir <targetDir>]
 *   npx motionfoundry add <component-slug...> [--dir <targetDir>] [--overwrite]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadRegistry() {
  const candidates = [
    // Bundled copy shipped inside the published package (written by scripts/build.mjs).
    path.resolve(__dirname, "registry.json"),
    path.resolve(__dirname, "../../../registry/registry.json"),
    path.resolve(__dirname, "../../registry/registry.json"),
    path.resolve(process.cwd(), "registry/registry.json"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return JSON.parse(fs.readFileSync(candidate, "utf8"));
    }
  }
  throw new Error("Unable to locate registry/registry.json.");
}

function detectProjectEnvironment(targetRoot) {
  const pkgJsonPath = path.join(targetRoot, "package.json");
  let framework = "react-ts";
  let hasSrcDir = fs.existsSync(path.join(targetRoot, "src"));
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (deps.next) {
        if (fs.existsSync(path.join(targetRoot, "src/app")) || fs.existsSync(path.join(targetRoot, "app"))) {
          framework = "nextjs-app-router";
        } else {
          framework = "nextjs-pages-router";
        }
      } else if (deps.vite) {
        framework = "vite-react";
      }
    } catch {
      // ignore malformed package.json
    }
  }
  return {
    framework,
    baseDir: hasSrcDir ? path.join(targetRoot, "src") : targetRoot,
  };
}

export function runCli(argv = process.argv.slice(2)) {
  const registry = loadRegistry();
  const args = [...argv];

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log([
      "MotionFoundry CLI v" + registry.version,
      "",
      "Usage:",
      `  npx motionfoundry list [--collection <id>]  List all ${registry.components.length} available components (collections: ${(registry.collections ?? []).map((c) => c.id).join(", ")})`,
      "  npx motionfoundry init [--dir <path>]       Initialize motionfoundry.json in your project",
      "  npx motionfoundry add <slug...> [options]   Copy component .tsx and .module.css files into your project",
      "",
      "Options:",
      "  --dir <path>      Target project directory (default: current working directory)",
      "  --overwrite       Overwrite existing component files if conflicts are detected",
      "  --version, -v     Print CLI version",
    ].join("\n"));
    return { code: 0 };
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log(`motionfoundry/${registry.version}`);
    return { code: 0 };
  }

  const command = args[0];
  const overwrite = args.includes("--overwrite");
  const dirIdx = args.indexOf("--dir");
  const targetRoot = dirIdx !== -1 && args[dirIdx + 1]
    ? path.resolve(args[dirIdx + 1])
    : process.cwd();

  if (command === "list") {
    const collectionIdx = args.indexOf("--collection");
    const collection = collectionIdx !== -1 ? args[collectionIdx + 1] : undefined;
    if (collection && !(registry.collections ?? []).some((c) => c.id === collection)) {
      console.error(`✖ Unknown collection "${collection}". Available: ${(registry.collections ?? []).map((c) => c.id).join(", ")}`);
      return { code: 1 };
    }
    const listed = registry.components.filter((c) => !collection || c.collection === collection);
    console.log(`MotionFoundry Registry v${registry.version} (${listed.length} components${collection ? ` in ${collection}` : ""}):\n`);
    for (const comp of listed) {
      const deps = comp.dependencies.join(", ");
      console.log(`  • ${comp.slug.padEnd(28)} ${comp.name.padEnd(24)} [${comp.category}] (deps: ${deps})`);
    }
    return { code: 0, count: listed.length };
  }

  if (command === "init") {
    fs.mkdirSync(targetRoot, { recursive: true });
    const env = detectProjectEnvironment(targetRoot);
    const configPath = path.join(targetRoot, "motionfoundry.json");
    const configPayload = {
      $schema: "https://motionfoundry.dev/schema/config.json",
      brand: registry.brandName,
      version: registry.version,
      framework: env.framework,
      componentsDir: "components/ui",
      stylesDir: "components/styles",
      typescript: true,
    };
    fs.writeFileSync(configPath, JSON.stringify(configPayload, null, 2) + "\n", "utf8");
    console.log(`✔ Initialized motionfoundry.json (${env.framework}) in ${targetRoot}`);
    return { code: 0, configPath };
  }

  if (command === "add") {
    const requestedSlugs = args.slice(1).filter((arg, idx, arr) => {
      if (arg.startsWith("--")) return false;
      if (idx > 0 && (arr[idx - 1] === "--dir" || arr[idx - 1] === "--collection")) return false;
      return true;
    });

    if (requestedSlugs.length === 0) {
      console.error("✖ Error: Please specify at least one component slug (e.g., npx motionfoundry add kinetic-type).");
      return { code: 1 };
    }

    fs.mkdirSync(targetRoot, { recursive: true });
    const env = detectProjectEnvironment(targetRoot);
    const addedFiles = [];
    const skippedFiles = [];
    const requiredDeps = new Set();

    for (const slug of requestedSlugs) {
      const comp = registry.components.find(
        (c) => c.slug === slug || c.name.toLowerCase() === slug.toLowerCase()
      );
      if (!comp) {
        console.error(`✖ Component "${slug}" not found in MotionFoundry v${registry.version} registry. Run "npx motionfoundry list" to see valid slugs.`);
        return { code: 1 };
      }

      for (const dep of comp.dependencies) {
        if (dep !== "react") requiredDeps.add(dep);
      }

      for (const fileEntry of comp.files) {
        const destPath = path.join(env.baseDir, fileEntry.path);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });

        if (fs.existsSync(destPath) && !overwrite) {
          skippedFiles.push(destPath);
          console.log(`⚠ Conflict detected: ${path.relative(targetRoot, destPath)} already exists. Skipping to preserve existing code (pass --overwrite to replace).`);
          continue;
        }

        fs.writeFileSync(destPath, fileEntry.content, "utf8");
        addedFiles.push(destPath);
        console.log(`✔ Added ${path.relative(targetRoot, destPath)}`);
      }
    }

    console.log("\nSummary:");
    console.log(`  Environment : ${env.framework}`);
    console.log(`  Files added : ${addedFiles.length}`);
    if (skippedFiles.length > 0) {
      console.log(`  Skipped     : ${skippedFiles.length} (existing files preserved)`);
    }
    if (requiredDeps.size > 0) {
      console.log(`\nNext steps — install peer dependencies if not already present:`);
      console.log(`  pnpm add ${Array.from(requiredDeps).join(" ")}`);
    }
    return { code: 0, addedFiles, skippedFiles, requiredDeps: Array.from(requiredDeps) };
  }

  console.error(`✖ Unknown command "${command}". Run "npx motionfoundry --help".`);
  return { code: 1 };
}

// Resolve symlinks (npx / global bin shims) and Windows drive paths before comparing.
const invokedPath = process.argv[1] ? fs.realpathSync(process.argv[1]) : "";
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  const res = runCli();
  if (res.code !== 0) process.exit(res.code);
}
