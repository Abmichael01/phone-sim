import { describe, expect, it } from "vitest";
import { resolveDevice } from "@/devices";
import { allocateRuleIds, buildTabRules, tabRuleIds } from "./rules";

const device = resolveDevice("pixel-8");

describe("rule ids", () => {
  it("gives the first tab ids 1 and 2", () => {
    expect(allocateRuleIds([], 489_985_525)).toEqual([1, 2]);
  });

  it("keeps a tab's existing ids and finds a free pair for a new tab", () => {
    const tabA = buildTabRules([1, 2], 10, device, 140);
    const tabB = buildTabRules([5, 6], 20, device, 140);
    const rules = [...tabA, ...tabB];
    expect(allocateRuleIds(rules, 10)).toEqual([1, 2]);
    expect(allocateRuleIds(rules, 20)).toEqual([5, 6]);
    expect(allocateRuleIds(rules, 30)).toEqual([3, 4]);
  });

  it("lists only the rules of one tab", () => {
    const rules = [...buildTabRules([3, 4], 10, device, 140), ...buildTabRules([1, 2], 20, device, 140)];
    expect(tabRuleIds(rules, 10)).toEqual([3, 4]);
    expect(tabRuleIds(rules, 99)).toEqual([]);
  });
});

describe("buildTabRules", () => {
  const rules = buildTabRules([1, 2], 7, device, 140);

  it("scopes every rule to the simulator tab only", () => {
    expect(rules.map((rule) => rule.id)).toEqual([1, 2]);
    for (const rule of rules) expect(rule.condition.tabIds).toEqual([7]);
  });

  it("removes framing headers only for sub-frames", () => {
    const frameRule = rules.find((rule) => rule.action.responseHeaders);
    expect(frameRule?.condition.resourceTypes).toEqual(["sub_frame"]);
    expect(frameRule?.action.responseHeaders?.map((h) => h.header)).toEqual(["x-frame-options", "content-security-policy"]);
  });

  it("sets the device UA and client hints, never on the tab's own main frame", () => {
    const headerRule = rules.find((rule) => rule.action.requestHeaders);
    expect(headerRule?.condition.excludedResourceTypes).toEqual(["main_frame"]);
    const headers = new Map(headerRule?.action.requestHeaders?.map((h) => [h.header, h]));
    expect(headers.get("user-agent")?.value).toContain("Android 10; K");
    expect(headers.get("sec-ch-ua-mobile")?.value).toBe("?1");
    expect(headers.get("sec-ch-ua-platform")?.value).toBe('"Android"');
    expect(headers.get("sec-ch-ua-model")?.operation).toBe("remove");
  });
});
