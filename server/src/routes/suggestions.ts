import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { aiRateLimit } from '../middleware/aiRateLimit.js'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  acceptProfileSuggestion,
  dismissProfileSuggestion,
  getProfileSuggestions,
  toProfileSuggestionError,
} from '../services/profileSuggestionService.js'

export const suggestionsRouter = Router()
const suggestionIdSchema = z.string().uuid()
const emptyBodySchema = z.object({}).strict()

function getUserId(request: Request, response: Response) {
  const userId = request.user?.id
  if (!userId) {
    response.status(401).json({ error: 'Authentication is required.' })
    return undefined
  }
  return userId
}

function handleServiceError(
  error: unknown,
  response: Response,
  next: NextFunction,
) {
  const serviceError = toProfileSuggestionError(error)
  if (serviceError) {
    response.status(serviceError.statusCode).json({
      error: serviceError.message,
      code: serviceError.code,
    })
    return
  }
  next(error)
}

suggestionsRouter.use(requireAuth)

suggestionsRouter.get('/', aiRateLimit, async (request, response, next) => {
  const userId = getUserId(request, response)
  if (!userId) return

  try {
    const suggestions = await getProfileSuggestions(userId)
    response.json({ suggestions })
  } catch (error) {
    handleServiceError(error, response, next)
  }
})

suggestionsRouter.post('/:id/accept', async (request, response, next) => {
  const userId = getUserId(request, response)
  const suggestionId = suggestionIdSchema.safeParse(request.params.id)
  if (!userId) return
  const body = emptyBodySchema.safeParse(request.body ?? {})
  if (!suggestionId.success || !body.success) {
    response.status(400).json({ error: 'Invalid suggestion request.' })
    return
  }

  try {
    response.json(await acceptProfileSuggestion(userId, suggestionId.data))
  } catch (error) {
    handleServiceError(error, response, next)
  }
})

suggestionsRouter.post('/:id/dismiss', async (request, response, next) => {
  const userId = getUserId(request, response)
  const suggestionId = suggestionIdSchema.safeParse(request.params.id)
  if (!userId) return
  const body = emptyBodySchema.safeParse(request.body ?? {})
  if (!suggestionId.success || !body.success) {
    response.status(400).json({ error: 'Invalid suggestion request.' })
    return
  }

  try {
    response.json(await dismissProfileSuggestion(userId, suggestionId.data))
  } catch (error) {
    handleServiceError(error, response, next)
  }
})
