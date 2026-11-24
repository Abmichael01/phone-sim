import { describe, expect, it } from "vitest";
import { parseCli } from "./args";

function check(argv: string[]) {
  const result = parseCli(argv);
  if (!result.ok || result.value.command !== "check") throw new Error(`expected check, got ${JSON.stringify(result)}`);
  return result.value.options;
}

function error(argv: string[]): string {
  const result = parseCli(argv);
  if (result.ok) throw new Error(`expected an error for ${argv.join(" ")}`);
  return result.message;
}

describe("parseCli", () => {
  it("shows help with no command, help or --help", () => {
    for (const argv of [[], ["help"], ["--help"], ["-h"], ["check", "--help"]]) {
      expect(parseCli(argv)).toEqual({ ok: true, value: { command: "help" } });
    }
  });

  it("prints the version", () => {
    expect(parseCli(["--version"])).toEqual({ ok: true, value: { command: "version" } });
  });

  it("uses the documented defaults for check", () => {
    expect(check(["check"])).toEqual({
      url: undefined,
      devices: undefined,
      preset: undefined,
      landscape: false,
      fullPage: false,
      wait: 500,
      timeout: 30000,
      out: "phone-sim-report",
      json: false,
      frame: true,
      annotate: true,
      failOn: "error",
      open: false,
      all: false,
      debug: false,
    });
    expect(check(["check", "--all"]).all).toBe(true);
  });

  it("reads every check option", () => {
    const options = check([
      "check",
      "localhost:5173",
      "--devices",
      "iphone-16-pro, Pixel-9",
      "--landscape",
      "--full-page",
      "--wait",
      "0",
      "--timeout",
      "60000",
      "--out",
      "shots",
      "--json",
      "--no-frame",
      "--no-annotate",
      "--fail-on",
      "warn",
      "--open",
      "--debug",
    ]);
    expect(options).toMatchObject({
      url: "localhost:5173",
      devices: ["iphone-16-pro", "pixel-9"],
      landscape: true,
      fullPage: true,
      wait: 0,
      timeout: 60000,
      out: "shots",
      json: true,
      frame: false,
      annotate: false,
      failOn: "warn",
      open: true,
      debug: true,
    });
  });

  it("treats a bare URL, port or option as an implied check", () => {
    expect(check(["3000"]).url).toBe("3000");
    expect(check(["localhost:5173", "--json"]).url).toBe("localhost:5173");
    expect(check(["--json"]).json).toBe(true);
  });

  it("parses devices and init commands", () => {
    expect(parseCli(["devices", "--search", "pixel", "--json"])).toEqual({
      ok: true,
      value: { command: "devices", options: { search: "pixel", json: true } },
    });
    expect(parseCli(["init", "--dry-run"])).toEqual({ ok: true, value: { command: "init", options: { dryRun: true, debug: false } } });
  });

  it("rejects bad input with a short message", () => {
    expect(error(["deploy"])).toBe('Unknown command "deploy".');
    expect(error(["check", "--colour"])).toBe("Unknown option --colour.");
    expect(error(["check", "--preset", "tablets"])).toContain("--preset must be one of: common, phones, all-sizes");
    expect(error(["check", "--fail-on", "sometimes"])).toBe("--fail-on must be error, warn or never.");
    expect(error(["check", "--wait=-5"])).toContain("--wait must be a whole number");
    expect(error(["check", "--wait", "-5"])).toContain("--wait needs a value");
    expect(error(["check", "--out"])).toContain("--out needs a value");
    expect(error(["check", "--timeout", "abc"])).toContain("--timeout must be a whole number");
    expect(error(["check", "--devices", "pixel-9", "--preset", "phones"])).toBe("Use either --devices or --preset, not both.");
    expect(error(["check", "--devices", " , "])).toBe("--devices needs at least one device id.");
    expect(error(["check", "a.com", "b.com"])).toContain("Give one URL");
  });

  it("remembers --debug even when parsing fails", () => {
    const result = parseCli(["check", "--nope", "--debug"]);
    expect(result).toMatchObject({ ok: false, debug: true });
  });
});
