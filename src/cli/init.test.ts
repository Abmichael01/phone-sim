import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addIgnoreLine, AGENT_SECTION, END_MARKER, runInit, START_MARKER, upsertSection } from "./init";

let dir: string;
const read = (name: string) => readFileSync(join(dir, name), "utf8");

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "phone-sim-init-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("upsertSection", () => {
  it("appends to existing text and replaces an old section in place", () => {
    const once = upsertSection("# Rules\n");
    expect(once).toBe(`# Rules\n\n${AGENT_SECTION}\n`);
    expect(upsertSection(once)).toBe(once);
    const old = `# Rules\n\n${START_MARKER}\nold text\n${END_MARKER}\n\n## After\n`;
    expect(upsertSection(old)).toBe(`# Rules\n\n${AGENT_SECTION}\n\n## After\n`);
  });
});

describe("addIgnoreLine", () => {
  it("adds the report folder once", () => {
    expect(addIgnoreLine("node_modules/")).toBe("node_modules/\nphone-sim-report/\n");
    expect(addIgnoreLine("/phone-sim-report\n")).toBe("/phone-sim-report\n");
    expect(addIgnoreLine("")).toBe("phone-sim-report/\n");
  });
});

describe("runInit", () => {
  it("creates AGENTS.md and .gitignore in an empty project", () => {
    const changes = runInit(dir, false);
    expect(changes).toEqual([
      { file: "AGENTS.md", action: "created", description: 'added the "Responsive check" section' },
      { file: ".gitignore", action: "created", description: "ignores phone-sim-report/" },
    ]);
    expect(read("AGENTS.md")).toContain("npx phone-sim check <url> --json");
    expect(read(".gitignore")).toBe("phone-sim-report/\n");
  });

  it("is idempotent", () => {
    runInit(dir, false);
    const agents = read("AGENTS.md");
    const changes = runInit(dir, false);
    expect(changes.every((change) => change.action === "unchanged")).toBe(true);
    expect(read("AGENTS.md")).toBe(agents);
    expect(agents.split(START_MARKER)).toHaveLength(2);
  });

  it("keeps existing content and leaves a CLAUDE.md that imports AGENTS.md alone", () => {
    writeFileSync(join(dir, "AGENTS.md"), "# Project rules\n\nUse pnpm.\n");
    writeFileSync(join(dir, "CLAUDE.md"), "@AGENTS.md\n");
    writeFileSync(join(dir, ".gitignore"), "node_modules/\n");
    const changes = runInit(dir, false);
    expect(read("AGENTS.md").startsWith("# Project rules\n\nUse pnpm.\n\n<!-- phone-sim:start -->")).toBe(true);
    expect(read("CLAUDE.md")).toBe("@AGENTS.md\n");
    expect(changes.find((change) => change.file === "CLAUDE.md")?.action).toBe("unchanged");
    expect(read(".gitignore")).toBe("node_modules/\nphone-sim-report/\n");
  });

  it("adds the section to a CLAUDE.md that does not reference AGENTS.md", () => {
    writeFileSync(join(dir, "CLAUDE.md"), "# Claude notes\n");
    runInit(dir, false);
    expect(read("CLAUDE.md")).toContain(START_MARKER);
    runInit(dir, false);
    expect(read("CLAUDE.md").split(START_MARKER)).toHaveLength(2);
  });

  it("writes nothing on a dry run", () => {
    const changes = runInit(dir, true);
    expect(changes.map((change) => change.action)).toEqual(["created", "created"]);
    expect(existsSync(join(dir, "AGENTS.md"))).toBe(false);
    expect(existsSync(join(dir, ".gitignore"))).toBe(false);
  });
});
