// Zips the already-built extension (dist/) into release/phone-sim-extension-v<version>.zip,
// the file people download from the GitHub Release. It builds nothing: run `pnpm build` first.
// manifest.json sits at the zip root (no wrapper folder) so "Load unpacked" works after unzipping.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { zipSync } from "fflate";

const fail = (message) => {
  console.error(`✖ ${message}`);
  process.exit(1);
};

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const distDir = "dist";
const manifestPath = join(distDir, "manifest.json");
if (!existsSync(manifestPath)) fail("dist/manifest.json not found. Run `pnpm build` first, then package.");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.version !== version) {
  fail(
    `Version mismatch: package.json is ${version} but dist/manifest.json is ${manifest.version}. ` +
      "Make package.json and public/manifest.json equal, run `pnpm build`, then package.",
  );
}
if (manifest.name !== "Phone Sim") fail(`dist/manifest.json is named "${manifest.name}", expected "Phone Sim".`);

/** Every file under dir, as full paths. */
function listFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...listFiles(full));
    else if (entry.isFile()) found.push(full);
  }
  return found;
}

const files = {};
for (const file of listFiles(distDir).sort()) {
  files[relative(distDir, file).split(sep).join("/")] = new Uint8Array(readFileSync(file));
}

const zip = zipSync(files, { level: 9, mtime: new Date("2020-01-01T00:00:00Z") });
mkdirSync("release", { recursive: true });
const out = join("release", `phone-sim-extension-v${version}.zip`);
writeFileSync(out, zip);
console.log(`Wrote ${out} (${Object.keys(files).length} files, ${(zip.length / 1024).toFixed(0)} KB).`);
