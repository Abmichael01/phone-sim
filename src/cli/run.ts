import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, BrowserContext, CDPSession } from "playwright";
import { FALLBACK_CHROME_MAJOR } from "@/devices/userAgent";
import type { Device } from "@/schemas/device";
import type { Orientation } from "@/schemas/settings";
import { chromeMajorFrom, emulationFor, hasScreenCutout, isDesktopClass, safeAreaInsets, type SafeAreaInsets } from "./emulate";
import { frameGeometry, frameHtml, screenHtml, screenObstacles } from "./frame";
import { alignAcrossDevices, capReport, groupIssues, reportSchema, type CapOptions, type DeviceReport, type Issue, type Report } from "./issues";
import { layoutOverlay } from "./overlay";
import { mapLimit } from "./pool";
import { toHtml, toMarkdown } from "./report";
import { collectIssues, hasViewportFitCover, type RuleOptions } from "./rules";
import { INSTALL_COMMAND, installHeadlessChromium, isMissingBrowserError } from "./system";

/** A failure the user can fix: what went wrong plus the exact next command. */
export class CheckError extends Error {
  constructor(
    message: string,
    readonly next: string,
    readonly detailText = "",
  ) {
    super(message);
    this.name = "CheckError";
  }
}

export interface RunOptions {
  url: string;
  devices: readonly Device[];
  landscape: boolean;
  fullPage: boolean;
  wait: number;
  timeout: number;
  /** Absolute output folder. */
  outDir: string;
  frame: boolean;
  annotate: boolean;
  /** Also annotate info-level notes. */
  all: boolean;
  concurrency: number;
  /** Download Chromium automatically when it is missing. */
  autoInstall: boolean;
  /** Progress lines (stderr). */
  log: (line: string) => void;
}

interface Job {
  device: Device;
  orientation: Orientation;
  base: string;
}

/** Same rules as the README: up to 10 overflow root causes per device. */
const MAX_OVERFLOW = 10;
const NETWORK_IDLE_CAP = 5000;
/** Frame drawings are rendered at 2x (1x for very tall full-page shots, to stay under the bitmap limit). */
const FRAME_SCALE = 2;
const MAX_FRAME_PIXELS = 16000;
const SAFE_AREA_OFF: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };

export function jobsFor(devices: readonly Device[], landscape: boolean): Job[] {
  return devices.flatMap((device) => {
    const portrait: Job = { device, orientation: "portrait", base: device.id };
    return landscape ? [portrait, { device, orientation: "landscape", base: `${device.id}-landscape` }] : [portrait];
  });
}

/** Width and height from a PNG header (bytes 16–23). */
export function pngSize(png: Uint8Array): { width: number; height: number } {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  if (png.byteLength < 24) return { width: 0, height: 0 };
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function firstLine(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return (text.split("\n")[0] ?? text).replace(/^[a-zA-Z.]+: /, "");
}

/** Turns a navigation failure into a plain message and the next command to run. */
export function describeLoadError(error: unknown, url: string, timeout: number): CheckError {
  const text = error instanceof Error ? error.message : String(error);
  const retry = `npx phone-sim check ${url}`;
  if (/ERR_CONNECTION_REFUSED|ECONNREFUSED/.test(text)) {
    return new CheckError(`Nothing is answering at ${url}.`, `Start your dev server, then run: ${retry}`, text);
  }
  if (/ERR_NAME_NOT_RESOLVED/.test(text)) {
    return new CheckError(`The address ${new URL(url).host} could not be found.`, `Check the spelling, then run: ${retry}`, text);
  }
  if (/ERR_FILE_NOT_FOUND/.test(text)) {
    return new CheckError(`File not found: ${url.startsWith("file:") ? fileURLToPath(url) : url}`, "Check the path, then run the command again.", text);
  }
  if (/ERR_CERT|SSL/.test(text)) {
    return new CheckError(`The HTTPS certificate of ${url} is not valid.`, `For a local server use http://, e.g. npx phone-sim check ${url.replace(/^https:/, "http:")}`, text);
  }
  if (/Timeout \d+ms exceeded|TimeoutError/i.test(text)) {
    return new CheckError(
      `The page did not finish loading within ${Math.round(timeout / 1000)}s.`,
      `${retry} --timeout ${Math.min(timeout * 2, 600_000)}`,
      text,
    );
  }
  return new CheckError(`Could not open ${url}: ${firstLine(error)}`, `Check that the URL opens in your browser, then run: ${retry}`, text);
}

async function launchBrowser(options: RunOptions): Promise<Browser> {
  let chromium: typeof import("playwright").chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (error) {
    throw new CheckError("The playwright package is missing.", "npm install playwright", String(error));
  }
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    if (!isMissingBrowserError(error)) {
      throw new CheckError(`The headless browser could not start: ${firstLine(error)}`, INSTALL_COMMAND, String(error));
    }
    if (!options.autoInstall) {
      throw new CheckError("The headless browser is not installed yet.", INSTALL_COMMAND, String(error));
    }
    options.log("Downloading a headless browser (one time, ~100 MB)…");
    if (!(await installHeadlessChromium())) {
      throw new CheckError("The headless browser could not be downloaded.", INSTALL_COMMAND);
    }
    try {
      return await chromium.launch({ headless: true });
    } catch (retryError) {
      throw new CheckError(`The headless browser could not start: ${firstLine(retryError)}`, INSTALL_COMMAND, String(retryError));
    }
  }
}

