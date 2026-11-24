import { z } from "zod";

/** Typed messages between the simulator page, the background worker and the framed site. */

// Simulator page -> background (chrome.runtime.sendMessage)

export const applyDeviceRequestSchema = z.object({
  type: z.literal("phone-sim:apply-device"),
  deviceId: z.string().min(1),
});

export const backgroundRequestSchema = z.discriminatedUnion("type", [applyDeviceRequestSchema]);

export type BackgroundRequest = z.infer<typeof backgroundRequestSchema>;

export const backgroundResponseSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true) }),
  z.object({ ok: z.literal(false), error: z.string() }),
]);

export type BackgroundResponse = z.infer<typeof backgroundResponseSchema>;

/** Asks the background to point this tab's header rules at `deviceId`. */
export async function requestApplyDevice(deviceId: string): Promise<BackgroundResponse> {
  const request: BackgroundRequest = { type: "phone-sim:apply-device", deviceId };
  const raw: unknown = await chrome.runtime.sendMessage(request);
  const parsed = backgroundResponseSchema.safeParse(raw);
  return parsed.success ? parsed.data : { ok: false, error: "The extension background did not answer." };
}

// Framed site (mobile-env.js) <-> simulator page (window.postMessage).
// mobile-env.ts cannot import, so it repeats these tags and shapes: keep both in sync.

export const FRAME_MESSAGE_SOURCE = "phone-sim:frame";
export const PARENT_MESSAGE_SOURCE = "phone-sim:parent";

/** How the frame got to its current URL: a new document, history push/replace, or back/forward/hash. */
export const frameNavSchema = z.enum(["load", "push", "replace", "pop"]);
export type FrameNav = z.infer<typeof frameNavSchema>;

export const frameNavMessageSchema = z.object({
  source: z.literal(FRAME_MESSAGE_SOURCE),
  kind: z.literal("nav"),
  href: z.url(),
  nav: frameNavSchema,
});

export const frameScrollMessageSchema = z.object({
  source: z.literal(FRAME_MESSAGE_SOURCE),
  kind: z.literal("scroll"),
  ratioX: z.number().min(0).max(1),
  ratioY: z.number().min(0).max(1),
});

export const frameFocusMessageSchema = z.object({
  source: z.literal(FRAME_MESSAGE_SOURCE),
  kind: z.literal("focus"),
});

export const frameAutoScrollDoneSchema = z.object({
  source: z.literal(FRAME_MESSAGE_SOURCE),
  kind: z.literal("auto-scroll-done"),
});

export const frameMessageSchema = z.discriminatedUnion("kind", [
  frameNavMessageSchema,
  frameScrollMessageSchema,
  frameFocusMessageSchema,
  frameAutoScrollDoneSchema,
]);

export type FrameMessage = z.infer<typeof frameMessageSchema>;

/** Commands the simulator sends into the frame. */
export type ParentMessage =
  | { source: typeof PARENT_MESSAGE_SOURCE; cmd: "back" }
  | { source: typeof PARENT_MESSAGE_SOURCE; cmd: "forward" }
  | { source: typeof PARENT_MESSAGE_SOURCE; cmd: "config"; touchCursor: boolean; syncScroll: boolean }
  | { source: typeof PARENT_MESSAGE_SOURCE; cmd: "scroll"; ratioX: number; ratioY: number }
  | { source: typeof PARENT_MESSAGE_SOURCE; cmd: "spa-nav"; href: string; replace: boolean }
  | {
      source: typeof PARENT_MESSAGE_SOURCE;
      cmd: "auto-scroll-start";
      speed: number;
      fromTop: boolean;
      delayMs: number;
      stopAtBottom: boolean;
    }
  | { source: typeof PARENT_MESSAGE_SOURCE; cmd: "auto-scroll-stop" };
