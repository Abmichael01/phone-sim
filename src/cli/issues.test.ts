import { describe, expect, it } from "vitest";
import {
  alignAcrossDevices,
  capIssues,
  capReport,
  exitCodeFor,
  groupIssues,
  issueKey,
  MAX_BOXES,
  NO_CAP,
  JSON_CAP,
  RULE_HINTS,
  ruleIdSchema,
  summarize,
  type Issue,
  type Report,
} from "./issues";
import type { RawIssue } from "./rules";

function raw(overrides: Partial<RawIssue>): RawIssue {
  return {
    rule: "small-text",
    severity: "warn",
    selector: "p.note:nth-of-type(1)",
    groupKey: "p.note",
    message: "text is 10px, below the 12px minimum",
    detail: "Fine print",
    rect: { x: 0, y: 0, width: 100, height: 12 },
    value: 10,
    ...overrides,
  };
}

describe("groupIssues", () => {
  it("numbers issues errors first, then warnings, then notes", () => {
    const issues = groupIssues([
      raw({ rule: "image-oversize", severity: "info", selector: "img", groupKey: "img", value: 4 }),
      raw({}),
      raw({ rule: "horizontal-overflow", severity: "error", selector: "div.hero", groupKey: "div.hero", value: 118 }),
    ]);
    expect(issues.map((issue) => [issue.number, issue.rule])).toEqual([
      [1, "horizontal-overflow"],
      [2, "small-text"],
      [3, "image-oversize"],
    ]);
  });

  it("drops exact duplicates", () => {
    expect(groupIssues([raw({}), raw({})])).toHaveLength(1);
  });

  it("groups look-alike elements, keeps the worst and counts them", () => {
    const issues = groupIssues([
      raw({ selector: "p.note:nth-of-type(1)", value: 11, message: "text is 11px, below the 12px minimum" }),
      raw({ selector: "p.note:nth-of-type(2)", value: 9, message: "text is 9px, below the 12px minimum", rect: { x: 0, y: 40, width: 80, height: 10 } }),
      raw({ selector: "p.note:nth-of-type(3)", value: 10 }),
    ]);
    expect(issues).toHaveLength(1);
    const [issue] = issues;
    expect(issue).toMatchObject({
      selector: "p.note",
      count: 3,
      message: "3 elements: worst text is 9px, below the 12px minimum",
      rect: { x: 0, y: 40, width: 80, height: 10 },
      hint: RULE_HINTS["small-text"],
    });
    expect(issue?.rects).toHaveLength(3);
    expect(issue?.rects[0]).toEqual(issue?.rect);
  });

  it("never merges overflow root causes", () => {
    const issues = groupIssues([
      raw({ rule: "horizontal-overflow", severity: "error", selector: "li:nth-of-type(1)", groupKey: "li", value: 20, message: "a" }),
      raw({ rule: "horizontal-overflow", severity: "error", selector: "li:nth-of-type(2)", groupKey: "li", value: 50, message: "b" }),
    ]);
    expect(issues.map((issue) => issue.message)).toEqual(["b", "a"]);
  });

  it("caps the boxes drawn for a big group", () => {
    const many = Array.from({ length: 40 }, (_, index) => raw({ selector: `a:nth-of-type(${index})`, groupKey: "a", rule: "small-tap-target", value: index }));
    const [issue] = groupIssues(many);
    expect(issue?.count).toBe(40);
    expect(issue?.rects).toHaveLength(MAX_BOXES);
  });

  it("has a hint for every rule", () => {
    for (const rule of ruleIdSchema.options) expect(RULE_HINTS[rule].length).toBeGreaterThan(10);
  });
});

describe("summary and exit code", () => {
  const devices = [{ issues: groupIssues([raw({}), raw({ rule: "image-oversize", severity: "info", groupKey: "img", selector: "img" })]) }];

  it("counts by severity", () => {
    expect(summarize(devices)).toEqual({ errors: 0, warnings: 1, infos: 1 });
  });

  it("follows --fail-on", () => {
    expect(exitCodeFor({ errors: 1, warnings: 0, infos: 0 }, "error")).toBe(1);
    expect(exitCodeFor({ errors: 0, warnings: 3, infos: 0 }, "error")).toBe(0);
    expect(exitCodeFor({ errors: 0, warnings: 3, infos: 0 }, "warn")).toBe(1);
    expect(exitCodeFor({ errors: 0, warnings: 0, infos: 9 }, "warn")).toBe(0);
    expect(exitCodeFor({ errors: 5, warnings: 5, infos: 0 }, "never")).toBe(0);
  });
});

