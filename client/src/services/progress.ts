import { apiFetch } from './api'

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

export function getProgressSummary() {
  return apiFetch<ProgressSummary>('/api/progress/summary')
}

export function logActivity(minutes: number) {
  return apiFetch<{ date: string; minutes: number }>('/api/activity/log', {
    method: 'POST',
    body: JSON.stringify({ minutes }),
  })
}
