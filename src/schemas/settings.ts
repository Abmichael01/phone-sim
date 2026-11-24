import { z } from "zod";
import { DEFAULT_DEVICE_ID } from "@/devices";
import { customBackgroundIdSchema } from "./customBackground";

export const DEFAULT_TABLET_ID = "ipad-pro-11-m4";
export const MAX_STAGE_SLOTS = 4;

export const deviceIdSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
export const slotIdSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
export const orientationSchema = z.enum(["portrait", "landscape"]);
export const zoomSchema = z.enum(["fit", "100", "75", "50"]);
/** frame = active device; screen = active site viewport; screen-bars = active screen + bars; all = every device on stage. */
export const screenshotModeSchema = z.enum(["frame", "screen", "screen-bars", "all"]);
export const themeSchema = z.enum(["dark", "light"]);
export const barThemeSchema = z.enum(["auto", "light", "dark"]);
export const recordTargetSchema = z.enum(["frame", "stage-bg", "screen"]);
export const captureQualitySchema = z.enum(["720p", "1080p", "2k", "native"]);
export const builtinStageBackgroundIdSchema = z.enum([
  "dark-dots",
  "cobalt-dots",
  "matte-obsidian",
  "matte-light",
  "chroma-green",
  "chroma-blue",
  "dark-topo",
  "cobalt-aurora",
  "code-bokeh",
  "cyber-horizon",
  "emerald-wave",
  "blueprint-grid",
]);

export const stageBackgroundIdSchema = z.union([builtinStageBackgroundIdSchema, customBackgroundIdSchema]);
export type StageBgChoice = z.infer<typeof stageBackgroundIdSchema>;

export const RECENT_DEVICES_LIMIT = 5;

export const deviceSlotSchema = z.object({
  slotId: slotIdSchema,
  deviceId: deviceIdSchema,
  orientation: orientationSchema,
});

export type DeviceSlot = z.infer<typeof deviceSlotSchema>;

/** Default multi-device workspace on first open: a flagship phone next to a tablet. */
export const DEFAULT_SLOTS: readonly DeviceSlot[] = [
  { slotId: "slot-phone", deviceId: DEFAULT_DEVICE_ID, orientation: "portrait" },
  { slotId: "slot-tablet", deviceId: DEFAULT_TABLET_ID, orientation: "portrait" },
];

/** Keeps 1..MAX_STAGE_SLOTS valid slots with unique ids; falls back to Phone + Tablet when missing or empty. */
const deviceSlotsSchema = z
  .array(z.unknown())
  .transform((raw): DeviceSlot[] => {
    const seen = new Set<string>();
    const valid: DeviceSlot[] = [];
    for (const item of raw) {
      const parsed = deviceSlotSchema.safeParse(item);
      if (!parsed.success || seen.has(parsed.data.slotId)) continue;
      seen.add(parsed.data.slotId);
      valid.push(parsed.data);
      if (valid.length >= MAX_STAGE_SLOTS) break;
    }
    return valid.length > 0 ? valid : DEFAULT_SLOTS.map((slot) => ({ ...slot }));
  })
  .catch(() => DEFAULT_SLOTS.map((slot) => ({ ...slot })));

/** Keeps only well-formed, unique device ids, newest first, at most RECENT_DEVICES_LIMIT. */
const recentDevicesSchema = z
  .array(z.unknown())
  .transform((ids) =>
    [...new Set(ids.filter((id): id is string => deviceIdSchema.safeParse(id).success))].slice(0, RECENT_DEVICES_LIMIT),
  )
  .catch([]);

/** Chosen finish name per device id. Bad entries are dropped one by one. */
const finishesSchema = z
  .record(z.string(), z.unknown())
  .transform((entries) =>
    Object.fromEntries(
      Object.entries(entries).filter(
        (entry): entry is [string, string] =>
          deviceIdSchema.safeParse(entry[0]).success && typeof entry[1] === "string" && entry[1].length > 0 && entry[1].length <= 40,
      ),
    ),
  )
  .catch({});

/**
 * Saved simulator preferences (chrome.storage.local). Each field falls back to
 * its default on its own, so one bad value never wipes the other settings and
 * settings saved by older versions still load (unknown keys are dropped).
 */
export const settingsSchema = z.object({
  deviceId: deviceIdSchema.catch(DEFAULT_DEVICE_ID),
  orientation: orientationSchema.catch("portrait"),
  slots: deviceSlotsSchema,
  zoom: zoomSchema.catch("fit"),
  screenshotMode: screenshotModeSchema.catch("frame"),
  screenshotIncludeBg: z.boolean().catch(false),
  transparentFrameShot: z.boolean().catch(true),
  captureQuality: captureQualitySchema.catch("1080p"),
  theme: themeSchema.catch("dark"),
  stageBg: stageBackgroundIdSchema.catch("dark-dots"),
  barTheme: barThemeSchema.catch("auto"),
  browserBars: z.boolean().catch(true),
  statusBar: z.boolean().catch(true),
  demoStatusBar: z.boolean().catch(false),
  touchCursor: z.boolean().catch(true),
  syncScroll: z.boolean().catch(true),
  syncNav: z.boolean().catch(true),
  recordTarget: recordTargetSchema.catch("frame"),
  autoScrollMode: z.boolean().catch(false),
  autoScrollSpeed: z.number().int().min(30).max(500).catch(120),
  autoScrollFromTop: z.boolean().catch(true),
  autoScrollDelayMs: z.number().int().min(0).max(5000).catch(1000),
  autoScrollStopAtBottom: z.boolean().catch(true),
  recentDeviceIds: recentDevicesSchema,
  finishes: finishesSchema,
});

export type Settings = z.output<typeof settingsSchema>;
export type Orientation = z.infer<typeof orientationSchema>;
export type Zoom = z.infer<typeof zoomSchema>;
export type ScreenshotMode = z.infer<typeof screenshotModeSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type BarTheme = z.infer<typeof barThemeSchema>;
export type RecordTarget = z.infer<typeof recordTargetSchema>;
export type CaptureQuality = z.infer<typeof captureQualitySchema>;

export const DEFAULT_SETTINGS: Settings = {
  deviceId: DEFAULT_DEVICE_ID,
  orientation: "portrait",
  slots: DEFAULT_SLOTS.map((slot) => ({ ...slot })),
  zoom: "fit",
  screenshotMode: "frame",
  screenshotIncludeBg: false,
  transparentFrameShot: true,
  captureQuality: "1080p",
  theme: "dark",
  stageBg: "dark-dots",
  barTheme: "auto",
  browserBars: true,
  statusBar: true,
  demoStatusBar: false,
  touchCursor: true,
  syncScroll: true,
  syncNav: true,
  recordTarget: "frame",
  autoScrollMode: false,
  autoScrollSpeed: 120,
  autoScrollFromTop: true,
  autoScrollDelayMs: 1000,
  autoScrollStopAtBottom: true,
  recentDeviceIds: [],
  finishes: {},
};
