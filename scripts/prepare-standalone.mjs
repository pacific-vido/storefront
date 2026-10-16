import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function prepareStandalone(root = process.cwd()) {
  const standalone = path.join(root, ".next", "standalone");
  const server = path.join(standalone, "server.js");
  if (!existsSync(server)) {
    throw new Error("Standalone server is missing. Run npm run build first.");
  }

  const publicDir = path.join(root, "public");
  if (existsSync(publicDir)) {
    cpSync(publicDir, path.join(standalone, "public"), { recursive: true });
  }

  const staticDir = path.join(root, ".next", "static");
  if (!existsSync(staticDir)) {
    throw new Error("Next.js did not emit .next/static.");
  }
  const targetStatic = path.join(standalone, ".next", "static");
  mkdirSync(path.dirname(targetStatic), { recursive: true });
  cpSync(staticDir, targetStatic, { recursive: true });
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  prepareStandalone();
}