describe("grouping key", () => {
  it("groups footnote links whose selectors are unique ids, keeping 3 examples", () => {
    const footnotes = ["#cite-1", "#cite-2", "#cite-3", "#cite-4", "#cite-5"].map((selector, index) =>
      raw({ rule: "small-tap-target", selector, groupKey: "sup.reference > a", value: 10 + index, message: `is ${10 + index}px` }),
    );
    const issues = groupIssues(footnotes);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      selector: "sup.reference > a",
      group: "sup.reference > a",
      count: 5,
      examples: ["#cite-1", "#cite-2", "#cite-3"],
    });
  });

  it("keeps a single element's own selector and no examples", () => {
    expect(groupIssues([raw({ selector: "#legal" })])[0]).toMatchObject({ selector: "#legal", examples: [], count: 1 });
  });

  it("orders warnings by impact: rule weight, then how many elements are affected", () => {
    const issues = groupIssues([
      raw({ rule: "small-text", groupKey: "a", selector: "a1" }),
      raw({ rule: "small-text", groupKey: "b", selector: "b1" }),
      raw({ rule: "small-text", groupKey: "b", selector: "b2" }),
      raw({ rule: "fixed-covers-screen", groupKey: "div.cookies", selector: "div.cookies", value: 45 }),
    ]);
    expect(issues.map((issue) => `${issue.rule}:${issue.count}`)).toEqual(["fixed-covers-screen:1", "small-text:2", "small-text:1"]);
  });
});

function issue(rule: Issue["rule"], group: string, severity: Issue["severity"] = "warn"): Issue {
  return {
    number: 1,
    rule,
    severity,
    selector: group,
    group,
    examples: [],
    message: "m",
    hint: RULE_HINTS[rule],
    detail: "",
    rect: null,
    rects: [],
    count: 1,
    onAllDevices: false,
  };
}

describe("alignAcrossDevices", () => {
  const text = issue("small-text", "p.legal");
  const tap = issue("small-tap-target", "nav > a");
  const zoom = issue("ios-input-zoom", "label > input");

  it("marks issues found on every device and numbers them the same everywhere", () => {
    const [phone, tablet] = alignAcrossDevices([
      [zoom, tap, text],
      [text, tap],
    ]);
    expect(phone?.map((item) => [item.number, item.rule, item.onAllDevices])).toEqual([
      [1, "small-tap-target", true],
      [2, "small-text", true],
      [3, "ios-input-zoom", false],
    ]);
    expect(tablet?.map((item) => [item.number, item.rule, item.onAllDevices])).toEqual([
      [1, "small-tap-target", true],
      [2, "small-text", true],
    ]);
  });

  it("gives an issue shared by some devices the same number on each", () => {
    const [a, b, c] = alignAcrossDevices([[text, zoom], [text, zoom], [text]]);
    expect(a?.map((item) => [item.number, item.rule, item.onAllDevices])).toEqual([
      [1, "small-text", true],
      [2, "ios-input-zoom", false],
    ]);
    expect(b?.[1]?.number).toBe(2);
    expect(c?.map((item) => item.number)).toEqual([1]);
  });

  it("marks nothing with a single device", () => {
    expect(alignAcrossDevices([[text]])[0]?.[0]?.onAllDevices).toBe(false);
  });

  it("keys overflow by element, other rules by shape", () => {
    expect(issueKey({ ...text, selector: "#x" })).toBe("small-text|warn|p.legal");
    expect(issueKey({ ...issue("horizontal-overflow", "main > div", "error"), selector: "#promo" })).toBe("horizontal-overflow|error|#promo");
  });
});

describe("caps", () => {
  const list = [issue("horizontal-overflow", "a", "error"), issue("small-text", "b"), issue("small-text", "c"), issue("image-oversize", "d", "info")];

  it("keeps the first issues and counts what was left out", () => {
    expect(capIssues(list, { cap: 2, infos: true })).toEqual({ issues: list.slice(0, 2), omitted: { errors: 0, warnings: 1, infos: 1 } });
    expect(capIssues(list, NO_CAP).omitted).toEqual({ errors: 0, warnings: 0, infos: 0 });
  });

  it("leaves notes out of the default JSON but counts them", () => {
    expect(capIssues(list, JSON_CAP)).toEqual({ issues: list.slice(0, 3), omitted: { errors: 0, warnings: 0, infos: 1 } });
    const many = Array.from({ length: 30 }, (_, index) => ({ ...issue("small-text", `g${index}`), number: index + 1 }));
    expect(capIssues(many, JSON_CAP).issues).toHaveLength(25);
    expect(capIssues(many, JSON_CAP).omitted.warnings).toBe(5);
  });

  it("keeps errors even when they have higher numbers than warnings", () => {
    const warning = { ...issue("small-text", "b"), number: 1 };
    const error = { ...issue("horizontal-overflow", "a", "error"), number: 2 };
    expect(capIssues([warning, error], { cap: 1, infos: true })).toEqual({ issues: [error], omitted: { errors: 0, warnings: 1, infos: 0 } });
  });

  it("caps every device but keeps the full summary", () => {
    const report = {
      summary: { errors: 1, warnings: 2, infos: 1 },
      devices: [{ issues: list, omitted: { errors: 0, warnings: 0, infos: 0 } }],
    } as unknown as Report;
    const capped = capReport(report, { cap: 1, infos: true });
    expect(capped.devices[0]?.issues).toHaveLength(1);
    expect(capped.devices[0]?.omitted).toEqual({ errors: 0, warnings: 2, infos: 1 });
    expect(capped.summary).toEqual(report.summary);
  });
});
