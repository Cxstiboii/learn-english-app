import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { getProgressSummary } from '../services/progressService.js'

export const progressRouter = Router()

progressRouter.use(requireAuth)

progressRouter.get('/summary', async (request, response, next) => {
  const userId = request.user?.id
  if (!userId) {
    response.status(401).json({ error: 'Authentication is required.' })
    return
  }

  try {
    response.json(await getProgressSummary(userId))
  } catch (error) {
    next(error)
  }
})