export async function setSafeArea(cdp: CDPSession | null, insets: SafeAreaInsets): Promise<void> {
  if (!cdp) return;
  // Chromium otherwise reports 0 for env(safe-area-inset-*), which would hide real notch problems.
  await cdp
    .send("Emulation.setSafeAreaInsetsOverride" as never, {
      insets: {
        top: insets.top,
        topMax: insets.top,
        bottom: insets.bottom,
        bottomMax: insets.bottom,
        left: insets.left,
        leftMax: insets.left,
        right: insets.right,
        rightMax: insets.right,
      },
    } as never)
    .catch(() => undefined);
}

/** Renders the framed and/or annotated screenshot in a separate page (the checked page is not touched). */
class ImageRenderer {
  private context: Promise<BrowserContext> | null = null;
  constructor(private readonly browser: Browser) {}

  async render(html: string, size: { width: number; height: number }): Promise<Buffer> {
    const scale = size.height * FRAME_SCALE > MAX_FRAME_PIXELS ? "css" : "device";
    this.context ??= this.browser.newContext({ deviceScaleFactor: FRAME_SCALE });
    const context = await this.context;
    const page = await context.newPage();
    try {
      await page.setViewportSize({ width: Math.ceil(size.width) + 2, height: Math.ceil(size.height) + 2 });
      await page.setContent(html, { waitUntil: "load" });
      return await page.locator("#device").screenshot({ omitBackground: true, scale });
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    if (this.context) await (await this.context).close();
  }
}

/** Removes files from an earlier run, only when the folder holds a phone-sim report. */
export async function prepareOutDir(outDir: string): Promise<void> {
  await mkdir(outDir, { recursive: true });
  const entries = await readdir(outDir);
  if (!entries.includes("report.json")) return;
  const ours = entries.filter((name) => name.endsWith(".png") || /^report\.(json|md|html)$/.test(name));
  await Promise.all(ours.map((name) => rm(join(outDir, name), { force: true })));
}

/** One device after the page check: the report entry plus the plain screenshot to annotate later. */
interface Checked {
  job: Job;
  report: DeviceReport;
  rawPng: Buffer;
  /** CSS size of rawPng. */
  cssSize: { width: number; height: number };
}

async function checkOne(browser: Browser, chromeMajor: number, job: Job, options: RunOptions): Promise<Checked> {
  const { device, orientation } = job;
  const emulation = emulationFor(device, orientation, chromeMajor);
  const context = await browser.newContext(emulation);
  try {
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page).catch(() => null);
    const insets = safeAreaInsets(device, orientation);
    await setSafeArea(cdp, insets);

    let status: number | null = null;
    try {
      const response = await page.goto(options.url, { waitUntil: "load", timeout: options.timeout });
      status = options.url.startsWith("file:") ? null : (response?.status() ?? null);
    } catch (error) {
      throw describeLoadError(error, options.url, options.timeout);
    }
    await page.waitForLoadState("networkidle", { timeout: NETWORK_IDLE_CAP }).catch(() => undefined);
    if (options.wait > 0) await page.waitForTimeout(options.wait);

    // Like iOS: without viewport-fit=cover the page is kept clear of the notch, so insets are 0.
    if (!(await page.evaluate(hasViewportFitCover))) await setSafeArea(cdp, SAFE_AREA_OFF);
    await page.evaluate(() => window.scrollTo(0, 0));

    const ruleOptions: RuleOptions = {
      ios: device.platform === "ios" || device.platform === "ipados",
      desktopClass: isDesktopClass(device),
      dpr: device.dpr,
      checkSafeArea: orientation === "portrait" && hasScreenCutout(device),
      maxOverflow: MAX_OVERFLOW,
    };
    const issues = groupIssues(await page.evaluate(collectIssues, ruleOptions));

    const shot = options.fullPage ? ({ fullPage: true, scale: "css" } as const) : ({ scale: "device" } as const);
    const rawPng = await page.screenshot(shot);
    const pixels = pngSize(rawPng);
    const ratio = options.fullPage ? 1 : device.dpr;

    return {
      job,
      rawPng,
      cssSize: { width: pixels.width / ratio, height: pixels.height / ratio },
      report: {
        id: device.id,
        name: device.name,
        viewport: emulation.viewport,
        dpr: device.dpr,
        orientation,
        status,
        screenshot: join(options.outDir, `${job.base}.png`),
        rawScreenshot: join(options.outDir, `${job.base}-raw.png`),
        issues,
        omitted: { errors: 0, warnings: 0, infos: 0 },
      },
    };
  } finally {
    await context.close().catch(() => undefined);
  }
}

