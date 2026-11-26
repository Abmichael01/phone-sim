// End-to-end check of `phone-sim extension` without a real GitHub release: serves a fake
// "latest release" JSON plus the zip made by `pnpm package:extension` from a local server
// (via the hidden PHONE_SIM_RELEASE_API override), runs the BUILT CLI, and compares the
// unpacked folder with dist/. Run `pnpm build` and `pnpm package:extension` first.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const zipName = `phone-sim-extension-v${version}.zip`;
const zipPath = join("release", zipName);
if (!existsSync(zipPath) || !existsSync("dist/manifest.json") || !existsSync("dist-cli/phone-sim.js")) {
  console.error("Run `pnpm build` and `pnpm package:extension` first.");
  process.exit(1);
}
const zip = readFileSync(zipPath);
const digest = `sha256:${createHash("sha256").update(zip).digest("hex")}`;

let origin = "";
let badDigest = false;
const server = createServer((req, res) => {
  if (req.url === "/release") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ tag_name: `v${version}`, assets: [{ name: zipName, browser_download_url: `${origin}/asset`, digest: badDigest ? `sha256:${"0".repeat(64)}` : digest }] }));
  } else if (req.url === "/asset") {
    res.end(zip);
  } else {
    res.statusCode = 404;
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
origin = `http://127.0.0.1:${server.address().port}`;

const scratch = mkdtempSync(join(tmpdir(), "phone-sim-ext-"));
// Async on purpose: a blocking spawn would freeze the in-process server the CLI talks to.
const run = (args) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, ["dist-cli/phone-sim.js", "extension", ...args], { env: { ...process.env, PHONE_SIM_RELEASE_API: `${origin}/release` } });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
const files = (dir) => readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => relative(dir, join(e.parentPath, e.name)).split(sep).join("/")).sort();
const failures = [];
const expect = (ok, what) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failures.push(what);
};

try {
  const target = join(scratch, "phone-sim-extension");
  const first = await run(["--dir", target]);
  console.log("---- output (human) ----\n" + first.stdout + "---- stderr ----\n" + first.stderr);
  expect(first.status === 0, "exit 0");
  expect(JSON.stringify(files(target)) === JSON.stringify(files("dist")), "unpacked files equal dist/ files");
  expect(JSON.parse(readFileSync(join(target, "manifest.json"), "utf8")).name === "Phone Sim", "manifest.json at folder root");

  const again = await run(["--dir", target, "--json"]);
  console.log("---- output (--json) ----\n" + again.stdout);
  const json = JSON.parse(again.stdout);
  expect(again.status === 0 && json.version === version && json.dir === target && json.steps.length === 3, "second run (update) with --json");
  expect(readdirSync(scratch).length === 1, "no temp folders left behind");

  const foreign = join(scratch, "mine");
  mkdirSync(foreign);
  writeFileSync(join(foreign, "keep.txt"), "x");
  const refused = await run(["--dir", foreign]);
  console.log("---- foreign folder ----\n" + refused.stderr);
  expect(refused.status === 2 && existsSync(join(foreign, "keep.txt")) && !existsSync(join(foreign, "manifest.json")), "foreign folder refused and untouched");

  badDigest = true;
  const mismatch = await run(["--dir", join(scratch, "other")]);
  console.log("---- checksum mismatch ----\n" + mismatch.stderr);
  expect(mismatch.status === 2 && !existsSync(join(scratch, "other")), "checksum mismatch fails and leaves no folder");
} finally {
  server.close();
  rmSync(scratch, { recursive: true, force: true });
}
if (failures.length > 0) process.exit(1);
console.log("\nextension install check passed.");
