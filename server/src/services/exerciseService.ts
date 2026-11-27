import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { supabaseAdmin } from '../config/supabase.js'
import { exercisesSystemPrompt } from '../prompts/exercises.js'
import { AIServiceError, generateJSON } from './ai/aiClient.js'
import { buildLearnerContext, renderStudentText } from './learnerContext.js'

const errorPatternSchema = z.object({
  id: z.string().uuid(),
  category: z.string().min(1),
  example: z.string(),
  correction: z.string(),
  count: z.number().int().positive(),
  last_seen_at: z.string(),
})

const errorPatternsSchema = z.array(errorPatternSchema)

const exerciseQuestionFieldsSchema = z.object({
  prompt: z.string().trim().min(1).max(1000),
  options: z.array(z.string().trim().min(1).max(500)).length(3),
  correctAnswer: z.string().trim().min(1).max(500),
  explanation: z.string().trim().min(1).max(1000),
  focusCategory: z.string().trim().min(1).max(100),
}).strict()

function validateQuestionOptions(
  question: z.infer<typeof exerciseQuestionFieldsSchema>,
  context: z.RefinementCtx,
) {
  const uniqueOptions = new Set(question.options.map((option) => option.toLocaleLowerCase('en-US')))
  if (uniqueOptions.size !== 3) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['options'],
      message: 'The answer options must be distinct.',
    })
  }
  if (!question.options.includes(question.correctAnswer)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['correctAnswer'],
      message: 'The correct answer must match one of the options.',
    })
  }
}

const questionWithPatternSchema = exerciseQuestionFieldsSchema.extend({
  focusPatternId: z.string().uuid().nullable(),
}).superRefine(validateQuestionOptions)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeGeneratedExerciseQuestion(value: unknown): unknown {
  if (!isRecord(value)) return value

  const { question, ...rest } = value
  if (typeof question !== 'string') return value
  if (typeof rest.prompt === 'string') return rest
  return { ...rest, prompt: question }
}

const generatedQuestionSchema = z.preprocess(
  normalizeGeneratedExerciseQuestion,
  questionWithPatternSchema,
)
const storedQuestionSchema = questionWithPatternSchema

export class ExerciseServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ExerciseServiceError'
  }
}

function normalizeCategory(category: string) {
  return category.trim().toLocaleLowerCase('en-US')
}

export async function getWeakSpots(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('error_patterns')
    .select('id, category, example, correction, count, last_seen_at')
    .eq('user_id', userId)
    .order('count', { ascending: false })
    .order('last_seen_at', { ascending: false })
    .limit(5)

  if (error) {
    throw new ExerciseServiceError(500, 'WEAK_SPOTS_FAILED', 'Unable to load your error patterns.')
  }
  const parsed = errorPatternsSchema.safeParse(data ?? [])
  if (!parsed.success) {
    throw new ExerciseServiceError(500, 'WEAK_SPOTS_INVALID', 'Your error pattern data is invalid.')
  }
  return parsed.data
}

