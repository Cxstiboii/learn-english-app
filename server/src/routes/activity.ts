import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { logActivityMinutes } from '../services/progressService.js'

export const activityRouter = Router()
const activityLogSchema = z.object({
  minutes: z.number().int().min(1).max(1440),
}).strict()

activityRouter.use(requireAuth)

activityRouter.post('/log', async (request, response, next) => {
  const userId = request.user?.id
  const input = activityLogSchema.safeParse(request.body)

  if (!userId) {
    response.status(401).json({ error: 'Authentication is required.' })
    return
  }
  if (!input.success) {
    response.status(400).json({
      error: 'Invalid activity log request.',
      details: input.error.flatten(),
    })
    return
  }

  try {
    response.status(201).json(await logActivityMinutes(userId, input.data.minutes))
  } catch (error) {
    next(error)
  }
})
