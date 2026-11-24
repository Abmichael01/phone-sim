import { z } from "zod";
import type { RawIssue, RuleId, Severity } from "./rules";

export const severitySchema = z.enum(["error", "warn", "info"]);

export const ruleIdSchema = z.enum([
  "viewport-meta",
  "horizontal-overflow",
  "small-tap-target",
  "small-text",
  "ios-input-zoom",
  "text-clipped",
  "fixed-covers-screen",
  "safe-area",
  "image-oversize",
]);

export const rectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
});

export const issueSchema = z.object({
  /** 1-based; matches the numbered badge on the annotated screenshot. Issues found on every device share their number. */
  number: z.number().int().positive(),
  rule: ruleIdSchema,
  severity: severitySchema,
  /** CSS selector. For a group (`count` > 1) the shared shape, e.g. "sup.reference > a". */
  selector: z.string(),
  /** Grouping key: tag + stable classes of the element and its parent (no ids, no positions). */
  group: z.string(),
  /** Up to 3 real selectors of grouped elements (may use ids). */
  examples: z.array(z.string()),
  message: z.string(),
  /** One line on how to fix it. */
  hint: z.string(),
  /** Element text or other context to search the code with. */
  detail: z.string(),
  /** Box of the worst element, page coordinates in CSS px (null for page-level issues). */
  rect: rectSchema.nullable(),
  /** Boxes of every grouped element (at most MAX_BOXES). */
  rects: z.array(rectSchema),
  /** How many elements share this issue. */
  count: z.number().int().positive(),
  /** The same issue was found on every checked device. */
  onAllDevices: z.boolean(),
});

export const orientationSchema = z.enum(["portrait", "landscape"]);

export const countsSchema = z.object({
  errors: z.number().int().nonnegative(),
  warnings: z.number().int().nonnegative(),
  infos: z.number().int().nonnegative(),
});

export const deviceReportSchema = z.object({
  id: z.string(),
  name: z.string(),
  viewport: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
  dpr: z.number().positive(),
  orientation: orientationSchema,
  /** HTTP status of the page (null for file:// pages). */
  status: z.number().int().nullable(),
  /** Framed + annotated screenshot (absolute path). */
  screenshot: z.string(),
  /** Plain viewport screenshot (absolute path). */
  rawScreenshot: z.string(),
  issues: z.array(issueSchema),
  /** Issues left out of `issues` by the size cap (run with --all for every one). */
  omitted: countsSchema,
});

export const summarySchema = countsSchema;

export const reportSchema = z.object({
  url: z.string(),
  checkedAt: z.string(),
  tool: z.object({ name: z.literal("phone-sim"), version: z.string() }),
  outDir: z.string(),
  reportHtml: z.string(),
  /** How the viewport was sized; real browsers subtract their toolbars. */
  viewportNote: z.string(),
  devices: z.array(deviceReportSchema),
  /** Every issue found, including ones left out by the cap. */
  summary: summarySchema,
});

export type Issue = z.infer<typeof issueSchema>;
export type DeviceReport = z.infer<typeof deviceReportSchema>;
export type Report = z.infer<typeof reportSchema>;
export type Summary = z.infer<typeof summarySchema>;
export type Counts = z.infer<typeof countsSchema>;
export type FailOn = "error" | "warn" | "never";

/** Most boxes drawn for one grouped issue. */
export const MAX_BOXES = 20;
/** Example selectors kept per group. */
export const MAX_EXAMPLES = 3;
/** Issues per device in the JSON report unless --all. */
export const JSON_ISSUE_CAP = 25;

export const VIEWPORT_NOTE =
  "Each device is checked with the viewport set to its full screen size. Real browsers subtract their address bar and toolbar, so the visible area is a little shorter; widths are exact.";

const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warn: 1, info: 2 };

/** Within a severity, the problems that hurt the most come first. */
const IMPACT_ORDER: readonly RuleId[] = [
  "viewport-meta",
  "horizontal-overflow",
  "fixed-covers-screen",
  "ios-input-zoom",
  "text-clipped",
  "safe-area",
  "small-tap-target",
  "small-text",
  "image-oversize",
];

/** For these rules a smaller measurement is worse (px size); for the rest a larger one is. */
const SMALLER_IS_WORSE = new Set<RuleId>(["small-tap-target", "small-text", "ios-input-zoom", "safe-area"]);

