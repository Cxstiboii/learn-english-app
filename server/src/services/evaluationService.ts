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

export async function saveEvaluationErrors(
  userId: string,
  errors: Array<z.infer<typeof languageErrorSchema>>,
) {
  if (errors.length === 0) return

  const { error } = await supabaseAdmin.rpc('record_error_patterns', {
    p_user_id: userId,
    p_patterns: errors.map(({ category, original, corrected }) => ({
      category,
      example: original,
      correction: corrected,
    })),
  })

  if (error) {
    throw new EvaluationServiceError(
      500,
      'EVALUATION_ERRORS_SAVE_FAILED',
      'The evaluation was saved, but its language errors could not be recorded.',
    )
  }
}

export function toEvaluationError(
  error: unknown,
): AIServiceError | EvaluationServiceError | undefined {
  return error instanceof AIServiceError || error instanceof EvaluationServiceError
    ? error
    : undefined
}
