import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { aiRateLimit } from '../middleware/aiRateLimit.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { toEvaluationError } from '../services/evaluationService.js'
import { evaluateSpeaking } from '../services/speakingEvaluationService.js'
import { getIdempotencyKey } from './evaluationRequest.js'

export const speakingRouter = Router()

const requestSchema = z.object({
  prompt: z.string().trim().min(1).max(2000),
  transcript: z.string().trim().min(1).max(12000),
  durationSeconds: z.number().int().min(1).max(3600),
}).strict()

function getUserId(request: Request, response: Response) {
  const userId = request.user?.id
  if (!userId) {
    response.status(401).json({ error: 'Authentication is required.' })
    return undefined
  }
  return userId
}

function handleEvaluationError(error: unknown, response: Response, next: NextFunction) {
  const evaluationError = toEvaluationError(error)
  if (evaluationError) {
    response.status(evaluationError.statusCode).json({
      error: evaluationError.message,
      code: evaluationError.code,
    })
    return
  }
  next(error)
}

speakingRouter.use(requireAuth)

speakingRouter.post('/evaluate', aiRateLimit, async (request, response, next) => {
  const userId = getUserId(request, response)
  if (!userId) return

  const input = requestSchema.safeParse(request.body)
  if (!input.success) {
    response.status(400).json({
      error: 'Invalid speaking evaluation request.',
      details: input.error.flatten(),
    })
    return
  }

  const idempotencyKey = getIdempotencyKey(request, response)
  if (!idempotencyKey) return

  try {
    const result = await evaluateSpeaking(userId, idempotencyKey, input.data)
    response.status(201).json(result)
  } catch (error) {
    handleEvaluationError(error, response, next)
  }
})