/** Issues that are never merged: each overflow root cause needs its own fix. */
const NEVER_GROUPED = new Set<RuleId>(["horizontal-overflow", "viewport-meta"]);

export const RULE_HINTS: Record<RuleId, string> = {
  "viewport-meta": 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> inside <head>.',
  "horizontal-overflow":
    "Remove the fixed width (use max-width: 100%), let rows wrap (flex-wrap: wrap, min-width: 0), or make wide content scroll inside its own box (overflow-x: auto).",
  "small-tap-target": "Make it at least 24×24px (44×44px is better): add padding or min-width/min-height.",
  "small-text": "Use at least 12px for small print and 16px for body text.",
  "ios-input-zoom": "Set font-size: 16px (or more) on inputs, selects and textareas so iPhone Safari does not zoom in.",
  "text-clipped":
    "Let the text wrap (remove white-space: nowrap or the fixed width), or add text-overflow: ellipsis if cutting it is intended.",
  "fixed-covers-screen":
    "Make the cookie banner, sticky header or popup smaller on phones (or let it scroll away) so the page stays readable.",
  "safe-area":
    "Add padding-top: env(safe-area-inset-top) / padding-bottom: env(safe-area-inset-bottom) so the notch or home bar does not cover it.",
  "image-oversize": "Serve a smaller file for phones with srcset/sizes or an image CDN; it wastes download time.",
};

function worse(rule: RuleId, a: RawIssue, b: RawIssue): RawIssue {
  if (SMALLER_IS_WORSE.has(rule)) return b.value < a.value ? b : a;
  return b.value > a.value ? b : a;
}

interface Group {
  members: RawIssue[];
  worst: RawIssue;
}

type Ranked = Omit<Issue, "number"> & { value: number };

/** Severity, then how much the rule hurts, then how many elements it affects, then how bad the worst one is. */
function byImpact(a: Ranked, b: Ranked): number {
  return (
    SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
    IMPACT_ORDER.indexOf(a.rule) - IMPACT_ORDER.indexOf(b.rule) ||
    b.count - a.count ||
    (SMALLER_IS_WORSE.has(a.rule) ? a.value - b.value : b.value - a.value) ||
    a.selector.localeCompare(b.selector)
  );
}

/**
 * Dedupes identical findings, groups look-alike elements (same rule, severity
 * and shape, e.g. every footnote link), sorts by impact and numbers the result.
 */
export function groupIssues(raw: readonly RawIssue[]): Issue[] {
  const seen = new Set<string>();
  const groups = new Map<string, Group>();
  for (const issue of raw) {
    const exact = `${issue.rule}|${issue.severity}|${issue.selector}|${issue.message}`;
    if (seen.has(exact)) continue;
    seen.add(exact);
    const key = NEVER_GROUPED.has(issue.rule) ? exact : `${issue.rule}|${issue.severity}|${issue.groupKey}`;
    const group = groups.get(key);
    if (group) {
      group.members.push(issue);
      group.worst = worse(issue.rule, group.worst, issue);
    } else {
      groups.set(key, { members: [issue], worst: issue });
    }
  }

  const merged = [...groups.values()].map(({ members, worst }): Ranked => {
    const count = members.length;
    const others = members.filter((member) => member !== worst);
    const rects = [worst, ...others].flatMap((member) => (member.rect ? [member.rect] : [])).slice(0, MAX_BOXES);
    return {
      rule: worst.rule,
      severity: worst.severity,
      selector: count > 1 ? worst.groupKey : worst.selector,
      group: worst.groupKey,
      examples: count > 1 ? [worst, ...others].slice(0, MAX_EXAMPLES).map((member) => member.selector) : [],
      message: count > 1 ? `${count} elements: worst ${worst.message}` : worst.message,
      hint: RULE_HINTS[worst.rule],
      detail: worst.detail,
      rect: worst.rect,
      rects,
      count,
      onAllDevices: false,
      value: worst.value,
    };
  });

  merged.sort(byImpact);
  return merged.map(({ value: _value, ...issue }, index) => ({ number: index + 1, ...issue }));
}

