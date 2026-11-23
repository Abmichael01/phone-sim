import { z } from "zod";

/**
 * The shape of one device in the catalog. Adding a phone = adding one object
 * that matches this schema to the right file in src/devices/catalog/.
 *
 * All sizes are CSS pixels (what a website sees), in PORTRAIT orientation.
 * Frames are drawn from these numbers with CSS; no device images are used.
 */

/** What sits at the top of the screen. */
export const cutoutSchema = z.enum([
  "dynamic-island", // iPhone 14 Pro and later: floating pill
  "notch", // iPhone X–14: wide notch from the top edge
  "punch-hole-center", // most Android phones: small round camera, centred
  "punch-hole-left", // some Samsung / older Android: round camera, top-left
  "waterdrop", // budget Android: small teardrop notch
  "home-button", // iPhone SE / 8 and older iPads: thick bezels, round button below
  "none", // tablets and phones with even bezels
]);

export const platformSchema = z.enum(["ios", "ipados", "android"]);

export const deviceKindSchema = z.enum(["phone", "tablet", "foldable"]);

export const deviceSchema = z.object({
  /** Stable, unique, kebab-case. Used in URLs and saved settings: never rename. */
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "kebab-case only"),
  /** Shown in the picker, e.g. "iPhone 16 Pro". */
  name: z.string().min(1),
  /** Groups the picker, e.g. "Apple", "Samsung", "Google". */
  brand: z.string().min(1),
  kind: deviceKindSchema,
  /** Release year, used to sort newest first. */
  year: z.number().int().min(2007).max(2100),
  platform: platformSchema,
  /** OS version used to build the User-Agent, e.g. "18.0" (iOS) or "14" (Android). */
  osVersion: z.string().min(1),
  /** Screen size in CSS px, portrait. */
  screen: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  /** Device pixel ratio (shown as info; the browser cannot fake it for a frame). */
  dpr: z.number().positive(),
  frame: z.object({
    cutout: cutoutSchema,
    /** Corner radius of the screen glass, CSS px. 0 for square screens. */
    screenRadius: z.number().nonnegative(),
    /** Bezel thickness around the screen, CSS px. */
    bezel: z.number().nonnegative(),
    /** Body colour (any CSS colour). */
    color: z.string().min(1).default("#1d1d1f"),
    /** Foldables: draw the fold crease down the middle of the inner screen. */
    crease: z.boolean().default(false),
  }),
  /**
   * true when the numbers are best-known estimates rather than confirmed specs.
   * The picker marks these with "≈" so it is clear they are approximate.
   */
  approx: z.boolean().default(false),
  /** Exact User-Agent to send. Leave empty to build one from platform + osVersion. */
  userAgent: z.string().min(1).optional(),
});

/** A device as written in the catalog files (defaults may be omitted). */
export type DeviceInput = z.input<typeof deviceSchema>;
/** A validated device with defaults filled in. */
export type Device = z.output<typeof deviceSchema>;
export type Cutout = z.infer<typeof cutoutSchema>;
export type Platform = z.infer<typeof platformSchema>;
export type DeviceKind = z.infer<typeof deviceKindSchema>;