export async function generateExercises(
  userId: string,
  count: number,
  focusCategory?: string,
) {
  let patternsQuery = supabaseAdmin
    .from('error_patterns')
    .select('id, category, example, correction, count, last_seen_at')
    .eq('user_id', userId)
  if (focusCategory) patternsQuery = patternsQuery.eq('category', focusCategory)

  const [learnerContext, patternsResult] = await Promise.all([
    buildLearnerContext(userId),
    patternsQuery
      .order('count', { ascending: false })
      .order('last_seen_at', { ascending: false })
      .limit(focusCategory ? 20 : 5),
  ])

  if (patternsResult.error) {
    throw new ExerciseServiceError(500, 'EXERCISE_CONTEXT_FAILED', 'Unable to load your learning context.')
  }

  const parsedPatterns = errorPatternsSchema.safeParse(patternsResult.data ?? [])
  if (!parsedPatterns.success) {
    throw new ExerciseServiceError(500, 'WEAK_SPOTS_INVALID', 'Your error pattern data is invalid.')
  }

  const patterns = parsedPatterns.data
  if (focusCategory && !patterns.some(
    (pattern) => normalizeCategory(pattern.category) === normalizeCategory(focusCategory),
  )) {
    throw new ExerciseServiceError(
      404,
      'FOCUS_PATTERN_NOT_FOUND',
      'That error pattern is no longer available for focused practice.',
    )
  }
  const hasWeakSpots = patterns.length > 0
  const weakSpotContext = hasWeakSpots
    ? patterns.map((pattern) => JSON.stringify(pattern)).join('\n')
    : 'No saved error patterns. Focus on common B1+ grammar used in technical English.'
  const system = exercisesSystemPrompt(learnerContext, count)
  const questionSetSchema = z.array(generatedQuestionSchema).length(count).superRefine((questions, context) => {
    const prompts = new Set<string>()
    const patternsById = new Map(patterns.map((pattern) => [pattern.id, pattern]))
    questions.forEach((question, index) => {
      const normalizedPrompt = question.prompt.toLocaleLowerCase('en-US')
      if (prompts.has(normalizedPrompt)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'prompt'],
          message: 'Generated questions must be distinct.',
        })
      }
      prompts.add(normalizedPrompt)

      const matchingPattern = question.focusPatternId
        ? patternsById.get(question.focusPatternId)
        : undefined
      if (hasWeakSpots && (
        !matchingPattern ||
        normalizeCategory(question.focusCategory) !== normalizeCategory(matchingPattern.category)
      )) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'focusPatternId'],
          message: 'Focus pattern ID and category must match a supplied error pattern.',
        })
      }
      if (!hasWeakSpots && question.focusPatternId !== null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'focusPatternId'],
          message: 'Focus pattern ID must be null when no error patterns are available.',
        })
      }
    })
  })
  const generated = await generateJSON({
    system,
    messages: [{
      role: 'user',
      content: renderStudentText(`Recent error patterns:\n${weakSpotContext}`),
    }],
    schema: questionSetSchema,
    maxTokens: Math.min(count * 240, 4096),
  })

  const storedQuestions = generated.map((question) => {
    const matchingPattern = question.focusPatternId
      ? patterns.find((pattern) => pattern.id === question.focusPatternId)
      : undefined
    return {
      ...question,
      focusCategory: matchingPattern?.category ?? question.focusCategory,
      focusPatternId: matchingPattern?.id ?? null,
    }
  })
  const exerciseIds = storedQuestions.map(() => randomUUID())
  const { error: saveError } = await supabaseAdmin
    .from('exercises')
    .insert(storedQuestions.map((question, index) => ({
      id: exerciseIds[index],
      user_id: userId,
      question,
    })))

  if (saveError) {
    throw new ExerciseServiceError(500, 'EXERCISE_SAVE_FAILED', 'Unable to save the generated exercises.')
  }

  return {
    exercises: storedQuestions.map((question, index) => ({
      id: exerciseIds[index],
      prompt: question.prompt,
      options: question.options,
      focusCategory: question.focusCategory,
    })),
  }
}

export async function answerExercise(
  userId: string,
  exerciseId: string,
  selectedOption: string,
) {
  const { data: exercise, error } = await supabaseAdmin
    .from('exercises')
    .select('id, question')
    .eq('id', exerciseId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new ExerciseServiceError(500, 'EXERCISE_LOOKUP_FAILED', 'Unable to load this exercise.')
  }
  if (!exercise) {
    throw new ExerciseServiceError(404, 'EXERCISE_NOT_FOUND', 'Exercise not found.')
  }

  const parsedQuestion = storedQuestionSchema.safeParse(exercise.question)
  if (!parsedQuestion.success) {
    throw new ExerciseServiceError(500, 'EXERCISE_DATA_INVALID', 'This exercise has invalid stored data.')
  }
  const question = parsedQuestion.data
  if (!question.options.includes(selectedOption)) {
    throw new ExerciseServiceError(400, 'OPTION_INVALID', 'Select one of the options shown for this exercise.')
  }

  const isCorrect = selectedOption === question.correctAnswer
  const { error: recordError } = await supabaseAdmin.rpc('record_exercise_answer', {
    p_user_id: userId,
    p_exercise_id: exerciseId,
    p_selected_option: selectedOption,
    p_is_correct: isCorrect,
    p_focus_pattern_id: question.focusPatternId,
    p_focus_category: question.focusCategory,
    p_example: selectedOption,
    p_correction: question.correctAnswer,
  })

  if (recordError) {
    throw new ExerciseServiceError(500, 'EXERCISE_ANSWER_SAVE_FAILED', 'Unable to save this exercise attempt.')
  }

  return {
    isCorrect,
    explanation: question.explanation,
    ...(!isCorrect ? { correctAnswer: question.correctAnswer } : {}),
  }
}

export function toExerciseError(
  error: unknown,
): AIServiceError | ExerciseServiceError | undefined {
  return error instanceof AIServiceError || error instanceof ExerciseServiceError
    ? error
    : undefined
}
