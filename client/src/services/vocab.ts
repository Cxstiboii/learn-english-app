import { apiFetch } from './api'

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

export interface VocabCard {
  id: string
  term: string
  definition: string
  example: string | null
  deck: string | null
  ease_factor: number
  interval_days: number
  repetitions: number
  due_at: string
  created_at: string
}

export interface VocabStats {
  dueToday: number
  total: number
  mastered: number
  retentionPercent: number
  reviewCount: number
}

export async function getDueCards(): Promise<VocabCard[]> {
  const result = await apiFetch<{ cards: VocabCard[] }>('/api/vocab/due')
  return result.cards
}

export function getVocabStats() {
  return apiFetch<VocabStats>('/api/vocab/stats')
}

export async function reviewVocabCard(id: string, rating: ReviewRating) {
  const result = await apiFetch<{ card: VocabCard }>(`/api/vocab/${encodeURIComponent(id)}/review`, {
    method: 'POST',
    body: JSON.stringify({ rating }),
  })
  return result.card
}

export async function createVocabCard(input: {
  term: string
  definition: string
  example?: string
  deck?: string
}) {
  const result = await apiFetch<{ card: VocabCard }>('/api/vocab', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return result.card
}

export function generateVocabCards(input: { topic?: string; count: number }) {
  return apiFetch<{ cards: VocabCard[]; requested: number; duplicatesSkipped: number }>(
    '/api/vocab/generate',
    { method: 'POST', body: JSON.stringify(input) },
  )
}
