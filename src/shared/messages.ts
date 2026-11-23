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

// Framed site (mobile-env.js) -> simulator page (window.postMessage)

/** mobile-env.ts posts this exact tag; it cannot import, so keep both in sync. */
export const FRAME_MESSAGE_SOURCE = "phone-sim:frame";

export const frameMessageSchema = z.object({
  source: z.literal(FRAME_MESSAGE_SOURCE),
  href: z.url(),
});

export type FrameMessage = z.infer<typeof frameMessageSchema>;
