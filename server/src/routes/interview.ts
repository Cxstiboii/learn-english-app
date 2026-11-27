import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { aiRateLimit } from '../middleware/aiRateLimit.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { toEvaluationError } from '../services/evaluationService.js'
import { evaluateInterview } from '../services/interviewEvaluationService.js'
import { getIdempotencyKey } from './evaluationRequest.js'

export const interviewRouter = Router()

const requestSchema = z.object({
  track: z.enum(['behavioral', 'system-design', 'role-salary']),
  answers: z.array(z.object({
    question: z.string().trim().min(1).max(500),
    transcript: z.string().trim().min(1).max(2500),
  }).strict()).min(1).max(5),
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

interviewRouter.use(requireAuth)

interviewRouter.post('/evaluate', aiRateLimit, async (request, response, next) => {
  const userId = getUserId(request, response)
  if (!userId) return

  const input = requestSchema.safeParse(request.body)
  if (!input.success) {
    response.status(400).json({
      error: 'Invalid interview evaluation request.',
      details: input.error.flatten(),
    })
    return
  }

  const idempotencyKey = getIdempotencyKey(request, response)
  if (!idempotencyKey) return

  try {
    const result = await evaluateInterview(userId, idempotencyKey, input.data)
    response.status(201).json(result)
  } catch (error) {
    handleEvaluationError(error, response, next)
  }
})
