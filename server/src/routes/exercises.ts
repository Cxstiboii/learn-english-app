import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { aiRateLimit } from '../middleware/aiRateLimit.js'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  answerExercise,
  generateExercises,
  getWeakSpots,
  toExerciseError,
} from '../services/exerciseService.js'

export const exercisesRouter = Router()
const generateRequestSchema = z.object({
  count: z.number().int().min(1).max(20),
  focusCategory: z.string().trim().min(1).max(80).optional(),
}).strict()
const answerRequestSchema = z.object({
  selectedOption: z.string().trim().min(1).max(500),
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
  const serviceError = toExerciseError(error)
  if (serviceError) {
    response.status(serviceError.statusCode).json({
      error: serviceError.message,
      code: serviceError.code,
    })
    return
  }
  next(error)
}

exercisesRouter.use(requireAuth)

exercisesRouter.get('/weak-spots', async (request, response, next) => {
  const userId = getUserId(request, response)
  if (!userId) return

  try {
    const weakSpots = await getWeakSpots(userId)
    response.json({ weakSpots })
  } catch (error) {
    handleServiceError(error, response, next)
  }
})

exercisesRouter.post('/generate', aiRateLimit, async (request, response, next) => {
  const userId = getUserId(request, response)
  const input = generateRequestSchema.safeParse(request.body)
  if (!userId) return
  if (!input.success) {
    response.status(400).json({
      error: 'Invalid exercise generation request.',
      details: input.error.flatten(),
    })
    return
  }

  try {
    const result = await generateExercises(
      userId,
      input.data.count,
      input.data.focusCategory,
    )
    response.status(201).json(result)
  } catch (error) {
    handleServiceError(error, response, next)
  }
})

exercisesRouter.post('/:id/answer', async (request, response, next) => {
  const userId = getUserId(request, response)
  const parsedId = z.string().uuid().safeParse(request.params.id)
  const input = answerRequestSchema.safeParse(request.body)
  if (!userId) return
  if (!parsedId.success || !input.success) {
    response.status(400).json({
      error: 'Invalid exercise answer.',
      details: input.success ? undefined : input.error.flatten(),
    })
    return
  }

  try {
    const result = await answerExercise(userId, parsedId.data, input.data.selectedOption)
    response.json(result)
  } catch (error) {
    handleServiceError(error, response, next)
  }
})
