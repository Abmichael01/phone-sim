import { z } from "zod";
import { DEFAULT_DEVICE_ID } from "@/devices";

export const orientationSchema = z.enum(["portrait", "landscape"]);
export const zoomSchema = z.enum(["fit", "100", "75", "50"]);
export const screenshotModeSchema = z.enum(["frame", "screen"]);

/**
 * Saved simulator preferences (chrome.storage.local). Each field falls back to
 * its default on its own, so one bad value never wipes the other settings.
 */
export const settingsSchema = z.object({
  deviceId: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).catch(DEFAULT_DEVICE_ID),
  orientation: orientationSchema.catch("portrait"),
  zoom: zoomSchema.catch("fit"),
  screenshotMode: screenshotModeSchema.catch("frame"),
  sidebarOpen: z.boolean().catch(true),
});

export type Settings = z.output<typeof settingsSchema>;
export type Orientation = z.infer<typeof orientationSchema>;
export type Zoom = z.infer<typeof zoomSchema>;
export type ScreenshotMode = z.infer<typeof screenshotModeSchema>;

export const DEFAULT_SETTINGS: Settings = {
  deviceId: DEFAULT_DEVICE_ID,
  orientation: "portrait",
  zoom: "fit",
  screenshotMode: "frame",
  sidebarOpen: true,
};
