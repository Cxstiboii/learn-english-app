import 'dotenv/config'
import { z } from 'zod'

const configSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  CLIENT_ORIGIN: z.string().url().transform((value) => new URL(value).origin).default('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DAILY_STREAK_GOAL_FRACTION: z.coerce.number().gt(0).max(1).default(0.5),
  AI_PROVIDER: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),
})

const result = configSchema.safeParse({
  ...process.env,
})

if (!result.success) {
  throw new Error(`Invalid server environment: ${result.error.message}`)
}

export const config = result.data
