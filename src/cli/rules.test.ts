import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser } from "playwright";
import { afterAll, describe, expect, it } from "vitest";
import { collectIssues, hasViewportFitCover, type RawIssue, type RuleOptions } from "./rules";
import { setSafeArea } from "./run";

/**
 * The rules run inside a real headless page. Skipped (not failed) when the
 * Playwright browser is not downloaded on this machine.
 */
let browser: Browser | null = null;
try {
  browser = await chromium.launch({ headless: true });
} catch {
  browser = null;
}

afterAll(async () => {
  await browser?.close();
});

const fixture = (name: string) => readFileSync(join(process.cwd(), "fixtures/responsive", name), "utf8");

const IPHONE: RuleOptions = { ios: true, desktopClass: false, dpr: 3, checkSafeArea: true, maxOverflow: 10 };

async function run(html: string, options: RuleOptions = IPHONE, width = 402, height = 874): Promise<RawIssue[]> {
  if (!browser) throw new Error("no browser");
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: options.dpr, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    // As in a real run: env(safe-area-inset-*) reports the notch.
    await setSafeArea(await context.newCDPSession(page), { top: 54, bottom: 34, left: 0, right: 0 });
    await page.setContent(html, { waitUntil: "load" });
    return await page.evaluate(collectIssues, options);
  } finally {
    await context.close();
  }
}

const rules = (issues: RawIssue[]) => new Set(issues.map((issue) => issue.rule));

describe.skipIf(!browser)("collectIssues in a headless page", () => {
  it("finds every problem in bad.html", async () => {
    const issues = await run(fixture("bad.html"));
    for (const rule of ["horizontal-overflow", "small-tap-target", "small-text", "ios-input-zoom", "text-clipped", "safe-area", "image-oversize"]) {
      expect(rules(issues), rule).toContain(rule);
    }
    const overflow = issues.filter((issue) => issue.rule === "horizontal-overflow");
    expect(overflow.map((issue) => issue.selector)).toEqual(["body > main > div.promo"]);
    expect(overflow[0]?.message).toMatch(/^sticks out \d+px past the right edge/);
    // The inline link in running text is exempt; the code block scrolls inside its own box.
    expect(issues.some((issue) => issue.selector.includes("pre"))).toBe(false);
    expect(issues.some((issue) => issue.detail.startsWith("terms and conditions"))).toBe(false);
  });

  it("finds nothing to fix in good.html", async () => {
    const issues = await run(fixture("good.html"));
    expect(issues.filter((issue) => issue.severity !== "info")).toEqual([]);
  });

  it("finds nothing to fix in a long article with footnotes, inline links and sr-only text", async () => {
    const issues = await run(fixture("article.html"));
    expect(issues.filter((issue) => issue.severity !== "info")).toEqual([]);
  });

  it("exempts links inside running text, also through inline wrappers, but not a nav of tiny links", async () => {
    const meta = '<meta name="viewport" content="width=device-width">';
    const prose = await run(
      `${meta}<p style="font-size:16px">A sentence about Lagos<sup><a href="#1">[1]</a></sup> with an <em><a href="#2">emphasised link</a></em> inside it.</p>`,
    );
    expect(prose.filter((issue) => issue.rule === "small-tap-target")).toEqual([]);
    const pager = await run(`${meta}<div class="pager" style="font-size:12px"><a href="#1">1</a> <a href="#2">2</a> <a href="#3">3</a></div>`);
    const taps = pager.filter((issue) => issue.rule === "small-tap-target" && issue.severity === "warn");
    expect(taps).toHaveLength(3);
    expect(new Set(taps.map((issue) => issue.groupKey))).toEqual(new Set(["div.pager > a"]));
  });

  it("applies the WCAG spacing exception to a small target with room around it", async () => {
    const issues = await run('<meta name="viewport" content="width=device-width"><button style="width:16px;height:16px;margin:40px"></button>');
    expect(issues.map((issue) => [issue.rule, issue.severity])).toEqual([["small-tap-target", "info"]]);
  });

  it("ignores screen-reader-only elements in every rule", async () => {
    const issues = await run(
      '<meta name="viewport" content="width=device-width"><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;font-size:8px">Skip to the main content of this page</span><div style="clip-path:inset(50%);position:absolute;width:1px;height:1px;overflow:hidden"><a href="#x" style="font-size:9px">tiny</a></div>',
    );
    expect(issues).toEqual([]);
  });

  it("does not report text inside sup or sub as small", async () => {
    const issues = await run('<meta name="viewport" content="width=device-width"><p>Water is H<sub style="font-size:9px">2</sub>O<sup style="font-size:9px">note</sup></p>');
    expect(issues.filter((issue) => issue.rule === "small-text")).toEqual([]);
  });

  it("groups by shape, not by id", async () => {
    const issues = await run(
      '<meta name="viewport" content="width=device-width"><ul class="tags"><li><button id="t1" style="width:16px;height:16px"></button></li><li><button id="t2" style="width:16px;height:16px"></button></li></ul>',
    );
    expect(issues.map((issue) => [issue.selector, issue.groupKey])).toEqual([
      ["#t1", "li > button"],
      ["#t2", "li > button"],
    ]);
  });

  it("flags a missing viewport tag and big fixed banners", async () => {
    const issues = await run('<p>Hi</p><div style="position:fixed;inset:auto 0 0 0;height:60vh;background:#fff">Cookies</div>');
    expect(rules(issues)).toContain("viewport-meta");
    expect(rules(issues)).toContain("fixed-covers-screen");
  });

  it("skips iOS-only and notch rules on other devices", async () => {
    const issues = await run(fixture("bad.html"), { ios: false, desktopClass: false, dpr: 2.625, checkSafeArea: false, maxOverflow: 10 }, 412, 923);
    expect(rules(issues)).not.toContain("ios-input-zoom");
    expect(rules(issues)).not.toContain("safe-area");
  });

  it("detects viewport-fit=cover", async () => {
    if (!browser) return;
    const page = await browser.newPage();
    await page.setContent(fixture("good.html"));
    expect(await page.evaluate(hasViewportFitCover)).toBe(true);
    await page.close();
  });
});
