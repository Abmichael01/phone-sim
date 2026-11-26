import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseCli } from "./args";
import {
  buildSteps,
  checkEntries,
  decideTarget,
  formatInstalled,
  isSafeEntryPath,
  parseDigest,
  parseManifest,
  pickAsset,
  verifyDigest,
  versionFromAssetName,
} from "./extension";

const asset = (name: string, extra: Record<string, unknown> = {}) => ({ name, browser_download_url: `https://example.test/${name}`, ...extra });

describe("pickAsset", () => {
  it("picks the extension zip and ignores other files", () => {
    const result = pickAsset({ tag_name: "v0.4.0", assets: [asset("source.zip"), asset("phone-sim-extension-v0.4.0.zip", { digest: "sha256:ab" })] });
    expect(result).toMatchObject({ ok: true, tag: "v0.4.0", asset: { name: "phone-sim-extension-v0.4.0.zip", digest: "sha256:ab" } });
  });

  it("reports a release with no matching asset", () => {
    expect(pickAsset({ assets: [asset("phone-sim-extension-latest.zip"), asset("notes.txt")] })).toEqual({ ok: false, reason: "no-asset" });
    expect(pickAsset({ assets: [] })).toEqual({ ok: false, reason: "no-asset" });
  });

  it("rejects answers that are not a release", () => {
    expect(pickAsset(null)).toEqual({ ok: false, reason: "invalid" });
    expect(pickAsset({ message: "Not Found" })).toEqual({ ok: false, reason: "invalid" });
  });

  it("reads the version from the asset name", () => {
    expect(versionFromAssetName("phone-sim-extension-v1.20.3.zip")).toBe("1.20.3");
    expect(versionFromAssetName("other.zip")).toBeNull();
  });
});

describe("digest", () => {
  const bytes = new TextEncoder().encode("hello");
  const hex = createHash("sha256").update(bytes).digest("hex");

  it("parses sha256 digests only", () => {
    expect(parseDigest(`sha256:${hex.toUpperCase()}`)).toBe(hex);
    expect(parseDigest("sha1:abc")).toBeNull();
    expect(parseDigest("sha256:short")).toBeNull();
    expect(parseDigest(undefined)).toBeNull();
  });

  it("verifies matches, mismatches and missing digests", () => {
    expect(verifyDigest(bytes, `sha256:${hex}`)).toBe("ok");
    expect(verifyDigest(bytes, `sha256:${"0".repeat(64)}`)).toBe("mismatch");
    expect(verifyDigest(bytes, undefined)).toBe("not-provided");
  });
});

describe("zip entry safety", () => {
  it("accepts normal relative paths", () => {
    for (const path of ["manifest.json", "icons/icon-16.png", "assets/a.b.js", "dir/"]) expect(isSafeEntryPath(path)).toBe(true);
  });

  it("rejects absolute paths, parent folders and drive letters", () => {
    for (const path of ["/etc/passwd", "../evil", "a/../../evil", "a\\..\\evil", "C:\\x", "c:/x", "\\\\server\\share", "", "a\0b"]) {
      expect(isSafeEntryPath(path)).toBe(false);
    }
  });

  it("requires manifest.json at the root and safe names", () => {
    expect(checkEntries([{ name: "manifest.json", size: 10 }])).toEqual({ ok: true });
    expect(checkEntries([{ name: "wrapper/manifest.json", size: 10 }])).toMatchObject({ ok: false });
    expect(checkEntries([{ name: "manifest.json", size: 1 }, { name: "../x", size: 1 }])).toMatchObject({ ok: false });
    expect(checkEntries([])).toMatchObject({ ok: false });
    expect(checkEntries([{ name: "manifest.json", size: 1e9 }])).toMatchObject({ ok: false });
  });

  it("only trusts a manifest named Phone Sim", () => {
    expect(parseManifest('{"name":"Phone Sim","version":"0.4.0"}')).toEqual({ name: "Phone Sim", version: "0.4.0" });
    expect(parseManifest('{"name":"Other","version":"1"}')).toBeNull();
    expect(parseManifest("not json")).toBeNull();
  });
});

describe("decideTarget", () => {
  it("creates a missing folder and reuses an empty one", () => {
    expect(decideTarget({ exists: false, entries: [], manifestName: undefined })).toBe("create");
    expect(decideTarget({ exists: true, entries: [], manifestName: undefined })).toBe("fresh-empty");
  });

  it("replaces an older Phone Sim install", () => {
    expect(decideTarget({ exists: true, entries: ["manifest.json", "icons"], manifestName: "Phone Sim" })).toBe("replace-old-install");
  });

  it("refuses a folder that is not a Phone Sim install", () => {
    expect(decideTarget({ exists: true, entries: ["notes.txt"], manifestName: undefined })).toBe("refuse-foreign");
    expect(decideTarget({ exists: true, entries: ["manifest.json"], manifestName: undefined })).toBe("refuse-foreign");
  });
});

describe("wording and args", () => {
  it("shows the folder in the steps and the output", () => {
    const steps = buildSteps("/home/me/phone-sim-extension");
    expect(steps).toHaveLength(3);
    expect(steps[2]).toContain("/home/me/phone-sim-extension");
    const text = formatInstalled({ version: "0.4.0", dir: "/home/me/phone-sim-extension", steps });
    expect(text).toContain("v0.4.0");
    expect(text).toContain("Load unpacked");
    expect(text).toContain("reload");
  });

  it("parses extension options", () => {
    expect(parseCli(["extension"])).toEqual({ ok: true, value: { command: "extension", options: { dir: undefined, json: false, open: false, debug: false } } });
    expect(parseCli(["extension", "--dir", "/tmp/x", "--json", "--open"])).toEqual({
      ok: true,
      value: { command: "extension", options: { dir: "/tmp/x", json: true, open: true, debug: false } },
    });
  });

  it("rejects bad extension arguments", () => {
    expect(parseCli(["extension", "--bogus"])).toMatchObject({ ok: false });
    expect(parseCli(["extension", "--dir"])).toMatchObject({ ok: false });
    expect(parseCli(["extension", "--dir", " "])).toMatchObject({ ok: false });
    expect(parseCli(["extension", "extra"])).toMatchObject({ ok: false });
  });
});
