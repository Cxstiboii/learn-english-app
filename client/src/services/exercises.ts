import { apiFetch } from './api'

export interface WeakSpot {
  id: string
  category: string
  example: string
  correction: string
  count: number
  last_seen_at: string
}

export interface ExerciseQuestion {
  id: string
  prompt: string
  options: string[]
  focusCategory: string
}

export async function getWeakSpots(): Promise<WeakSpot[]> {
  const result = await apiFetch<{ weakSpots: WeakSpot[] }>('/api/exercises/weak-spots')
  return result.weakSpots
}

export async function generateExercises(input: { count: number; focusCategory?: string }) {
  return apiFetch<{ exercises: ExerciseQuestion[] }>('/api/exercises/generate', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function answerExercise(id: string, selectedOption: string) {
  return apiFetch<{
    isCorrect: boolean
    explanation: string
    correctAnswer?: string
  }>(`/api/exercises/${encodeURIComponent(id)}/answer`, {
    method: 'POST',
    body: JSON.stringify({ selectedOption }),
  })
}
