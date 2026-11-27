import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  getPlacementQuestions,
  submitPlacementAttempt,
} from '../services/placementService.js'

export const placementRouter = Router()
const answerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOption: z.enum(['A', 'B', 'C', 'D']),
}).strict()
const placementSubmissionSchema = z.object({
  answers: z.array(answerSchema).length(24),
}).strict().superRefine(({ answers }, context) => {
  if (new Set(answers.map(({ questionId }) => questionId)).size !== answers.length) {
    context.addIssue({
      code: 'custom',
      path: ['answers'],
      message: 'Each question may only be answered once.',
    })
  }
})

placementRouter.use(requireAuth)

placementRouter.get('/questions', async (_request, response, next) => {
  try {
    response.json(await getPlacementQuestions())
  } catch (error) {
    next(error)
  }
})

placementRouter.post('/attempts', async (request, response, next) => {
  const userId = request.user?.id
  const body = placementSubmissionSchema.safeParse(request.body)
  if (!userId) {
    response.status(401).json({ error: 'Authentication is required.' })
    return
  }
  if (!body.success) {
    response.status(400).json({
      error: 'Invalid placement test submission.',
      details: body.error.flatten(),
    })
    return
  }

  try {
    response.json(await submitPlacementAttempt(userId, body.data.answers))
  } catch (error) {
    next(error)
  }
})
