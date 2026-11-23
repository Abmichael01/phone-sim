import { buildUserAgent, clientHints } from "@/devices/userAgent";
import type { Device } from "@/schemas/device";

type Rule = chrome.declarativeNetRequest.Rule;

export type RuleIds = [frameRuleId: number, headerRuleId: number];

/** Ids of the session rules that already belong to `tabId`, lowest first. */
export function tabRuleIds(rules: readonly Rule[], tabId: number): number[] {
  return rules
    .filter((rule) => rule.condition.tabIds?.includes(tabId))
    .map((rule) => rule.id)
    .sort((a, b) => a - b);
}

/**
 * Two session rules per simulator tab. A tab keeps the ids it already has, so
 * re-applying replaces its rules in place; a new tab gets the lowest free pair.
 * (Tab ids themselves can exceed what fits in a rule id, so they are not used.)
 */
export function allocateRuleIds(rules: readonly Rule[], tabId: number): RuleIds {
  const [first, second] = tabRuleIds(rules, tabId);
  if (first !== undefined && second !== undefined) return [first, second];
  const used = new Set(rules.map((rule) => rule.id));
  let candidate = 1;
  while (used.has(candidate) || used.has(candidate + 1)) candidate += 2;
  return [candidate, candidate + 1];
}

/** Client-hint headers that would contradict the simulated device, so they are dropped. */
const REMOVED_HINTS = [
  "sec-ch-ua-platform-version",
  "sec-ch-ua-model",
  "sec-ch-ua-arch",
  "sec-ch-ua-bitness",
  "sec-ch-ua-full-version-list",
  "sec-ch-ua-wow64",
  "sec-ch-ua-form-factors",
];

/**
 * Rules for one simulator tab. Both are scoped with `tabIds`, so normal tabs are
 * never touched. Main-frame requests are excluded, so if the tab itself
 * navigates away its own page loads unmodified until the rules are removed.
 */
export function buildTabRules(ids: RuleIds, tabId: number, device: Device, chromeMajor: number): Rule[] {
  const [frameRuleId, headerRuleId] = ids;
  const hints = clientHints(device);
  return [
    {
      id: frameRuleId,
      priority: 1,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          { header: "x-frame-options", operation: "remove" },
          { header: "content-security-policy", operation: "remove" },
        ],
      },
      condition: { tabIds: [tabId], resourceTypes: ["sub_frame"] },
    },
    {
      id: headerRuleId,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          { header: "user-agent", operation: "set", value: buildUserAgent(device, chromeMajor) },
          { header: "sec-ch-ua-mobile", operation: "set", value: hints.mobile },
          { header: "sec-ch-ua-platform", operation: "set", value: hints.platform },
          ...REMOVED_HINTS.map((header) => ({ header, operation: "remove" as const })),
        ],
      },
      condition: { tabIds: [tabId], excludedResourceTypes: ["main_frame"] },
    },
  ];
}
