import { z } from 'zod'
import { supabaseAdmin } from '../config/supabase.js'

const placementQuestionRowSchema = z.object({
  id: z.string().uuid(),
  level: z.string(),
  skill: z.string(),
  prompt: z.string(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
  }).strict()),
  correct_option: z.string(),
  explanation: z.string(),
}).strict().superRefine((question, context) => {
  const optionIds = question.options.map(({ id }) => id)
  if (new Set(optionIds).size !== optionIds.length) {
    context.addIssue({
      code: 'custom',
      path: ['options'],
      message: 'Placement question options must be unique.',
    })
  }
  if (!optionIds.includes(question.correct_option)) {
    context.addIssue({
      code: 'custom',
      path: ['correct_option'],
      message: 'Placement question answer must match an option.',
    })
  }
})

const placementQuestionRowsSchema = z.array(placementQuestionRowSchema)
const levelOrder = ['A2', 'B1', 'B1+', 'B2'] as const
const minimumCorrectPerLevel = 4
const expectedQuestionCount = 24

function throwOnQueryError(error: { message: string } | null, operation: string): void {
  if (error) {
    console.error('[database] placement query failed', { operation })
    throw new Error('Unable to complete this placement request.')
  }
}

async function getPlacementQuestionRows() {
  const { data, error } = await supabaseAdmin
    .from('placement_questions')
    .select('id, level, skill, prompt, options, correct_option, explanation')
    .order('id', { ascending: true })

  throwOnQueryError(error, 'read placement questions')
  const parsedRows = placementQuestionRowsSchema.safeParse(data)
  if (!parsedRows.success || parsedRows.data.length !== expectedQuestionCount) {
    console.error('[database] placement question data is invalid')
    throw new Error('Unable to load the placement test.')
  }

  return parsedRows.data
}

export async function getPlacementQuestions() {
  const questions = await getPlacementQuestionRows()
  return {
    questions: questions.map(({ id, level, skill, prompt, options }) => ({
      id,
      level,
      skill,
      prompt,
      options,
    })),
  }
}

interface PlacementAnswerInput {
  questionId: string
  selectedOption: string
}

export async function submitPlacementAttempt(userId: string, answers: PlacementAnswerInput[]) {
  const questions = await getPlacementQuestionRows()
  const answersById = new Map(answers.map(({ questionId, selectedOption }) => [questionId, selectedOption]))
  if (answersById.size !== questions.length || answers.length !== questions.length) {
    throw new Error('The placement test answers are incomplete.')
  }

  let correctCount = 0
  const correctByLevel = new Map<string, number>()

  for (const question of questions) {
    const selectedOption = answersById.get(question.id)
    if (!selectedOption || !question.options.some(({ id }) => id === selectedOption)) {
      throw new Error('The placement test answers are invalid.')
    }
    if (selectedOption === question.correct_option) {
      correctCount += 1
      correctByLevel.set(question.level, (correctByLevel.get(question.level) ?? 0) + 1)
    }
  }

  let estimatedLevel: (typeof levelOrder)[number] = 'A2'
  for (const level of levelOrder) {
    if ((correctByLevel.get(level) ?? 0) >= minimumCorrectPerLevel) {
      estimatedLevel = level
    }
  }

  const score = Math.round((correctCount / questions.length) * 100)
  const { data: attempt, error } = await supabaseAdmin
    .from('placement_attempts')
    .insert({
      user_id: userId,
      answers: Object.fromEntries(answersById),
      score,
      estimated_level: estimatedLevel,
    })
    .select('id')
    .single()

  throwOnQueryError(error, 'save placement attempt')
  if (!attempt) {
    throw new Error('Unable to save the placement test.')
  }

  return { attemptId: attempt.id, score, estimatedLevel }
}
