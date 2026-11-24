import { basename } from "node:path";
import { countIssues, type Counts, type DeviceReport, type Issue, type Report, type Summary } from "./issues";
import { SEVERITY_COLORS } from "./overlay";
import type { Severity } from "./rules";
import { RUN } from "./command";

/** Pure formatting of a finished report: terminal text, Markdown and a self-contained HTML page. */

export interface Style {
  red: (text: string) => string;
  yellow: (text: string) => string;
  blue: (text: string) => string;
  green: (text: string) => string;
  dim: (text: string) => string;
  bold: (text: string) => string;
}

const ansi = (open: number, close: number) => (text: string) => `\u001b[${open}m${text}\u001b[${close}m`;

export const COLOR: Style = {
  red: ansi(31, 39),
  yellow: ansi(33, 39),
  blue: ansi(34, 39),
  green: ansi(32, 39),
  dim: ansi(2, 22),
  bold: ansi(1, 22),
};

const same = (text: string) => text;
export const PLAIN: Style = { red: same, yellow: same, blue: same, green: same, dim: same, bold: same };

/** Colours only on a terminal, and never when NO_COLOR is set. */
export function pickStyle(isTTY: boolean | undefined, env: Record<string, string | undefined>): Style {
  return isTTY && env.NO_COLOR === undefined ? COLOR : PLAIN;
}

export const SYMBOLS: Record<Severity, string> = { error: "✖", warn: "⚠", info: "ℹ" };

/** Issues listed per section in the terminal unless --all. */
export const SECTION_LIMIT = 10;

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

function paint(style: Style, severity: Severity, text: string): string {
  return severity === "error" ? style.red(text) : severity === "warn" ? style.yellow(text) : style.blue(text);
}

function formatDpr(dpr: number): string {
  return `@${Math.round(dpr * 1000) / 1000}x`;
}

/** Issues that several devices share, listed once ("On all 5 devices", "On 4 devices: …"). */
export interface SharedSection {
  title: string;
  devices: DeviceReport[];
  /** The first listed device's copies (numbers are the same on every device). */
  issues: Issue[];
}

export interface Sections {
  shared: SharedSection[];
  /** Per device, the issues no other device has. */
  own: Issue[][];
}

/**
 * Splits the report so each issue is listed once: issues on all devices,
 * then issues shared by a subset of devices, then each device's own issues.
 * Relies on issue numbers being the same for the same issue on every device.
 */
export function issueSections(report: Report): Sections {
  const { devices } = report;
  const holders = new Map<number, number[]>();
  devices.forEach((device, index) => {
    for (const issue of device.issues) {
      const list = holders.get(issue.number) ?? [];
      if (!list.includes(index)) list.push(index);
      holders.set(issue.number, list);
    }
  });
  const groups = new Map<string, { indexes: number[]; numbers: number[] }>();
  for (const [number, indexes] of [...holders.entries()].sort((a, b) => a[0] - b[0])) {
    if (indexes.length < 2) continue;
    const signature = indexes.join(",");
    const group = groups.get(signature) ?? { indexes, numbers: [] };
    group.numbers.push(number);
    groups.set(signature, group);
  }
  const shared = [...groups.values()]
    .sort((a, b) => b.indexes.length - a.indexes.length || (a.numbers[0] ?? 0) - (b.numbers[0] ?? 0))
    .map(({ indexes, numbers }): SharedSection => {
      const members = indexes.flatMap((index) => (devices[index] ? [devices[index]] : []));
      const first = members[0];
      const names = members.map((device) => `${device.name}${device.orientation === "landscape" ? " landscape" : ""}`);
      return {
        title: indexes.length === devices.length ? `On all ${devices.length} devices` : `On ${indexes.length} devices: ${names.join(", ")}`,
        devices: members,
        issues: first ? first.issues.filter((issue) => numbers.includes(issue.number)) : [],
      };
    });
  const own = devices.map((device) => device.issues.filter((issue) => (holders.get(issue.number)?.length ?? 0) < 2));
  return { shared, own };
}

/** "iPhone 16 Pro  402×874 @3x" (+ "landscape"). */
export function deviceLabel(device: DeviceReport): string {
  const turned = device.orientation === "landscape" ? " landscape" : "";
  return `${device.name}${turned}  ${device.viewport.width}×${device.viewport.height} ${formatDpr(device.dpr)}`;
}

