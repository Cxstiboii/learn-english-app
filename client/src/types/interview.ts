export type InterviewTrack = 'behavioral' | 'system-design' | 'role-salary'

export interface InterviewQuestion {
  id: string
  prompt: string
}

export interface InterviewAnswer {
  questionNumber: number
  questionId: string
  question: string
  answer: string
}

export type StarItemStatus = 'completed' | 'pending' | 'missing'

export interface StarAssessment {
  situationTask: StarItemStatus
  action: StarItemStatus
  result: StarItemStatus
}

export interface InterviewEvaluation {
  estimatedLevel: string
  summary: string
  strengths: string[]
  suggestions: string[]
  disclaimer: string
  answers: Array<{
    question: string
    transcript: string
    situationTaskMet: boolean
    actionMet: boolean
    resultMet: boolean
    comments: string[]
    improvedResponse: string
  }>
}
