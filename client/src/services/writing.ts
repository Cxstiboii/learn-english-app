import { apiFetch } from './api'
import type { WritingCriterion, WritingEvaluation, WritingMode } from '../types/writing'

interface WritingGradeResult {
  submissionId: string
  scores: Record<WritingCriterion, number>
  estimatedBand: number
  suggestions: string[]
  corrections: WritingEvaluation['corrections']
  disclaimer: string
  wordCount: number
}

export async function gradeWriting(input: {
  response: string
  mode: WritingMode
  prompt: string
}): Promise<WritingEvaluation> {
  const result = await apiFetch<WritingGradeResult>('/api/writing/grade', {
    method: 'POST',
    body: JSON.stringify({
      examMode: input.mode,
      prompt: input.prompt,
      response: input.response,
    }),
  })

  return {
    submissionId: result.submissionId,
    scores: Object.entries(result.scores).map(([criterion, score]) => ({
      criterion: criterion as WritingCriterion,
      score,
      maxScore: 9,
    })),
    estimatedBand: result.estimatedBand,
    suggestions: result.suggestions,
    corrections: result.corrections,
    disclaimer: result.disclaimer,
  }
}