function countsText(counts: Counts, style: Style): string {
  const parts: string[] = [];
  if (counts.errors) parts.push(style.red(`${SYMBOLS.error} ${plural(counts.errors, "error", "errors")}`));
  if (counts.warnings) parts.push(style.yellow(`${SYMBOLS.warn} ${plural(counts.warnings, "warning", "warnings")}`));
  if (counts.infos) parts.push(style.blue(`${SYMBOLS.info} ${plural(counts.infos, "note", "notes")}`));
  return parts.join("  ");
}

const isEmpty = (counts: Counts) => counts.errors + counts.warnings + counts.infos === 0;

/** "iPhone 16 Pro  402×874 @3x  ✖ 2 errors  ⚠ 3 warnings" */
export function deviceHeader(device: DeviceReport, style: Style = PLAIN): string {
  const counts = countIssues(device.issues);
  const text = isEmpty(counts) ? style.green("✓ no problems") : countsText(counts, style);
  return `${style.bold(device.name)}${device.orientation === "landscape" ? " landscape" : ""}  ${device.viewport.width}×${device.viewport.height} ${formatDpr(device.dpr)}  ${text}`;
}

/** "1. ✖ horizontal-overflow  div.hero > img  sticks out 118px past the right edge" */
export function issueLine(issue: Issue, style: Style = PLAIN): string {
  const head = paint(style, issue.severity, `${SYMBOLS[issue.severity]} ${issue.rule}`);
  const detail = issue.detail ? style.dim(`  "${issue.detail}"`) : "";
  return `${issue.number}. ${head}  ${issue.selector}  ${issue.message}${detail}`;
}

export function isClean(summary: Summary): boolean {
  return summary.errors === 0 && summary.warnings === 0;
}

export interface HumanOptions {
  /** Show notes and every issue (no per-section limit). */
  all: boolean;
}

/** The text printed at the end of a check: short by default, everything with --all. */
export function formatHuman(report: Report, style: Style = PLAIN, options: HumanOptions = { all: false }): string {
  const lines: string[] = [];
  const hinted = new Set<string>();
  const shown = (issues: readonly Issue[]) => issues.filter((issue) => options.all || issue.severity !== "info");
  const list = (issues: readonly Issue[]) => {
    const visible = shown(issues);
    const limit = options.all ? visible.length : SECTION_LIMIT;
    for (const issue of visible.slice(0, limit)) {
      lines.push(`  ${issueLine(issue, style)}`);
      // One fix line per rule is enough; later issues of the same rule only list the element.
      if (issue.severity !== "info" && !hinted.has(issue.rule)) {
        hinted.add(issue.rule);
        lines.push(style.dim(`     Fix: ${issue.hint}`));
      }
    }
    if (visible.length > limit) lines.push(style.dim(`  … and ${visible.length - limit} more, see report.html`));
    return visible.length;
  };

  const count = report.devices.length;
  const sections = issueSections(report);
  for (const section of sections.shared) {
    if (shown(section.issues).length === 0) continue;
    lines.push(`${style.bold(section.title)}  ${countsText(countIssues(section.issues), style)}`);
    list(section.issues);
    lines.push("");
  }
  report.devices.forEach((device, index) => {
    lines.push(deviceHeader(device, style));
    list(sections.own[index] ?? []);
  });
  lines.push("");

  const { summary } = report;
  const failedStatus = report.devices.find((device) => device.status !== null && device.status >= 400)?.status;
  if (failedStatus) {
    lines.push(style.yellow(`${SYMBOLS.warn} The page answered HTTP ${failedStatus}, so this checked an error page.`));
    lines.push(style.dim(`  Fix the page or the URL, then run: ${RUN} check ${report.url}`));
  }
  if (isClean(summary)) {
    lines.push(style.green(`✓ No responsive problems found on ${plural(count, "device", "devices")}`));
  } else {
    lines.push(`Checked ${plural(count, "device", "devices")}: ${countsText(summary, style)}`);
    lines.push(style.dim("Fix the errors and warnings above, then run the same command again."));
  }
  if (!options.all && summary.infos > 0) {
    lines.push(style.dim(`${plural(summary.infos, "note", "notes")} (44px tap targets, large images) not shown: add --all or open the report.`));
  }
  lines.push(`Report: ${report.reportHtml}`);
  return lines.join("\n");
}