/** Identity of an issue across devices: rule + severity + shape (the element itself for overflow). */
export function issueKey(issue: Pick<Issue, "rule" | "severity" | "group" | "selector">): string {
  return `${issue.rule}|${issue.severity}|${NEVER_GROUPED.has(issue.rule) ? issue.selector : issue.group}`;
}

/** Keys per issue, with a suffix when the same key appears twice on one device. */
function keysOf(issues: readonly Issue[]): string[] {
  const seen = new Map<string, number>();
  return issues.map((issue) => {
    const key = issueKey(issue);
    const times = seen.get(key) ?? 0;
    seen.set(key, times + 1);
    return times === 0 ? key : `${key}#${times}`;
  });
}

/**
 * Gives every distinct issue one number for the whole report, so "issue 7"
 * means the same thing on every screenshot. Issues found on every device come
 * first (in the first device's order), then the rest in order of first
 * appearance. Each device's issues are returned sorted by that number.
 * With one device nothing is marked as shared.
 */
export function alignAcrossDevices(devices: readonly (readonly Issue[])[]): Issue[][] {
  const keyed = devices.map((issues) => ({ issues, keys: keysOf(issues) }));
  const keySets = keyed.map(({ keys }) => new Set(keys));
  const shared = new Set(
    devices.length < 2 ? [] : (keyed[0]?.keys ?? []).filter((key) => keySets.every((keys) => keys.has(key))),
  );
  const numbers = new Map<string, number>();
  for (const key of keyed[0]?.keys ?? []) if (shared.has(key)) numbers.set(key, numbers.size + 1);
  for (const { keys } of keyed) for (const key of keys) if (!numbers.has(key)) numbers.set(key, numbers.size + 1);
  return keyed.map(({ issues, keys }) =>
    issues
      .map((issue, index) => {
        const key = keys[index] ?? "";
        return { ...issue, number: numbers.get(key) ?? index + 1, onAllDevices: shared.has(key) };
      })
      .sort((a, b) => a.number - b.number),
  );
}

export function countIssues(issues: readonly Issue[]): Counts {
  const counts: Counts = { errors: 0, warnings: 0, infos: 0 };
  for (const issue of issues) {
    if (issue.severity === "error") counts.errors += 1;
    else if (issue.severity === "warn") counts.warnings += 1;
    else counts.infos += 1;
  }
  return counts;
}

export function summarize(devices: readonly { issues: readonly Issue[] }[]): Summary {
  return devices.reduce<Summary>(
    (total, device) => {
      const counts = countIssues(device.issues);
      return { errors: total.errors + counts.errors, warnings: total.warnings + counts.warnings, infos: total.infos + counts.infos };
    },
    { errors: 0, warnings: 0, infos: 0 },
  );
}

export interface CapOptions {
  /** Most issues kept per device. */
  cap: number;
  /** Keep info-level notes (otherwise they are only counted in `omitted`). */
  infos: boolean;
}

/** No caps: every issue and note (--all). */
export const NO_CAP: CapOptions = { cap: Number.POSITIVE_INFINITY, infos: true };
/** Default JSON: errors and warnings only, at most JSON_ISSUE_CAP per device. */
export const JSON_CAP: CapOptions = { cap: JSON_ISSUE_CAP, infos: false };

/** Keeps the `cap` most severe issues (errors first, then by number) in their order and counts what was left out. */
export function capIssues(issues: readonly Issue[], options: CapOptions): { issues: Issue[]; omitted: Counts } {
  const eligible = issues.filter((issue) => options.infos || issue.severity !== "info");
  const ranked = [...eligible].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.number - b.number);
  const keep = new Set(ranked.slice(0, Math.max(0, options.cap)));
  return { issues: issues.filter((issue) => keep.has(issue)), omitted: countIssues(issues.filter((issue) => !keep.has(issue))) };
}

/** The report with capped issues per device (summary still counts everything). */
export function capReport(report: Report, options: CapOptions): Report {
  return {
    ...report,
    devices: report.devices.map((device) => {
      const { issues, omitted } = capIssues(device.issues, options);
      return { ...device, issues, omitted };
    }),
  };
}

/** 1 when issues at or above `failOn` exist, else 0. */
export function exitCodeFor(summary: Summary, failOn: FailOn): 0 | 1 {
  if (failOn === "never") return 0;
  if (summary.errors > 0) return 1;
  if (failOn === "warn" && summary.warnings > 0) return 1;
  return 0;
}
