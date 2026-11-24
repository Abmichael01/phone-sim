import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RUN } from "./command";

/** `phone-sim init`: tells AI agents working in a repo to run the responsive check. */

export const START_MARKER = "<!-- phone-sim:start -->";
export const END_MARKER = "<!-- phone-sim:end -->";
export const REPORT_DIR_IGNORE = "phone-sim-report/";

export const AGENT_SECTION = `${START_MARKER}
## Responsive check (phone-sim)

After every UI change, check the page on real phone and tablet sizes:

1. With the dev server running, run \`${RUN} check <url> --json\`
   (leave out the URL and it finds the local dev server on its own).
2. Fix every error and warning it reports. Each one names the rule, a CSS selector, what is wrong and how to fix it.
3. Run the check again until it reports no errors and no warnings.
4. Look at the annotated screenshots in \`phone-sim-report/\` (\`<device>.png\`): numbered boxes mark each problem, and \`report.html\` shows all devices side by side.
${END_MARKER}`;

/** Inserts or replaces the marked section; returns the text unchanged when it is already current. */
export function upsertSection(text: string, section: string = AGENT_SECTION): string {
  const start = text.indexOf(START_MARKER);
  const end = text.indexOf(END_MARKER);
  if (start !== -1 && end > start) {
    return text.slice(0, start) + section + text.slice(end + END_MARKER.length);
  }
  if (text.trim() === "") return `${section}\n`;
  const separator = text.endsWith("\n\n") ? "" : text.endsWith("\n") ? "\n" : "\n\n";
  return `${text}${separator}${section}\n`;
}

/** Adds the report folder to .gitignore text unless an equivalent line is there. */
export function addIgnoreLine(text: string): string {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const present = lines.some((line) => ["phone-sim-report", "phone-sim-report/", "/phone-sim-report", "/phone-sim-report/"].includes(line));
  if (present) return text;
  const separator = text === "" || text.endsWith("\n") ? "" : "\n";
  return `${text}${separator}${REPORT_DIR_IGNORE}\n`;
}

/** CLAUDE.md that already pulls in AGENTS.md (e.g. "@AGENTS.md") needs no copy of the section. */
export function referencesAgents(text: string): boolean {
  return /AGENTS\.md/i.test(text);
}

export interface FileChange {
  file: string;
  action: "created" | "updated" | "unchanged";
  description: string;
}

/** Applies (or with dryRun only plans) the init edits in `dir`. */
export function runInit(dir: string, dryRun: boolean): FileChange[] {
  const changes: FileChange[] = [];
  const edit = (name: string, transform: (before: string) => string, description: string) => {
    const path = join(dir, name);
    const exists = existsSync(path);
    const before = exists ? readFileSync(path, "utf8") : "";
    const after = transform(before);
    if (exists && after === before) {
      changes.push({ file: name, action: "unchanged", description: "already set up" });
      return;
    }
    if (!dryRun) writeFileSync(path, after);
    changes.push({ file: name, action: exists ? "updated" : "created", description });
  };

  edit("AGENTS.md", (text) => upsertSection(text), 'added the "Responsive check" section');
  const claudePath = join(dir, "CLAUDE.md");
  if (existsSync(claudePath)) {
    const claude = readFileSync(claudePath, "utf8");
    if (referencesAgents(claude) && !claude.includes(START_MARKER)) {
      changes.push({ file: "CLAUDE.md", action: "unchanged", description: "already points to AGENTS.md" });
    } else {
      edit("CLAUDE.md", (text) => upsertSection(text), 'added the "Responsive check" section');
    }
  }
  edit(".gitignore", addIgnoreLine, `ignores ${REPORT_DIR_IGNORE}`);
  return changes;
}
