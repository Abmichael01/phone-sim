import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { devices, formatScreen, sortNewestFirst } from "@/devices";
import { version } from "../../package.json";
import { HELP_TEXT, parseCli, type CheckOptions, type DevicesOptions, type InitOptions } from "./args";
import { selectDevices } from "./devicesSelect";
import { exitCodeFor, JSON_CAP, NO_CAP, summarize, VIEWPORT_NOTE, type Report } from "./issues";
import { runInit } from "./init";
import { formatHuman, pickStyle } from "./report";
import { CheckError, runCheck, writeReportFiles } from "./run";
import { httpProbe, openWithSystem } from "./system";
import { DEV_PORTS, findDevServer, normalizeTarget } from "./target";
import { RUN } from "./command";

/** Parallel device pages in one browser. */
const CONCURRENCY = 4;

const stderr = (line: string) => process.stderr.write(`${line}\n`);

function fail(error: CheckError, debug: boolean): number {
  const style = pickStyle(process.stderr.isTTY, process.env);
  stderr(style.red(`✖ ${error.message}`));
  if (error.next) stderr(`  Next: ${error.next}`);
  if (debug) stderr(style.dim(error.detailText || error.stack || ""));
  return 2;
}

async function resolveUrl(input: string | undefined): Promise<string> {
  if (input !== undefined) {
    const target = normalizeTarget(input, process.cwd(), homedir());
    if (!target.ok) throw new CheckError(target.message, `${RUN} check http://localhost:3000`);
    if (target.kind === "file" && !existsSync(fileURLToPath(target.url))) {
      throw new CheckError(`File not found: ${fileURLToPath(target.url)}`, "Check the path, then run the command again.");
    }
    return target.url;
  }
  stderr(`Looking for a dev server on ports ${DEV_PORTS.join(", ")}…`);
  const port = await findDevServer((candidate) => httpProbe(candidate));
  if (port === null) {
    throw new CheckError(
      `No dev server is running on ports ${DEV_PORTS.join(", ")}.`,
      `Start your dev server, or give the URL: ${RUN} check http://localhost:<port>`,
    );
  }
  const url = `http://localhost:${port}/`;
  stderr(`Found a dev server at ${url}`);
  return url;
}

async function check(options: CheckOptions): Promise<number> {
  const selection = selectDevices({ devices: options.devices, preset: options.preset }, devices);
  if (!selection.ok) {
    throw new CheckError(selection.message, `${RUN} devices --search <name>   (lists every device id)`);
  }
  const url = await resolveUrl(options.url);
  const outDir = resolve(process.cwd(), options.out);
  const turned = options.landscape ? " (portrait and landscape)" : "";
  stderr(`Checking ${url} on ${selection.devices.length} devices${turned}…`);

  const { devices: results } = await runCheck({
    url,
    devices: selection.devices,
    landscape: options.landscape,
    fullPage: options.fullPage,
    wait: options.wait,
    timeout: options.timeout,
    outDir,
    frame: options.frame,
    annotate: options.annotate,
    all: options.all,
    concurrency: CONCURRENCY,
    autoInstall: process.env.PHONE_SIM_NO_INSTALL === undefined || process.env.PHONE_SIM_NO_INSTALL === "0",
    log: stderr,
  });

  const report: Report = {
    url,
    checkedAt: new Date().toISOString(),
    tool: { name: "phone-sim", version },
    outDir,
    reportHtml: join(outDir, "report.html"),
    viewportNote: VIEWPORT_NOTE,
    devices: results,
    summary: summarize(results),
  };
  const jsonReport = await writeReportFiles(report, options.all ? NO_CAP : JSON_CAP);

  const out = options.json ? process.stderr : process.stdout;
  out.write(`\n${formatHuman(report, pickStyle(out.isTTY, process.env), { all: options.all })}\n`);
  if (options.json) process.stdout.write(`${JSON.stringify(jsonReport, null, 2)}\n`);
  if (options.open) openWithSystem(report.reportHtml);
  return exitCodeFor(report.summary, options.failOn);
}

function listDevices(options: DevicesOptions): number {
  const words = (options.search ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const matches = sortNewestFirst(devices).filter((device) => {
    const haystack = `${device.id} ${device.brand} ${device.name} ${device.platform}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
  if (options.json) {
    const rows = matches.map(({ id, name, brand, kind, platform, year, screen, dpr }) => ({ id, name, brand, kind, platform, year, screen, dpr }));
    process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
    return 0;
  }
  if (matches.length === 0) {
    stderr(`No device matches "${options.search ?? ""}".`);
    stderr(`  Next: ${RUN} devices   (lists every device)`);
    return 2;
  }
  const idWidth = Math.max(...matches.map((device) => device.id.length));
  const nameWidth = Math.max(...matches.map((device) => device.name.length));
  for (const device of matches) {
    process.stdout.write(`${device.id.padEnd(idWidth)}  ${device.name.padEnd(nameWidth)}  ${formatScreen(device).padEnd(16)}  ${device.platform}\n`);
  }
  stderr(`\n${matches.length} devices. Use ids with: ${RUN} check <url> --devices ${matches[0]?.id ?? "iphone-16-pro"}`);
  return 0;
}

function init(options: InitOptions): number {
  const dir = process.cwd();
  const changes = runInit(dir, options.dryRun);
  const verb = options.dryRun ? "Would change" : "Changed";
  const changed = changes.filter((change) => change.action !== "unchanged");
  for (const change of changes) {
    const action = change.action === "unchanged" ? "unchanged" : options.dryRun ? `would be ${change.action}` : change.action;
    process.stdout.write(`  ${change.file}: ${action} (${change.description})\n`);
  }
  if (changed.length === 0) {
    process.stdout.write(`Already set up. AI agents here will run: ${RUN} check --json\n`);
  } else {
    process.stdout.write(`${verb} ${changed.length} file${changed.length === 1 ? "" : "s"} in ${dir}.\n`);
    if (options.dryRun) process.stdout.write(`Run without --dry-run to apply: ${RUN} init\n`);
  }
  return 0;
}

async function main(argv: readonly string[]): Promise<number> {
  const parsed = parseCli(argv);
  if (!parsed.ok) {
    return fail(new CheckError(parsed.message, `${RUN} --help`), parsed.debug);
  }
  const { value } = parsed;
  const debug = "options" in value && "debug" in value.options ? value.options.debug : false;
  try {
    switch (value.command) {
      case "help":
        process.stdout.write(`${HELP_TEXT}\n`);
        return 0;
      case "version":
        process.stdout.write(`${version}\n`);
        return 0;
      case "devices":
        return listDevices(value.options);
      case "init":
        return init(value.options);
      case "check":
        return await check(value.options);
    }
  } catch (error) {
    if (error instanceof CheckError) return fail(error, debug);
    const message = error instanceof Error ? error.message.split("\n")[0] ?? error.message : String(error);
    const wrapped = new CheckError(`Something went wrong: ${message}`, "Run the same command again with --debug for details.", error instanceof Error ? (error.stack ?? "") : "");
    return fail(wrapped, debug);
  }
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    stderr(`✖ ${String(error)}`);
    process.exitCode = 2;
  },
);
