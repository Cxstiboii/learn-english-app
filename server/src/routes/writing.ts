import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { aiRateLimit } from '../middleware/aiRateLimit.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { toEvaluationError } from '../services/evaluationService.js'
import { evaluateWriting } from '../services/writingEvaluationService.js'

export const writingRouter = Router()

const requestSchema = z.object({
  examMode: z.enum(['toefl', 'ielts']),
  prompt: z.string().trim().min(1).max(2000),
  response: z.string().trim().min(1).max(16000),
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

writingRouter.use(requireAuth)

writingRouter.post('/grade', aiRateLimit, async (request, response, next) => {
  const userId = getUserId(request, response)
  const input = requestSchema.safeParse(request.body)
  if (!userId) return
  if (!input.success) {
    response.status(400).json({
      error: 'Invalid writing evaluation request.',
      details: input.error.flatten(),
    })
    return
  }

  try {
    const result = await evaluateWriting(userId, input.data)
    response.status(201).json(result)
  } catch (error) {
    handleEvaluationError(error, response, next)
  }
})
