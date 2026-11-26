import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { unzipSync } from "fflate";
import { RUN } from "./command";
import {
  checkEntries,
  decideTarget,
  EXTENSION_NAME,
  MAX_DOWNLOAD_BYTES,
  parseManifest,
  pickAsset,
  RELEASE_API,
  RELEASES_PAGE,
  verifyDigest,
  type ReleaseAsset,
  type TargetState,
} from "./extension";
import { CheckError } from "./run";

/** Network and disk side effects of `phone-sim extension`. */

const retry = `Check your internet connection, then run ${RUN} extension again. Or download the zip yourself: ${RELEASES_PAGE}`;

function releaseApiUrl(): string {
  // Hidden override so the whole flow can be tested against a local server.
  return process.env.PHONE_SIM_RELEASE_API || RELEASE_API;
}

export async function fetchLatestAsset(): Promise<ReleaseAsset> {
  let response: Response;
  try {
    response = await fetch(releaseApiUrl(), {
      headers: { "User-Agent": "phone-sim-cli", Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    throw new CheckError("Could not reach GitHub to find the latest Phone Sim extension.", retry, String(error));
  }
  if (response.status === 404) {
    throw new CheckError("There is no Phone Sim extension release yet.", `Build it from source instead (see the README), or check ${RELEASES_PAGE} later.`);
  }
  if (response.status === 403 || response.status === 429) {
    throw new CheckError("GitHub is limiting requests from this network right now.", `Wait a few minutes and run ${RUN} extension again, or download the zip in your browser: ${RELEASES_PAGE}`);
  }
  if (!response.ok) {
    throw new CheckError(`GitHub answered with an error (${response.status}).`, retry);
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new CheckError("GitHub sent an answer that could not be read.", retry);
  }
  const picked = pickAsset(json);
  if (!picked.ok) {
    throw new CheckError(
      picked.reason === "no-asset" ? "The latest release has no extension zip attached." : "GitHub sent an unexpected answer.",
      `Download or build it another way: ${RELEASES_PAGE}`,
    );
  }
  return picked.asset;
}

export async function downloadAsset(asset: ReleaseAsset): Promise<Uint8Array> {
  const tooBig = new CheckError("The extension download is bigger than expected, so it was stopped.", `Download the zip in your browser instead: ${RELEASES_PAGE}`);
  try {
    const response = await fetch(asset.url, { headers: { "User-Agent": "phone-sim-cli" }, signal: AbortSignal.timeout(120_000) });
    if (!response.ok || !response.body) throw new CheckError(`The extension download failed (${response.status}).`, retry);
    if (Number(response.headers.get("content-length") ?? 0) > MAX_DOWNLOAD_BYTES) throw tooBig;
    const chunks: Uint8Array[] = [];
    let total = 0;
    for await (const chunk of response.body) {
      total += chunk.length;
      if (total > MAX_DOWNLOAD_BYTES) throw tooBig;
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    if (error instanceof CheckError) throw error;
    throw new CheckError("The extension download was interrupted.", retry, String(error));
  }
}

export function verifyDownload(bytes: Uint8Array, asset: ReleaseAsset): void {
  if (verifyDigest(bytes, asset.digest) === "mismatch") {
    throw new CheckError("The downloaded file does not match GitHub's checksum, so it was not installed.", `Run ${RUN} extension again. If it keeps failing, download the zip in your browser: ${RELEASES_PAGE}`);
  }
}

/** Reads what is in the target folder, without changing anything. */
export function readTargetState(dir: string): TargetState {
  if (!existsSync(dir)) return { exists: false, entries: [], manifestName: undefined };
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    // A file, or a folder we cannot read: treat as not ours.
    return { exists: true, entries: ["?"], manifestName: undefined };
  }
  let manifestName: string | undefined;
  try {
    manifestName = parseManifest(readFileSync(join(dir, "manifest.json"), "utf8"))?.name;
  } catch {
    manifestName = undefined;
  }
  return { exists: true, entries, manifestName };
}

export function assertTargetUsable(dir: string): void {
  if (decideTarget(readTargetState(dir)) === "refuse-foreign") {
    throw new CheckError(`The folder ${dir} already exists and is not a Phone Sim install, so it was left alone.`, `Pick another folder: ${RUN} extension --dir <path>`);
  }
}

/** Unzips into a temp folder next to `dir`, then swaps it in, so a failure never leaves a half-installed folder. */
export function installZip(bytes: Uint8Array, dir: string): string {
  const table: { name: string; size: number }[] = [];
  try {
    unzipSync(bytes, {
      filter: (file) => {
        table.push({ name: file.name, size: file.originalSize });
        return false;
      },
    });
  } catch (error) {
    throw new CheckError("The downloaded file is not a valid zip.", `Run ${RUN} extension again.`, String(error));
  }
  const checked = checkEntries(table);
  if (!checked.ok) throw new CheckError(checked.message, `Download the zip in your browser instead: ${RELEASES_PAGE}`);

  const files = unzipSync(bytes);
  const manifestBytes = files["manifest.json"];
  const manifest = manifestBytes ? parseManifest(Buffer.from(manifestBytes).toString("utf8")) : null;
  if (!manifest) {
    throw new CheckError(`The downloaded zip's manifest.json is not a "${EXTENSION_NAME}" extension.`, `Download the zip in your browser instead: ${RELEASES_PAGE}`);
  }

  const target = resolve(dir);
  const temp = `${target}.tmp-${process.pid}`;
  const old = `${target}.old-${process.pid}`;
  rmSync(temp, { recursive: true, force: true });
  try {
    mkdirSync(temp, { recursive: true });
    for (const [name, data] of Object.entries(files)) {
      if (name.endsWith("/")) continue;
      const destination = resolve(temp, name);
      if (!destination.startsWith(temp + sep)) throw new CheckError("The downloaded zip has an unsafe file path.", `Download the zip in your browser instead: ${RELEASES_PAGE}`);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, data);
    }
    const hadOld = existsSync(target);
    if (hadOld) renameSync(target, old);
    try {
      mkdirSync(dirname(target), { recursive: true });
      renameSync(temp, target);
    } catch (error) {
      if (hadOld) renameSync(old, target);
      throw error;
    }
    rmSync(old, { recursive: true, force: true });
  } catch (error) {
    rmSync(temp, { recursive: true, force: true });
    if (error instanceof CheckError) throw error;
    throw new CheckError(`Could not write the extension to ${target}.`, `Pick another folder: ${RUN} extension --dir <path>`, String(error));
  }
  return manifest.version;
}

