import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { aiRateLimit } from '../middleware/aiRateLimit.js'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  createVocabCard,
  generateVocabCards,
  getDueCards,
  getVocabStats,
  reviewCard,
  toVocabError,
} from '../services/vocabService.js'

export const vocabRouter = Router()
const reviewRatingSchema = z.enum(['again', 'hard', 'good', 'easy'])

const manualCardSchema = z.object({
  term: z.string().trim().min(1).max(120),
  definition: z.string().trim().min(1).max(1000),
  example: z.string().trim().max(1000).optional(),
  deck: z.string().trim().max(80).optional(),
}).strict()

const generatedCardsSchema = z.object({
  topic: z.string().trim().min(1).max(200).optional(),
  count: z.number().int().min(1).max(20),
}).strict()

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
  const serviceError = toVocabError(error)
  if (serviceError) {
    response.status(serviceError.statusCode).json({
      error: serviceError.message,
      code: serviceError.code,
    })
    return
  }
  next(error)
}

vocabRouter.use(requireAuth)

vocabRouter.get('/due', async (request, response, next) => {
  const userId = getUserId(request, response)
  if (!userId) return

  try {
    const cards = await getDueCards(userId)
    response.json({ cards })
  } catch (error) {
    handleServiceError(error, response, next)
  }
})

vocabRouter.get('/stats', async (request, response, next) => {
  const userId = getUserId(request, response)
  if (!userId) return

  try {
    const stats = await getVocabStats(userId)
    response.json(stats)
  } catch (error) {
    handleServiceError(error, response, next)
  }
})

vocabRouter.post('/generate', aiRateLimit, async (request, response, next) => {
  const userId = getUserId(request, response)
  const input = generatedCardsSchema.safeParse(request.body)
  if (!userId) return
  if (!input.success) {
    response.status(400).json({
      error: 'Invalid vocabulary generation request.',
      details: input.error.flatten(),
    })
    return
  }

  try {
    const result = await generateVocabCards(userId, input.data.topic, input.data.count)
    response.status(201).json(result)
  } catch (error) {
    handleServiceError(error, response, next)
  }
})

vocabRouter.post('/', async (request, response, next) => {
  const userId = getUserId(request, response)
  const input = manualCardSchema.safeParse(request.body)
  if (!userId) return
  if (!input.success) {
    response.status(400).json({
      error: 'Invalid vocabulary card.',
      details: input.error.flatten(),
    })
    return
  }

  try {
    const card = await createVocabCard(userId, input.data)
    response.status(201).json({ card })
  } catch (error) {
    handleServiceError(error, response, next)
  }
})

vocabRouter.post('/:id/review', async (request, response, next) => {
  const userId = getUserId(request, response)
  const parsedId = z.string().uuid().safeParse(request.params.id)
  const input = z.object({ rating: reviewRatingSchema }).strict().safeParse(request.body)
  if (!userId) return
  if (!parsedId.success || !input.success) {
    response.status(400).json({
      error: 'Invalid vocabulary review.',
      details: input.success ? undefined : input.error.flatten(),
    })
    return
  }

  try {
    const card = await reviewCard(userId, parsedId.data, input.data.rating)
    response.json({ card })
  } catch (error) {
    handleServiceError(error, response, next)
  }
})
