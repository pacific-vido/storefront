import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcRoot = path.join(root, "src");
const layers = ["shared", "entities", "features", "widgets", "app"];
const rank = { shared: 0, entities: 1, features: 2, widgets: 3, app: 4 };
const violations = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function locate(file) {
  const rel = path.relative(srcRoot, file);
  if (rel.startsWith("..")) return null;
  const parts = rel.split(path.sep);
  const layer = parts[0];
  if (!layers.includes(layer)) return null;
  if (layer === "shared" || layer === "app") return { layer, slice: layer };
  const slice = parts[1];
  if (!slice) return null;
  return { layer, slice };
}

function resolveImport(fromFile, spec) {
  let base = null;
  if (spec.startsWith("@/")) base = path.join(srcRoot, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return { external: true };
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mjs`,
    `${base}.css`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  const match = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  return match ? { external: false, file: match } : { external: false, file: null };
}

function specifiers(source) {
  const found = [];
  const patterns = [
    /\bfrom\s+["']([^"']+)["']/g,
    /\bimport\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1]) found.push(match[1]);
    }
  }
  return found;
}

function isIndex(file) {
  const base = path.basename(file);
  return base === "index.ts" || base === "index.tsx";
}

function meaningfulCssLines(source) {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
  return withoutComments.split(/\r?\n/).filter((line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith("//");
  }).length;
}

const sourceFiles = walk(srcRoot).filter((file) => /\.(ts|tsx|css)$/.test(file));

for (const file of sourceFiles) {
  if (!file.endsWith(".css")) {
    const source = fs.readFileSync(file, "utf8");
    if (source.includes("dangerouslySetInnerHTML")) {
      violations.push(`${path.relative(root, file)}: dangerouslySetInnerHTML is not allowed`);
    }
    const importer = locate(file);
    if (!importer) {
      violations.push(`${path.relative(root, file)}: file is outside the FSD layers`);
      continue;
    }
    for (const spec of specifiers(source)) {
      const resolved = resolveImport(file, spec);
      if (resolved.external) continue;
      if (!resolved.file) {
        violations.push(`${path.relative(root, file)}: cannot resolve import "${spec}"`);
        continue;
      }
      if (resolved.file.endsWith(".css")) continue;
      const target = locate(resolved.file);
      if (!target) {
        violations.push(`${path.relative(root, file)}: import "${spec}" leaves the FSD layers`);
        continue;
      }
      const fixtureImport =
        spec.includes("fixtures") ||
        resolved.file.includes(`${path.sep}fixtures.ts`) ||
        resolved.file.includes(`${path.sep}fixtures.tsx`);
      const insideDemoRepository = file.includes(`${path.sep}features${path.sep}demo-repository${path.sep}`);
      if (fixtureImport && !insideDemoRepository) {
        violations.push(`${path.relative(root, file)}: fixtures are private to the demo repository`);
      }
      if (importer.layer === target.layer && importer.slice !== target.slice) {
        violations.push(
          `${path.relative(root, file)}: cross-slice import ${importer.layer}/${importer.slice} -> ${target.layer}/${target.slice} (${spec})`,
        );
        continue;
      }
      if (rank[importer.layer] < rank[target.layer]) {
        violations.push(
          `${path.relative(root, file)}: upward import ${importer.layer} -> ${target.layer} (${spec})`,
        );
        continue;
      }
      if (importer.layer !== target.layer && !isIndex(resolved.file)) {
        violations.push(`${path.relative(root, file)}: deep import across layers "${spec}"`);
      }
    }
  }
}

const cssFiles = sourceFiles.filter((file) => file.endsWith(".css"));
for (const file of cssFiles) {
  const rel = path.relative(srcRoot, file).split(path.sep).join("/");
  const lines = meaningfulCssLines(fs.readFileSync(file, "utf8"));
  if (rel === "app/globals.css") {
    if (lines > 120) violations.push(`${rel}: ${lines} meaningful lines, limit is 120`);
    continue;
  }
  if (file.endsWith(".module.css")) {
    if (lines > 80) violations.push(`${rel}: ${lines} meaningful lines, limit is 80`);
    continue;
  }
  violations.push(`${rel}: only globals.css and small CSS modules are allowed`);
}

if (violations.length > 0) {
  for (const violation of violations) console.error(violation);
  process.exit(1);
}

console.log(`Architecture check passed (${sourceFiles.length} files).`);
