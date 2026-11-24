import { describe, expect, it } from "vitest";
import { DEV_PORTS, findDevServer, normalizeTarget } from "./target";

const url = (input: string) => {
  const result = normalizeTarget(input, "/work/site", "/home/me");
  if (!result.ok) throw new Error(result.message);
  return result.url;
};

describe("normalizeTarget", () => {
  it("turns a port into a localhost URL", () => {
    expect(url("3000")).toBe("http://localhost:3000/");
    expect(url(":5173")).toBe("http://localhost:5173/");
  });

  it("adds http:// for local hosts and https:// for the web", () => {
    expect(url("localhost:5173")).toBe("http://localhost:5173/");
    expect(url("localhost:5173/shop?x=1")).toBe("http://localhost:5173/shop?x=1");
    expect(url("127.0.0.1:8000")).toBe("http://127.0.0.1:8000/");
    expect(url("myapp.localhost:3000")).toBe("http://myapp.localhost:3000/");
    expect(url("192.168.1.20:3000")).toBe("http://192.168.1.20:3000/");
    expect(url("example.com")).toBe("https://example.com/");
    expect(url("localhost.example.com")).toBe("https://localhost.example.com/");
  });

  it("treats host/…/page.html as a URL, not a file", () => {
    expect(url("localhost:4399/bad.html")).toBe("http://localhost:4399/bad.html");
    expect(url("localhost/bad.html")).toBe("http://localhost/bad.html");
    expect(url("example.com/page.html")).toBe("https://example.com/page.html");
    expect(url("bad.html")).toBe("file:///work/site/bad.html");
  });

  it("keeps full URLs", () => {
    expect(url("http://localhost:3000/about")).toBe("http://localhost:3000/about");
    expect(url("https://example.com/a")).toBe("https://example.com/a");
  });

  it("turns paths into file URLs", () => {
    expect(normalizeTarget("./index.html", "/work/site")).toEqual({ ok: true, url: "file:///work/site/index.html", kind: "file" });
    expect(url("fixtures/bad.html")).toBe("file:///work/site/fixtures/bad.html");
    expect(url("/tmp/page.html")).toBe("file:///tmp/page.html");
    expect(url("~/page.html")).toBe("file:///home/me/page.html");
  });

  it("rejects what it cannot check", () => {
    expect(normalizeTarget("", "/")).toMatchObject({ ok: false });
    expect(normalizeTarget("99999", "/")).toMatchObject({ ok: false });
    expect(normalizeTarget("ftp://example.com", "/")).toMatchObject({ ok: false });
    expect(normalizeTarget("http://", "/")).toMatchObject({ ok: false });
  });
});

describe("findDevServer", () => {
  it("returns the first answering port in the documented order", async () => {
    const open = new Set([8080, 5173]);
    expect(await findDevServer(async (port) => open.has(port))).toBe(5173);
  });

  it("returns null when nothing answers, and treats probe errors as closed", async () => {
    expect(await findDevServer(async () => false)).toBeNull();
    expect(await findDevServer(async () => Promise.reject(new Error("boom")))).toBeNull();
  });

  it("probes every common port", async () => {
    const probed: number[] = [];
    await findDevServer(async (port) => {
      probed.push(port);
      return false;
    });
    expect(probed.sort((a, b) => a - b)).toEqual([...DEV_PORTS].sort((a, b) => a - b));
    expect(DEV_PORTS).toEqual([3000, 5173, 4321, 8080, 8000, 4200, 3001]);
  });
});
