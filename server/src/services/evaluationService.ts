import { z } from 'zod'
import { supabaseAdmin } from '../config/supabase.js'
import { AIServiceError } from './ai/aiClient.js'

export const evaluationDisclaimer = 'Estimated score, not an official result.' as const

export const languageErrorSchema = z.object({
  category: z.string().trim().min(1).max(80),
  original: z.string().trim().min(1).max(1000),
  corrected: z.string().trim().min(1).max(1000),
  explanation: z.string().trim().min(1).max(1000),
}).strict()

export class EvaluationServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'EvaluationServiceError'
  }
}

export const scoreSchema = z.number().min(0).max(9).refine(
  (score) => Number.isInteger(score * 2),
  'Score must use half-band increments.',
)

export const cefrSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])

export type EvaluationType = 'speaking' | 'writing' | 'interview'

export async function saveEvaluationAtomically<T>({
  userId,
  idempotencyKey,
  type,
  evaluation,
  patterns,
  resultSchema,
  errorCode,
  errorMessage,
}: {
  userId: string
  idempotencyKey: string
  type: EvaluationType
  evaluation: Record<string, unknown>
  patterns: Array<z.infer<typeof languageErrorSchema>>
  resultSchema: z.ZodType<T>
  errorCode: string
  errorMessage: string
}): Promise<T> {
  const { data, error } = await supabaseAdmin.rpc('save_evaluation_atomically', {
    p_user_id: userId,
    p_idempotency_key: idempotencyKey,
    p_evaluation_type: type,
    p_evaluation: evaluation,
    p_patterns: patterns.map(({ category, original, corrected }) => ({
      category,
      example: original,
      correction: corrected,
    })),
  })

  if (error) {
    throw new EvaluationServiceError(500, errorCode, errorMessage)
  }

  const result = resultSchema.safeParse(data)
  if (!result.success) {
    throw new EvaluationServiceError(500, errorCode, errorMessage)
  }

  return result.data
}

export function toEvaluationError(
  error: unknown,
): AIServiceError | EvaluationServiceError | undefined {
  return error instanceof AIServiceError || error instanceof EvaluationServiceError
    ? error
    : undefined
}
