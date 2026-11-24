import { z } from "zod";
import { cutoutSchema, deviceKindSchema, deviceSchema, platformSchema, type Device } from "./device";

export const CUSTOM_ID_PREFIX = "custom-";
export const CUSTOM_BRAND = "Custom";

const pixels = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .int(`${label} must be whole pixels`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);

/** What the "Custom device" form collects. Values arrive as strings and are coerced. */
export const customDeviceFormSchema = z
  .object({
    name: z.string().trim().min(1, "Give the device a name").max(40, "Keep the name under 40 characters"),
    width: pixels("Width", 200, 2000),
    height: pixels("Height", 200, 2000),
    dpr: z.coerce.number({ error: "Pixel ratio must be a number" }).min(1, "Pixel ratio must be at least 1").max(5, "Pixel ratio must be at most 5"),
    platform: platformSchema,
    kind: deviceKindSchema,
    cutout: cutoutSchema,
    screenRadius: pixels("Corner radius", 0, 80),
    color: z.string().regex(/^#[0-9a-f]{6}$/i, "Pick a colour"),
  })
  .refine((form) => form.width < form.height, { path: ["width"], message: "Enter the portrait size: width smaller than height" })
  .refine((form) => form.platform !== "ipados" || form.kind === "tablet", { path: ["platform"], message: "iPadOS is for tablets" })
  .refine((form) => form.screenRadius * 2 < form.width, { path: ["screenRadius"], message: "Corner radius is too large for this width" });

export type CustomDeviceFormInput = z.input<typeof customDeviceFormSchema>;
export type CustomDeviceForm = z.output<typeof customDeviceFormSchema>;

/** A stored custom device: an ordinary device whose id and brand mark it as custom. */
export const customDeviceSchema = deviceSchema.refine(
  (device) => device.id.startsWith(CUSTOM_ID_PREFIX) && device.brand === CUSTOM_BRAND,
  "Custom devices need a custom- id and the Custom brand",
);

const OS_VERSION = { ios: "18.0", ipados: "18.0", android: "15" } as const;

/** "custom-my-test-phone-lx3k2a": kebab-case, never clashes with catalog ids. */
export function newCustomDeviceId(name: string, now: number): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
    .replace(/-+$/g, "");
  return `${CUSTOM_ID_PREFIX}${slug ? `${slug}-` : ""}${now.toString(36)}`;
}

export function buildCustomDevice(form: CustomDeviceForm, id: string, year: number): Device {
  return customDeviceSchema.parse({
    id,
    name: form.name,
    brand: CUSTOM_BRAND,
    kind: form.kind,
    year,
    platform: form.platform,
    osVersion: OS_VERSION[form.platform],
    screen: { width: form.width, height: form.height },
    dpr: form.dpr,
    frame: {
      cutout: form.cutout,
      screenRadius: form.screenRadius,
      bezel: form.kind === "tablet" ? 20 : 12,
      color: form.color,
      crease: form.kind === "foldable",
    },
  });
}

/** Form values (as strings) for editing an existing device. */
export function customDeviceToForm(device: Device): Record<keyof CustomDeviceForm, string> {
  return {
    name: device.name,
    width: String(device.screen.width),
    height: String(device.screen.height),
    dpr: String(device.dpr),
    platform: device.platform,
    kind: device.kind,
    cutout: device.frame.cutout,
    screenRadius: String(device.frame.screenRadius),
    color: /^#[0-9a-f]{6}$/i.test(device.frame.color) ? device.frame.color : "#2b2b2d",
  };
}
