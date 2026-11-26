import { createHash } from "node:crypto";
import { RUN } from "./command";

/** `phone-sim extension`: pure helpers (release parsing, checksums, zip safety, folder decisions, wording). */

export const RELEASE_API = "https://api.github.com/repos/Abmichael01/phone-sim/releases/latest";
export const RELEASES_PAGE = "https://github.com/Abmichael01/phone-sim/releases/latest";
export const ASSET_PATTERN = /^phone-sim-extension-v[\d.]+\.zip$/;
export const EXTENSION_NAME = "Phone Sim";
/** Biggest download we accept. */
export const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;
/** Biggest total size once unzipped. */
export const MAX_UNPACKED_BYTES = 200 * 1024 * 1024;
export const MAX_ENTRIES = 5000;

export interface ReleaseAsset {
  name: string;
  url: string;
  digest: string | undefined;
}

export type PickResult =
  | { ok: true; tag: string; asset: ReleaseAsset }
  | { ok: false; reason: "invalid" | "no-asset" };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** Finds the extension zip in the "latest release" JSON from the GitHub API. */
export function pickAsset(release: unknown): PickResult {
  if (!isRecord(release) || !Array.isArray(release.assets)) return { ok: false, reason: "invalid" };
  for (const item of release.assets) {
    if (!isRecord(item)) continue;
    const { name, browser_download_url: url, digest } = item;
    if (typeof name !== "string" || typeof url !== "string" || !ASSET_PATTERN.test(name)) continue;
    return {
      ok: true,
      tag: typeof release.tag_name === "string" ? release.tag_name : "",
      asset: { name, url, digest: typeof digest === "string" ? digest : undefined },
    };
  }
  return { ok: false, reason: "no-asset" };
}

/** "phone-sim-extension-v0.4.0.zip" -> "0.4.0". */
export function versionFromAssetName(name: string): string | null {
  return /^phone-sim-extension-v([\d.]+)\.zip$/.exec(name)?.[1] ?? null;
}

/** "sha256:<64 hex>" -> lowercase hex, or null when missing or not a SHA-256 digest. */
export function parseDigest(digest: string | undefined): string | null {
  const match = /^sha256:([0-9a-fA-F]{64})$/.exec(digest ?? "");
  return match?.[1]?.toLowerCase() ?? null;
}

export type DigestCheck = "ok" | "mismatch" | "not-provided";

export function verifyDigest(bytes: Uint8Array, digest: string | undefined): DigestCheck {
  const expected = parseDigest(digest);
  if (expected === null) return "not-provided";
  return createHash("sha256").update(bytes).digest("hex") === expected ? "ok" : "mismatch";
}

/** A zip entry name that stays inside the target folder: relative, no "..", no drive letter or backslash tricks. */
export function isSafeEntryPath(path: string): boolean {
  if (path.length === 0 || path.includes("\0")) return false;
  if (path.startsWith("/") || path.startsWith("\\") || /^[a-zA-Z]:/.test(path)) return false;
  return !path.split(/[\\/]/).some((part) => part === "..");
}

export interface ZipEntryInfo {
  name: string;
  size: number;
}

export type EntriesCheck = { ok: true } | { ok: false; message: string };

/** Checks the zip's table of contents before anything is written to disk. */
export function checkEntries(entries: readonly ZipEntryInfo[]): EntriesCheck {
  if (entries.length === 0) return { ok: false, message: "The downloaded zip is empty." };
  if (entries.length > MAX_ENTRIES) return { ok: false, message: "The downloaded zip has too many files." };
  const unsafe = entries.find((entry) => !isSafeEntryPath(entry.name));
  if (unsafe) return { ok: false, message: `The downloaded zip has an unsafe file path ("${unsafe.name}"), so it was not unpacked.` };
  if (entries.reduce((sum, entry) => sum + entry.size, 0) > MAX_UNPACKED_BYTES) {
    return { ok: false, message: "The downloaded zip would unpack to an unreasonable size." };
  }
  if (!entries.some((entry) => entry.name === "manifest.json")) {
    return { ok: false, message: "The downloaded zip has no manifest.json at its top level, so it is not a Phone Sim extension folder." };
  }
  return { ok: true };
}

/** Name and version from manifest.json text; null when it is not a valid Phone Sim manifest. */
export function parseManifest(text: string): { name: string; version: string } | null {
  try {
    const data: unknown = JSON.parse(text);
    if (!isRecord(data) || data.name !== EXTENSION_NAME || typeof data.version !== "string") return null;
    return { name: data.name, version: data.version };
  } catch {
    return null;
  }
}

export interface TargetState {
  exists: boolean;
  /** Names inside the folder (empty when it does not exist). */
  entries: readonly string[];
  /** Name in the folder's manifest.json, when there is a readable one. */
  manifestName: string | undefined;
}

export type TargetDecision = "create" | "fresh-empty" | "replace-old-install" | "refuse-foreign";

export function decideTarget(state: TargetState): TargetDecision {
  if (!state.exists) return "create";
  if (state.entries.length === 0) return "fresh-empty";
  return state.manifestName === EXTENSION_NAME ? "replace-old-install" : "refuse-foreign";
}

export interface InstallSummary {
  version: string;
  dir: string;
  steps: string[];
}

export const BROWSER_PAGES = ["chrome://extensions", "opera://extensions", "edge://extensions", "brave://extensions"];

export function buildSteps(dir: string): string[] {
  return [
    `Open your browser's extensions page: type chrome://extensions in the address bar (Opera: opera://extensions, Edge: edge://extensions, Brave: brave://extensions).`,
    `Turn on "Developer mode" (the switch in the top-right corner of that page).`,
    `Click "Load unpacked" and choose this folder: ${dir}`,
  ];
}

export const WHY_MANUAL =
  "Browsers do not let tools click \"Load unpacked\" for you, so these three clicks are yours.";

export function updateNote(): string {
  return `Updating later: run ${RUN} extension again, then click the reload button (the circular arrow) on the Phone Sim card in the extensions page.`;
}

export function formatInstalled(summary: InstallSummary): string {
  const numbered = summary.steps.map((step, index) => `  ${index + 1}. ${step}`).join("\n");
  return [
    `Phone Sim extension v${summary.version} is ready in:`,
    `  ${summary.dir}`,
    "",
    "Add it to your browser (about a minute):",
    numbered,
    "",
    WHY_MANUAL,
    updateNote(),
  ].join("\n");
}
