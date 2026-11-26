export type WritingMode = 'toefl' | 'ielts'

export type WritingCriterion =
  | 'Task Response'
  | 'Coherence'
  | 'Lexical Resource'
  | 'Grammar'

export interface WritingPrompt {
  mode: WritingMode
  examName: string
  taskName: string
  durationSeconds: number
  minimumWords: number
  prompt: string
  timingNote: string
  checklist: string[]
}

export interface WritingScore {
  criterion: WritingCriterion
  score: number
  maxScore: number
}

export interface WritingEvaluation {
  submissionId: string
  scores: WritingScore[]
  estimatedBand: number
  suggestions: string[]
  corrections: Array<{
    category: string
    original: string
    corrected: string
    explanation: string
  }>
  disclaimer: string
}
