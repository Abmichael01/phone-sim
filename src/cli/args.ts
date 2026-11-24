import { parseArgs } from "node:util";
import { z } from "zod";
import { PRESET_NAMES } from "./devicesSelect";

export const DEFAULT_OUT_DIR = "phone-sim-report";

const intText = (name: string, min: number, max: number, fallback: number) =>
  z
    .string()
    .optional()
    .transform((value, context) => {
      if (value === undefined) return fallback;
      const number = Number(value);
      if (!Number.isInteger(number) || number < min || number > max) {
        context.addIssue({ code: "custom", message: `--${name} must be a whole number of milliseconds between ${min} and ${max} (got "${value}").` });
        return z.NEVER;
      }
      return number;
    });

const checkSchema = z
  .object({
    url: z.string().optional(),
    devices: z
      .string()
      .optional()
      .transform((value) =>
        value === undefined
          ? undefined
          : value
              .split(",")
              .map((id) => id.trim().toLowerCase())
              .filter(Boolean),
      ),
    preset: z
      .string()
      .optional()
      .refine((value) => value === undefined || (PRESET_NAMES as readonly string[]).includes(value), {
        message: `--preset must be one of: ${PRESET_NAMES.join(", ")}.`,
      })
      .transform((value) => value as (typeof PRESET_NAMES)[number] | undefined),
    landscape: z.boolean(),
    fullPage: z.boolean(),
    wait: intText("wait", 0, 120_000, 500),
    timeout: intText("timeout", 1000, 600_000, 30_000),
    out: z.string().min(1, "--out needs a folder name."),
    json: z.boolean(),
    frame: z.boolean(),
    annotate: z.boolean(),
    failOn: z.enum(["error", "warn", "never"], { message: "--fail-on must be error, warn or never." }),
    open: z.boolean(),
    all: z.boolean(),
    debug: z.boolean(),
  })
  .refine((value) => !(value.devices && value.preset), { message: "Use either --devices or --preset, not both." })
  .refine((value) => value.devices === undefined || value.devices.length > 0, { message: "--devices needs at least one device id." });

export type CheckOptions = z.output<typeof checkSchema>;

export interface DevicesOptions {
  search: string | undefined;
  json: boolean;
}

export interface InitOptions {
  dryRun: boolean;
  debug: boolean;
}

export type Command =
  | { command: "help" }
  | { command: "version" }
  | { command: "check"; options: CheckOptions }
  | { command: "devices"; options: DevicesOptions }
  | { command: "init"; options: InitOptions };

export type ParseResult = { ok: true; value: Command } | { ok: false; message: string; debug: boolean };

const CHECK_OPTIONS = {
  devices: { type: "string" },
  preset: { type: "string" },
  landscape: { type: "boolean", default: false },
  "full-page": { type: "boolean", default: false },
  wait: { type: "string" },
  timeout: { type: "string" },
  out: { type: "string", default: DEFAULT_OUT_DIR },
  json: { type: "boolean", default: false },
  "no-frame": { type: "boolean", default: false },
  "no-annotate": { type: "boolean", default: false },
  "fail-on": { type: "string", default: "error" },
  open: { type: "boolean", default: false },
  all: { type: "boolean", default: false },
  debug: { type: "boolean", default: false },
  help: { type: "boolean", short: "h", default: false },
} as const;

const DEVICES_OPTIONS = {
  search: { type: "string" },
  json: { type: "boolean", default: false },
  help: { type: "boolean", short: "h", default: false },
} as const;

const INIT_OPTIONS = {
  "dry-run": { type: "boolean", default: false },
  debug: { type: "boolean", default: false },
  help: { type: "boolean", short: "h", default: false },
} as const;

/** Node's parseArgs messages are long; keep just the option name. */
function friendlyParseError(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  const unknown = /Unknown option '([^']+)'/.exec(text);
  if (unknown?.[1]) return `Unknown option ${unknown[1]}.`;
  const ambiguous = /Option '([^']+)' argument is ambiguous/.exec(text);
  if (ambiguous?.[1]) return `${ambiguous[1]} needs a value (write values that start with "-" as ${ambiguous[1]}=<value>).`;
  const missing = /Option '([^']+)'.*argument missing/.exec(text);
  if (missing?.[1]) return `${missing[1].split(" ")[0] ?? missing[1]} needs a value.`;
  const extra = /Unexpected argument '([^']+)'/.exec(text);
  if (extra?.[1]) return `Unexpected argument "${extra[1]}".`;
  return text.split(". ")[0] ?? text;
}

