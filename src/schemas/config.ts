import {z} from "zod"

export const ConfigSchema = z
  .object({
    NTFY_URL: z.string().url("NTFY_URL must be a valid URL").optional().default("https://ntfy.sh"),
    NTFY_TOPIC: z.string().min(1, "NTFY_TOPIC cannot be empty"),
    NTFY_TOKEN: z.string().optional(),
    NTFY_USERNAME: z.string().optional(),
    NTFY_PASSWORD: z.string().optional(),
    BUSY_TIME: z.number().min(1, "BUSY_TIME must be at least 1 second").optional().default(20),
    AWAY_FROM_KEYBOARD_TIMEOUT: z.number().min(1).optional().nullable().default(null),
    LOCAL_CLICK_URL: z.string().optional(),
    REMOTE_CLICK_URL: z.string().optional(),
    CLICK_URL_PREFIX: z.string().optional(), // Deprecated: use REMOTE_CLICK_URL
  })
  .refine(data => !data.NTFY_USERNAME || Boolean(data.NTFY_PASSWORD), {
    message: "NTFY_PASSWORD is required when NTFY_USERNAME is set",
    path: ["NTFY_PASSWORD"],
  })

export type Config = z.infer<typeof ConfigSchema>
