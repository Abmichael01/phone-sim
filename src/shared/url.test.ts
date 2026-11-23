import { describe, expect, it } from "vitest";
import { isWebUrl, normalizeUrl, simulatorPagePath } from "./url";

describe("normalizeUrl", () => {
  it("adds https:// to bare hosts", () => {
    expect(normalizeUrl(" example.com/path?q=1 ")).toEqual({ ok: true, url: "https://example.com/path?q=1" });
  });

  it("adds http:// to local hosts", () => {
    expect(normalizeUrl("localhost:5173")).toEqual({ ok: true, url: "http://localhost:5173/" });
    expect(normalizeUrl("127.0.0.1:8000/admin")).toEqual({ ok: true, url: "http://127.0.0.1:8000/admin" });
  });

  it("keeps explicit http(s) URLs", () => {
    expect(normalizeUrl("http://example.org")).toEqual({ ok: true, url: "http://example.org/" });
  });

  it("rejects browser pages and other schemes", () => {
    for (const input of ["chrome://settings", "opera://extensions", "about:blank", "javascript:alert(1)", "file:///etc/hosts"]) {
      expect(normalizeUrl(input)).toEqual({ ok: false, problem: "unsupported" });
    }
  });

  it("rejects empty input and words that are not hosts", () => {
    expect(normalizeUrl("   ")).toEqual({ ok: false, problem: "empty" });
    expect(normalizeUrl("hello world")).toEqual({ ok: false, problem: "invalid" });
    expect(normalizeUrl("hello")).toEqual({ ok: false, problem: "invalid" });
  });
});

describe("isWebUrl and simulatorPagePath", () => {
  it("accepts only http(s)", () => {
    expect(isWebUrl("https://a.b/")).toBe(true);
    expect(isWebUrl("chrome://newtab")).toBe(false);
    expect(isWebUrl(undefined)).toBe(false);
    expect(isWebUrl("not a url")).toBe(false);
  });

  it("encodes the target URL", () => {
    expect(simulatorPagePath("https://a.b/?x=1&y=2")).toBe("simulator.html?url=https%3A%2F%2Fa.b%2F%3Fx%3D1%26y%3D2");
    expect(simulatorPagePath(null)).toBe("simulator.html");
  });
});
