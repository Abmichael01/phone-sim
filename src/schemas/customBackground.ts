import { z } from "zod";

export const MAX_CUSTOM_BACKGROUNDS = 6;
export const MAX_CUSTOM_BG_DATA_URL_LENGTH = 1_500_000;

export const customBackgroundIdSchema = z.string().regex(/^custom-bg-[a-z0-9-]+$/);

export const customBackgroundSchema = z.object({
  id: customBackgroundIdSchema,
  name: z.string().trim().min(1).max(40),
  dataUrl: z
    .string()
    .regex(/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/)
    .max(MAX_CUSTOM_BG_DATA_URL_LENGTH),
});

export type CustomBackground = z.infer<typeof customBackgroundSchema>;
