// Runs the built CLI (dist-cli/phone-sim.js) on the responsive fixtures and
// checks the results: bad.html must fail with the expected rules, good.html and
// article.html must pass. Run `pnpm build:cli` first. Reports go to phone-sim-report/fixtures-*.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const cli = `${root}dist-cli/phone-sim.js`;
if (!existsSync(cli)) {
  console.error("dist-cli/phone-sim.js is missing. Run: pnpm build:cli");
  process.exit(2);
}

function check(name, expectedCode) {
  const out = `${root}phone-sim-report/fixtures-${name}`;
  const result = spawnSync(process.execPath, [cli, "check", `${root}fixtures/responsive/${name}.html`, "--preset", "common", "--json", "--all", "--out", out], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  const report = JSON.parse(result.stdout);
  if (result.status !== expectedCode) throw new Error(`${name}.html: expected exit ${expectedCode}, got ${result.status}`);
  return report;
}

const failures = [];
const bad = check("bad", 1);
const found = new Set(bad.devices.flatMap((device) => device.issues.map((issue) => issue.rule)));
const required = ["small-tap-target", "small-text", "ios-input-zoom", "text-clipped", "fixed-covers-screen"];
for (const rule of required) if (!found.has(rule)) failures.push(`bad.html: ${rule} not found`);
if (!found.has("viewport-meta") && !found.has("horizontal-overflow")) failures.push("bad.html: neither viewport-meta nor horizontal-overflow found");

const good = check("good", 0);
if (good.summary.errors !== 0) failures.push(`good.html: ${good.summary.errors} errors`);

// A long article: footnotes in <sup>, links in sentences, sr-only text. Nothing to fix.
const article = check("article", 0);
if (article.summary.errors + article.summary.warnings !== 0) {
  failures.push(`article.html: ${article.summary.errors} errors and ${article.summary.warnings} warnings (expected none)`);
}

if (failures.length > 0) {
  console.error(`\nFixture check failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.error(`\nFixture check passed: bad.html found ${[...found].sort().join(", ")}; good.html and article.html are clean.`);