/** Boxes drawn on a screenshot: errors and warnings, plus notes with --all. */
export function annotatedIssues(issues: readonly Issue[], annotate: boolean, all: boolean): Issue[] {
  if (!annotate) return [];
  return issues.filter((issue) => all || issue.severity !== "info");
}

async function writeImages(renderer: ImageRenderer, checked: Checked, options: RunOptions): Promise<void> {
  const { job, report, rawPng, cssSize } = checked;
  await writeFile(report.rawScreenshot, rawPng);
  const obstacles = options.frame ? screenObstacles(job.device, job.orientation) : { cornerRadius: 0, avoid: [] };
  const overlay = layoutOverlay(annotatedIssues(report.issues, options.annotate, options.all), { width: report.viewport.width, ...obstacles });
  const hasOverlay = overlay.boxes.length > 0;
  if (!options.frame && !hasOverlay) {
    await writeFile(report.screenshot, rawPng);
    return;
  }
  const input = { image: `data:image/png;base64,${rawPng.toString("base64")}`, content: cssSize, overlay: hasOverlay ? overlay : undefined };
  const png = options.frame
    ? await renderer.render(frameHtml({ device: job.device, orientation: job.orientation, ...input }), frameGeometry(job.device, job.orientation, cssSize).outer)
    : await renderer.render(screenHtml(input), cssSize);
  await writeFile(report.screenshot, png);
}

/**
 * Checks every device (in parallel, one shared browser), aligns issue numbers
 * across devices, then writes the plain and annotated screenshots.
 */
export async function runCheck(options: RunOptions): Promise<{ devices: DeviceReport[]; browserVersion: string }> {
  const jobs = jobsFor(options.devices, options.landscape);
  await prepareOutDir(options.outDir);
  const browser = await launchBrowser(options);
  const renderer = new ImageRenderer(browser);
  const version = browser.version();
  const chromeMajor = chromeMajorFrom(version, FALLBACK_CHROME_MAJOR);
  let failure: unknown = null;
  let done = 0;
  try {
    const results = await mapLimit(jobs, options.concurrency, async (job) => {
      if (failure) return null;
      try {
        const result = await checkOne(browser, chromeMajor, job, options);
        done += 1;
        const turned = job.orientation === "landscape" ? " landscape" : "";
        options.log(`  [${done}/${jobs.length}] ${job.device.name}${turned}`);
        return result;
      } catch (error) {
        failure ??= error;
        return null;
      }
    });
    if (failure) {
      throw failure instanceof CheckError
        ? failure
        : new CheckError(`The check stopped: ${firstLine(failure)}`, "Run the same command again with --debug for details.", String(failure));
    }
    const checked = results.filter((result): result is Checked => result !== null);
    const aligned = alignAcrossDevices(checked.map((item) => item.report.issues));
    const final = checked.map((item, index) => ({ ...item, report: { ...item.report, issues: aligned[index] ?? [] } }));
    await mapLimit(final, options.concurrency, (item) => writeImages(renderer, item, options));
    return { devices: final.map((item) => item.report), browserVersion: version };
  } finally {
    await renderer.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
}

/**
 * Validates the report, writes report.md and report.html with every issue and
 * report.json capped by `cap` (see JSON_CAP). Returns the JSON report.
 */
export async function writeReportFiles(report: Report, cap: CapOptions): Promise<Report> {
  const full = reportSchema.parse(report);
  const capped = reportSchema.parse(capReport(full, cap));
  await writeFile(join(full.outDir, "report.json"), `${JSON.stringify(capped, null, 2)}\n`);
  await writeFile(join(full.outDir, "report.md"), toMarkdown(full));
  await writeFile(full.reportHtml, toHtml(full));
  return capped;
}
