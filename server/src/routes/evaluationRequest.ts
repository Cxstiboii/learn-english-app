import type { Request, Response } from 'express'
import { z } from 'zod'

const idempotencyKeySchema = z.string().uuid()

export function getIdempotencyKey(request: Request, response: Response) {
  const parsed = idempotencyKeySchema.safeParse(request.header('Idempotency-Key'))
  if (!parsed.success) {
    response.status(400).json({ error: 'A valid Idempotency-Key header is required.' })
    return undefined
  }

  return parsed.data
}
