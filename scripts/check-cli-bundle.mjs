// The built CLI (dist-cli/phone-sim.js) is committed so `npx github:Abmichael01/phone-sim`
// runs without a build step. This check rebuilds it into a temp folder and fails when the
// committed file is out of date.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const committed = "dist-cli/phone-sim.js";
const temp = mkdtempSync(join(tmpdir(), "phone-sim-cli-"));
try {
  execFileSync("pnpm", ["exec", "vite", "build", "-c", "vite.cli.config.ts", "--outDir", temp, "--logLevel", "error"], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  const fresh = readFileSync(join(temp, "phone-sim.js"));
  let current;
  try {
    current = readFileSync(committed);
  } catch {
    current = null;
  }
  if (!current || !fresh.equals(current)) {
    console.error(`${committed} is out of date. Run: pnpm build:cli, then commit ${committed}`);
    process.exit(1);
  }
  console.log(`${committed} is up to date.`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
