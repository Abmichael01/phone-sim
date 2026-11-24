import { describe, expect, it } from "vitest";
import { reportSchema, VIEWPORT_NOTE, type DeviceReport, type Issue, type Report } from "./issues";
import { COLOR, deviceHeader, escapeHtml, formatHuman, issueLine, pickStyle, PLAIN, SECTION_LIMIT, toHtml, toMarkdown } from "./report";

const overflow: Issue = {
  number: 1,
  rule: "horizontal-overflow",
  severity: "error",
  selector: "div.hero > img",
  group: "div.hero > img",
  examples: [],
  message: "sticks out 118px past the right edge",
  hint: "Use max-width: 100%.",
  detail: "",
  rect: { x: 0, y: 10, width: 520, height: 200 },
  rects: [{ x: 0, y: 10, width: 520, height: 200 }],
  count: 1,
  onAllDevices: false,
};

const smallText: Issue = {
  ...overflow,
  number: 2,
  rule: "small-text",
  severity: "warn",
  selector: "p.legal",
  group: "footer > p.legal",
  message: "text is 10px, below the 12px minimum",
  hint: "Use at least 12px.",
  detail: "<script>alert(1)</script>",
};

const note: Issue = { ...overflow, number: 3, rule: "image-oversize", severity: "info", selector: "img", group: "main > img", message: "is too big", hint: "Smaller file." };

function device(issues: Issue[], overrides: Partial<DeviceReport> = {}): DeviceReport {
  return {
    id: "iphone-16-pro",
    name: "iPhone 16 Pro",
    viewport: { width: 402, height: 874 },
    dpr: 3,
    orientation: "portrait",
    status: 200,
    screenshot: "/tmp/out/iphone-16-pro.png",
    rawScreenshot: "/tmp/out/iphone-16-pro-raw.png",
    issues,
    omitted: { errors: 0, warnings: 0, infos: 0 },
    ...overrides,
  };
}

function report(devices: DeviceReport[], summary = { errors: 1, warnings: 1, infos: 0 }): Report {
  return {
    url: "http://localhost:3000/",
    checkedAt: "2026-11-24T12:00:00.000Z",
    tool: { name: "phone-sim", version: "0.4.0" },
    outDir: "/tmp/out",
    reportHtml: "/tmp/out/report.html",
    viewportNote: VIEWPORT_NOTE,
    devices,
    summary,
  };
}

const pixel = (issues: Issue[]) => device(issues, { id: "pixel-9", name: "Pixel 9", viewport: { width: 412, height: 923 }, dpr: 2.625 });

