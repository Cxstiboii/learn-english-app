export interface SpeakingPrompt {
  id: string
  label: string
  question: string
  tip: string
  durationSeconds: number
}

export interface EvaluationScores {
  fluency: number
  grammar: number
  vocab: number
}

export interface Evaluation {
  sessionId: string
  fluency: number
  grammar: number
  vocabulary: number
  estimatedBand: number
  estimatedCEFR: string
  b2UpgradeSuggestion: string
  disclaimer: string
  corrections: Array<{
    category: string
    original: string
    corrected: string
    explanation: string
  }>
}
