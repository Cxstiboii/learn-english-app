import { apiFetch } from './api'

export interface SpeakingEvaluationRequest {
  prompt: string
  transcript: string
  durationSeconds: number
}

export interface SpeakingEvaluation {
  sessionId: string
  fluency: number
  grammar: number
  vocabulary: number
  estimatedBand: number
  estimatedCEFR: string
  b2UpgradeSuggestion: string
  corrections: Array<{
    category: string
    original: string
    corrected: string
    explanation: string
  }>
  disclaimer: string
}

export function evaluateSpeaking(input: SpeakingEvaluationRequest) {
  return apiFetch<SpeakingEvaluation>('/api/speaking/evaluate', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
