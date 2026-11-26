export interface ProgressSummary {
  currentLevel: string
  levelProgress: number
  dailyStreak: number
  dailyGoalMinutes: number
  todayMinutes: number
  todayRemainingMinutes: number
  recentEstimatedScore: number | null
  recentEvaluationsCount: number
  errorPatterns: Array<{
    id: string
    category: string
    example: string
    correction: string
    count: number
  }>
}

export interface ErrorPattern {
  id: string
  pattern: string
  example: string
  correction: string
  count: number
}