/** Something typed in place of a command that is clearly a URL, port or HTML file. */
function looksLikeTarget(word: string): boolean {
  return /^:?\d{2,5}$/.test(word) || /[.:/]/.test(word);
}

/** Parses `process.argv.slice(2)`. Pure: never exits or prints. */
export function parseCli(argv: readonly string[]): ParseResult {
  const debug = argv.includes("--debug");
  const [first, ...rest] = argv;
  if (first === undefined || first === "help" || first === "--help" || first === "-h") return { ok: true, value: { command: "help" } };
  if (first === "--version" || first === "-v" || first === "version") return { ok: true, value: { command: "version" } };

  try {
    if (first === "devices") {
      const { values } = parseArgs({ args: [...rest], options: DEVICES_OPTIONS, allowPositionals: false, strict: true });
      if (values.help) return { ok: true, value: { command: "help" } };
      return { ok: true, value: { command: "devices", options: { search: values.search, json: values.json } } };
    }
    if (first === "init") {
      const { values } = parseArgs({ args: [...rest], options: INIT_OPTIONS, allowPositionals: false, strict: true });
      if (values.help) return { ok: true, value: { command: "help" } };
      return { ok: true, value: { command: "init", options: { dryRun: values["dry-run"], debug: values.debug } } };
    }

    let checkArgs: string[];
    if (first === "check") checkArgs = [...rest];
    else if (first.startsWith("-") || looksLikeTarget(first)) checkArgs = [...argv];
    else return { ok: false, message: `Unknown command "${first}".`, debug };

    const { values, positionals } = parseArgs({ args: checkArgs, options: CHECK_OPTIONS, allowPositionals: true, strict: true });
    if (values.help) return { ok: true, value: { command: "help" } };
    if (positionals.length > 1) {
      return { ok: false, message: `Give one URL to check (got ${positionals.length}: ${positionals.join(" ")}).`, debug };
    }
    const parsed = checkSchema.safeParse({
      url: positionals[0],
      devices: values.devices,
      preset: values.preset,
      landscape: values.landscape,
      fullPage: values["full-page"],
      wait: values.wait,
      timeout: values.timeout,
      out: values.out,
      json: values.json,
      frame: !values["no-frame"],
      annotate: !values["no-annotate"],
      failOn: values["fail-on"],
      open: values.open,
      all: values.all,
      debug: values.debug,
    });
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid options.", debug };
    return { ok: true, value: { command: "check", options: parsed.data } };
  } catch (error) {
    return { ok: false, message: friendlyParseError(error), debug };
  }
}

export const HELP_TEXT = `phone-sim: check a web page on real phone and tablet screen sizes

  npx phone-sim check                   find your local dev server and check it
  npx phone-sim check localhost:5173    check a URL, a port (3000) or an .html file
  npx phone-sim init                    tell AI agents in this repo to run the check

Check options
  --preset <name>       common (default), phones or all-sizes
  --devices <id,id>     exact devices (list them with: phone-sim devices)
  --landscape           also check every device turned sideways
  --full-page           screenshot the whole page, not just the screen
  --json                print the report as JSON on stdout (for AI agents)
  --out <dir>           where screenshots and reports go (default: ./phone-sim-report)
  --fail-on <level>     exit 1 on: error (default), warn or never
  --open                open the HTML report when done
  --all                 list every issue and note (output is short by default)
  --wait <ms>           extra wait after the page loads (default: 500)
  --timeout <ms>        page load timeout (default: 30000)
  --no-frame            plain screenshots without the device drawn around them
  --no-annotate         no numbered boxes on the screenshots
  --debug               show full error details

Other commands
  phone-sim devices [--search <text>] [--json]   list device ids
  phone-sim init [--dry-run]                     add the check to AGENTS.md

Exit codes: 0 no problems, 1 problems found, 2 could not run the check.`;
