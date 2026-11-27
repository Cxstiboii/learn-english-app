import { apiFetch } from './api'
import type { InterviewAnswer, InterviewEvaluation, InterviewTrack } from '../types/interview'

interface InterviewEvaluationResult {
  sessionId: string
  answers: InterviewEvaluation['answers']
  summary: string
  estimatedCEFR: string
  strengths: string[]
  suggestions: string[]
  disclaimer: string
}

export async function evaluateInterview(
  answers: InterviewAnswer[],
  track: InterviewTrack,
  idempotencyKey: string,
): Promise<InterviewEvaluation> {
  const completedAnswers = answers.filter(({ answer }) => answer.trim())
  if (completedAnswers.length === 0) {
    throw new Error('Add at least one answer before requesting an evaluation.')
  }

  const result = await apiFetch<InterviewEvaluationResult>('/api/interview/evaluate', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({
      track,
      answers: completedAnswers.map(({ question, answer }) => ({
        question,
        transcript: answer,
      })),
    }),
  })

  return {
    estimatedLevel: `${result.estimatedCEFR} estimated`,
    summary: result.summary,
    strengths: result.strengths,
    suggestions: result.suggestions,
    disclaimer: result.disclaimer,
    answers: result.answers,
  }
}