describe("terminal output", () => {
  it("formats the device header and numbered issues", () => {
    expect(deviceHeader(device([overflow, smallText]))).toBe("iPhone 16 Pro  402×874 @3x  ✖ 1 error  ⚠ 1 warning");
    expect(deviceHeader(device([]))).toBe("iPhone 16 Pro  402×874 @3x  ✓ no problems");
    expect(issueLine(overflow)).toBe("1. ✖ horizontal-overflow  div.hero > img  sticks out 118px past the right edge");
  });

  it("marks landscape and fractional pixel ratios", () => {
    expect(deviceHeader(device([], { orientation: "landscape", viewport: { width: 874, height: 402 }, dpr: 2.625 }))).toBe(
      "iPhone 16 Pro landscape  874×402 @2.625x  ✓ no problems",
    );
  });

  it("ends with totals, a fix line per issue and the report path", () => {
    const text = formatHuman(report([device([overflow, smallText])]));
    expect(text).toContain("     Fix: Use max-width: 100%.");
    expect(text).toContain("Checked 1 device: ✖ 1 error  ⚠ 1 warning");
    expect(text.endsWith("Report: /tmp/out/report.html")).toBe(true);
  });

  it("says clearly when the page is clean", () => {
    const text = formatHuman(report([device([]), pixel([])], { errors: 0, warnings: 0, infos: 0 }));
    expect(text).toContain("✓ No responsive problems found on 2 devices");
  });

  it("lists issues found on every device once, then only what differs", () => {
    const shared = { ...smallText, number: 1, onAllDevices: true };
    const text = formatHuman(
      report([device([shared, { ...overflow, number: 2 }]), pixel([shared])], { errors: 1, warnings: 2, infos: 0 }),
    );
    const lines = text.split("\n");
    expect(lines[0]).toBe("On all 2 devices  ⚠ 1 warning");
    expect(lines.filter((line) => line.includes("small-text"))).toHaveLength(1);
    expect(text).toContain("Pixel 9  412×923 @2.625x  ⚠ 1 warning\n\n");
    expect(text).toContain("2. ✖ horizontal-overflow");
  });

  it("lists an issue shared by some devices once, naming them", () => {
    const tap = { ...smallText, number: 4, rule: "small-tap-target" as const, group: "nav > a", selector: "nav > a" };
    const ipad = device([], { id: "ipad-mini-a17-pro", name: "iPad mini", viewport: { width: 744, height: 1133 }, dpr: 2 });
    const text = formatHuman(report([device([tap]), pixel([tap]), ipad], { errors: 0, warnings: 2, infos: 0 }));
    expect(text.startsWith("On 2 devices: iPhone 16 Pro, Pixel 9  ⚠ 1 warning\n  4. ⚠ small-tap-target")).toBe(true);
    expect(text.split("small-tap-target")).toHaveLength(2);
  });

  it("shows at most 10 issues per section and each fix hint once", () => {
    const many = Array.from({ length: 14 }, (_, index) => ({ ...smallText, number: index + 1, selector: `p.n${index}` }));
    const text = formatHuman(report([device(many)], { errors: 0, warnings: 14, infos: 0 }));
    expect(text.split("\n").filter((line) => line.includes("⚠ small-text"))).toHaveLength(SECTION_LIMIT);
    expect(text).toContain("  … and 4 more, see report.html");
    expect(text.split("Fix: Use at least 12px.")).toHaveLength(2);
    const everything = formatHuman(report([device(many)], { errors: 0, warnings: 14, infos: 0 }), PLAIN, { all: true });
    expect(everything.split("\n").filter((line) => line.includes("⚠ small-text"))).toHaveLength(14);
  });

  it("hides notes unless --all, but still counts them", () => {
    const text = formatHuman(report([device([note])], { errors: 0, warnings: 0, infos: 1 }));
    expect(text).not.toContain("image-oversize");
    expect(text).toContain("1 note (44px tap targets, large images) not shown: add --all or open the report.");
    expect(formatHuman(report([device([note])], { errors: 0, warnings: 0, infos: 1 }), PLAIN, { all: true })).toContain("ℹ image-oversize");
  });

  it("warns when the page itself answered with an HTTP error", () => {
    const text = formatHuman(report([device([], { status: 500 })], { errors: 0, warnings: 0, infos: 0 }));
    expect(text).toContain("⚠ The page answered HTTP 500, so this checked an error page.");
    expect(text).toContain("run: npx phone-sim check http://localhost:3000/");
  });

  it("uses colours only on a terminal without NO_COLOR", () => {
    expect(pickStyle(true, {})).toBe(COLOR);
    expect(pickStyle(false, {})).toBe(PLAIN);
    expect(pickStyle(true, { NO_COLOR: "1" })).toBe(PLAIN);
    expect(formatHuman(report([device([overflow])]), PLAIN)).not.toContain("\u001b[");
  });
});

describe("markdown and html", () => {
  it("links images relative to the report folder", () => {
    const markdown = toMarkdown(report([device([overflow])]));
    expect(markdown).toContain("![iPhone 16 Pro](iphone-16-pro.png)");
    expect(markdown).toContain("1. **error** `horizontal-overflow` `div.hero > img`: sticks out 118px past the right edge");
  });

  it("puts shared issues in their own section and lists group examples", () => {
    const shared = { ...smallText, number: 1, onAllDevices: true, count: 4, examples: ["#a", "#b", "#c"] };
    const both = report([device([shared]), pixel([shared])]);
    const markdown = toMarkdown(both);
    expect(markdown).toContain("## On all 2 devices");
    expect(markdown).toContain("Examples: `#a`, `#b`, `#c`");
    expect(markdown.split("`small-text`")).toHaveLength(2);
    const html = toHtml(both);
    expect(html).toContain("On all 2 devices");
    expect(html).toContain("plus 1 shared issue above");
  });

  it("escapes page text in the HTML report", () => {
    const html = toHtml(report([device([overflow, smallText])]));
    expect(html).toContain('src="iphone-16-pro.png"');
    expect(html).toContain('href="iphone-16-pro-raw.png"');
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain(escapeHtml("<script>alert(1)</script>"));
    expect(html).not.toMatch(/<script[\s>]/);
  });

  it("the report shape passes the schema", () => {
    expect(reportSchema.safeParse(report([device([overflow, smallText])])).success).toBe(true);
    expect(reportSchema.safeParse({ ...report([]), summary: { errors: -1, warnings: 0, infos: 0 } }).success).toBe(false);
  });
});
