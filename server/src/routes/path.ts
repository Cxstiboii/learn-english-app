import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { completeStudyActivity, getStudyPath, StudyPathError } from '../services/studyPathService.js'

export const pathRouter = Router()
const activityIdSchema = z.string().trim().min(1).max(100)
const emptyBodySchema = z.object({}).strict()

pathRouter.use(requireAuth)

pathRouter.get('/', async (request, response, next) => {
  const userId = request.user?.id
  if (!userId) {
    response.status(401).json({ error: 'Authentication is required.' })
    return
  }

  try {
    response.json(await getStudyPath(userId))
  } catch (error) {
    next(error)
  }
})

pathRouter.post('/activities/:id/complete', async (request, response, next) => {
  const userId = request.user?.id
  const parsedId = activityIdSchema.safeParse(request.params.id)
  const body = emptyBodySchema.safeParse(request.body ?? {})

  if (!userId) {
    response.status(401).json({ error: 'Authentication is required.' })
    return
  }
  if (!parsedId.success || !body.success) {
    response.status(400).json({
      error: 'Invalid activity completion request.',
      details: body.success ? undefined : body.error.flatten(),
    })
    return
  }

  try {
    response.json(await completeStudyActivity(userId, parsedId.data))
  } catch (error) {
    if (error instanceof StudyPathError) {
      response.status(error.statusCode).json({ error: error.message, code: error.code })
      return
    }
    next(error)
  }
})
