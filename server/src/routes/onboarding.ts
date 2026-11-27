import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/requireAuth.js'
import { completeOnboarding, getOnboardingStatus } from '../services/onboardingService.js'

export const onboardingRouter = Router()
const levelSchema = z.enum(['A2', 'B1', 'B1+', 'B2', 'C1'])
const goalSchema = z.enum([
  'remote_job',
  'interviews',
  'toefl',
  'ielts',
  'daily_fluency',
  'read_docs',
])
const focusSkillSchema = z.enum(['speaking', 'listening', 'writing', 'vocab_grammar'])
const examDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsedDate = new Date(`${value}T00:00:00.000Z`)
    return !Number.isNaN(parsedDate.getTime())
      && parsedDate.toISOString().slice(0, 10) === value
  })

const preferencesSchema = z.object({
  goals: z.array(goalSchema).min(1).max(6),
  examTarget: z.enum(['toefl', 'ielts', 'none']),
  examTargetScore: z.number().min(0).nullable(),
  examDate: examDateSchema.nullable(),
  levelSource: z.enum(['self', 'placement', 'ai_estimate']),
  focusSkills: z.array(focusSkillSchema).length(4),
  softwareArea: z.enum([
    'frontend',
    'backend',
    'fullstack',
    'data',
    'devops',
    'mobile',
    'qa',
    'other',
    'none',
  ]),
  interests: z.array(z.string().trim().min(1).max(80)).max(5),
  aboutMe: z.string().max(200).nullable(),
  studyDays: z.array(z.number().int().min(1).max(7)).min(1).max(7),
  correctionStyle: z.enum(['every_error', 'major_errors', 'end_of_session']),
  explanationLanguage: z.enum(['english_only', 'spanish_support', 'mixed']),
  tone: z.enum(['friendly', 'professional', 'challenging']),
  replyLength: z.enum(['short', 'medium', 'detailed']),
  accent: z.enum(['us', 'uk']),
  saveTranscripts: z.boolean(),
}).strict()

const completeRequestSchema = z.object({
  currentLevel: levelSchema,
  targetLevel: levelSchema,
  dailyGoalMinutes: z.number().int().min(1).max(1440),
  preferences: preferencesSchema,
}).strict().superRefine((input, context) => {
  const hasExamGoal = input.preferences.goals.includes('toefl')
    || input.preferences.goals.includes('ielts')
  if (hasExamGoal === (input.preferences.examTarget === 'none')) {
    context.addIssue({
      code: 'custom',
      path: ['preferences', 'examTarget'],
      message: 'Choose a test target when TOEFL or IELTS is a goal.',
    })
  }
  if (new Set(input.preferences.focusSkills).size !== input.preferences.focusSkills.length) {
    context.addIssue({
      code: 'custom',
      path: ['preferences', 'focusSkills'],
      message: 'Each focus skill must be unique.',
    })
  }
  if (new Set(input.preferences.goals).size !== input.preferences.goals.length) {
    context.addIssue({
      code: 'custom',
      path: ['preferences', 'goals'],
      message: 'Each learning goal must be unique.',
    })
  }
  if (new Set(input.preferences.studyDays).size !== input.preferences.studyDays.length) {
    context.addIssue({
      code: 'custom',
      path: ['preferences', 'studyDays'],
      message: 'Each study day must be unique.',
    })
  }
  if (input.preferences.examTarget === 'ielts' && (input.preferences.examTargetScore ?? 0) > 9) {
    context.addIssue({
      code: 'custom',
      path: ['preferences', 'examTargetScore'],
      message: 'IELTS scores must be 9 or lower.',
    })
  }
  if (input.preferences.examTarget === 'toefl' && (input.preferences.examTargetScore ?? 0) > 120) {
    context.addIssue({
      code: 'custom',
      path: ['preferences', 'examTargetScore'],
      message: 'TOEFL scores must be 120 or lower.',
    })
  }
})

onboardingRouter.use(requireAuth)

onboardingRouter.get('/status', async (request, response, next) => {
  const userId = request.user?.id
  if (!userId) {
    response.status(401).json({ error: 'Authentication is required.' })
    return
  }

  try {
    response.json(await getOnboardingStatus(userId))
  } catch (error) {
    next(error)
  }
})

onboardingRouter.post('/complete', async (request, response, next) => {
  const userId = request.user?.id
  const body = completeRequestSchema.safeParse(request.body)
  if (!userId) {
    response.status(401).json({ error: 'Authentication is required.' })
    return
  }
  if (!body.success) {
    response.status(400).json({
      error: 'Invalid onboarding request.',
      details: body.error.flatten(),
    })
    return
  }

  try {
    response.json(await completeOnboarding(userId, body.data))
  } catch (error) {
    next(error)
  }
})