function markdownIssue(issue: Issue): string[] {
  const detail = issue.detail ? ` (${issue.detail.replace(/`/g, "'")})` : "";
  const examples = issue.examples.length ? `\n   Examples: ${issue.examples.map((example) => `\`${example.replace(/`/g, "'")}\``).join(", ")}` : "";
  return [
    `${issue.number}. **${issue.severity}** \`${issue.rule}\` \`${issue.selector.replace(/`/g, "'")}\`: ${issue.message}${detail}${examples}`,
    `   Fix: ${issue.hint}`,
  ];
}

/** Markdown for pasting into an AI chat; image links are relative to the report folder. */
export function toMarkdown(report: Report): string {
  const { summary } = report;
  const lines = [
    "# Phone Sim responsive check",
    "",
    `- URL: ${report.url}`,
    `- Checked: ${report.checkedAt} with ${report.tool.name} ${report.tool.version}`,
    `- Result: ${summary.errors} errors, ${summary.warnings} warnings, ${summary.infos} notes on ${report.devices.length} devices`,
    `- Note: ${report.viewportNote}`,
    "",
  ];
  const sections = issueSections(report);
  if (sections.shared.length > 0) lines.push("Issue numbers are the same on every screenshot.", "");
  for (const section of sections.shared) {
    lines.push(`## ${section.title}`, "");
    for (const issue of section.issues) lines.push(...markdownIssue(issue));
    lines.push("");
  }
  report.devices.forEach((device, index) => {
    lines.push(`## ${deviceLabel(device)}`, "");
    lines.push(`![${device.name}](${encodeURI(basename(device.screenshot))})`, "");
    const own = sections.own[index] ?? [];
    if (device.issues.length === 0) lines.push("No problems found.");
    else if (own.length === 0) lines.push("Only the shared issues above.");
    for (const issue of own) lines.push(...markdownIssue(issue));
    lines.push("");
  });
  return lines.join("\n");
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlIssue(issue: Issue): string {
  const color = SEVERITY_COLORS[issue.severity];
  const detail = issue.detail ? `<div class="detail">${escapeHtml(issue.detail)}</div>` : "";
  const examples = issue.examples.length
    ? `<div class="detail">e.g. ${issue.examples.map((example) => `<code>${escapeHtml(example)}</code>`).join(" ")}</div>`
    : "";
  return `<li><span class="badge" style="background:${color}">${issue.number}</span><div><div class="head"><span class="rule" style="color:${color}">${escapeHtml(issue.rule)}</span> <code>${escapeHtml(issue.selector)}</code></div><div>${escapeHtml(issue.message)}</div>${detail}${examples}<div class="hint">Fix: ${escapeHtml(issue.hint)}</div></div></li>`;
}

function htmlCounts(counts: Counts): string {
  if (isEmpty(counts)) return '<span class="ok">✓ no problems</span>';
  return [
    counts.errors ? `<span style="color:${SEVERITY_COLORS.error}">✖ ${plural(counts.errors, "error", "errors")}</span>` : "",
    counts.warnings ? `<span style="color:${SEVERITY_COLORS.warn}">⚠ ${plural(counts.warnings, "warning", "warnings")}</span>` : "",
    counts.infos ? `<span style="color:${SEVERITY_COLORS.info}">ℹ ${plural(counts.infos, "note", "notes")}</span>` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function htmlDevice(device: DeviceReport, own: readonly Issue[]): string {
  const image = escapeHtml(encodeURI(basename(device.screenshot)));
  const raw = escapeHtml(encodeURI(basename(device.rawScreenshot)));
  const list =
    own.length > 0
      ? `<ol>${own.map(htmlIssue).join("")}</ol>`
      : device.issues.length > 0
        ? '<p class="note">Only the shared issues above.</p>'
        : '<p class="ok">Looks good on this screen.</p>';
  const sharedCount = device.issues.length - own.length;
  const sharedNote = sharedCount > 0 ? ` · plus ${plural(sharedCount, "shared issue", "shared issues")} above` : "";
  return `<section class="device"><a class="shot" href="${raw}" title="Open the plain screenshot"><img src="${image}" alt="${escapeHtml(device.name)} screenshot" loading="lazy"></a><div class="info"><h2>${escapeHtml(device.name)}${device.orientation === "landscape" ? " <small>landscape</small>" : ""}</h2><div class="meta">${device.viewport.width}×${device.viewport.height} ${formatDpr(device.dpr)} · ${htmlCounts(countIssues(device.issues))}${sharedNote}</div>${list}</div></section>`;
}

/** One self-contained page: inline CSS, screenshots by relative path. */
export function toHtml(report: Report): string {
  const { summary } = report;
  const verdict = isClean(summary)
    ? `<p class="verdict ok">✓ No responsive problems found on ${plural(report.devices.length, "device", "devices")}</p>`
    : `<p class="verdict">${summary.errors} errors · ${summary.warnings} warnings · ${summary.infos} notes on ${plural(report.devices.length, "device", "devices")}</p>`;
  const failedStatus = report.devices.find((device) => device.status !== null && device.status >= 400)?.status;
  const statusNote = failedStatus
    ? `<p class="verdict" style="color:${SEVERITY_COLORS.warn}">⚠ The page answered HTTP ${failedStatus}, so this checked an error page.</p>`
    : "";
  const sections = issueSections(report);
  const sharedSection = sections.shared
    .map(
      (section) =>
        `<section class="shared"><h2>${escapeHtml(section.title)} <small>same number on every screenshot</small></h2><div class="meta">${htmlCounts(countIssues(section.issues))}</div><ol>${section.issues.map(htmlIssue).join("")}</ol></section>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Phone Sim check</title>
<style>
:root{color-scheme:light dark;--bg:#f6f6f4;--card:#fff;--text:#1b1b1d;--muted:#6b6b70;--line:#e4e4e0}
@media (prefers-color-scheme:dark){:root{--bg:#141416;--card:#1d1d20;--text:#ececef;--muted:#9a9aa2;--line:#2c2c31}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
header{padding:24px 24px 8px}
h1{margin:0;font-size:22px}
.url{color:var(--muted);word-break:break-all}
.verdict{font-size:17px;font-weight:600;margin:8px 0 0}
.ok{color:#1f9d55}
.note{color:var(--muted);font-size:13px;margin:4px 0 0}
main{display:flex;flex-wrap:wrap;gap:20px;padding:16px 24px 40px;align-items:flex-start}
.shared,.device{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px}
.shared{flex:1 1 100%}
.shared ol{grid-template-columns:repeat(auto-fill,minmax(320px,1fr))}
.device{display:flex;gap:16px;flex:1 1 560px;max-width:900px}
.shot{flex:none}
.shot img{display:block;max-height:640px;max-width:300px;width:auto;height:auto}
.info{min-width:0;flex:1}
h2{margin:0;font-size:17px}
h2 small{font-weight:400;color:var(--muted);font-size:13px}
.meta{color:var(--muted);font-size:13px;margin-bottom:8px}
ol{list-style:none;margin:0;padding:0;display:grid;gap:10px}
li{display:flex;gap:10px;font-size:14px}
.badge{flex:none;min-width:22px;height:22px;border-radius:11px;color:#fff;font-weight:700;font-size:12px;line-height:22px;text-align:center;padding:0 5px}
.head{font-weight:600}
code{font:12.5px ui-monospace,SFMono-Regular,Menlo,monospace;background:color-mix(in srgb,var(--text) 8%,transparent);padding:1px 5px;border-radius:5px;overflow-wrap:anywhere}
.detail{color:var(--muted);font-size:13px;word-break:break-word}
.hint{font-size:13px}
@media (max-width:640px){header{padding:16px 16px 4px}main{padding:12px 16px 32px}.device{flex-direction:column}.shot img{max-width:100%}.shared ol{grid-template-columns:1fr}}
</style>
</head>
<body>
<header>
<h1>Phone Sim responsive check</h1>
<div class="url">${escapeHtml(report.url)} · ${escapeHtml(report.checkedAt)}</div>
${statusNote}${verdict}
<p class="note">${escapeHtml(report.viewportNote)} Click a screenshot for the plain version.</p>
</header>
<main>
${sharedSection}
${report.devices.map((device, index) => htmlDevice(device, sections.own[index] ?? [])).join("\n")}
</main>
</body>
</html>
`;
}
