import { apiFetch } from './api'

export type ProfileSuggestionKind =
  | 'lower_daily_goal'
  | 'raise_target_level'
  | 'adjust_skill_plan'
  | 'targeted_error_practice'

export interface ProfileSuggestion {
  id: string
  kind: ProfileSuggestionKind
  title: string
  rationale: string
  evidence: string
  createdAt: string
}

export interface ProfileSuggestionResolution {
  id: string
  status: 'accepted'
  nextAction: { type: 'exercise'; focusCategory: string } | null
}

export async function getProfileSuggestions(): Promise<ProfileSuggestion[]> {
  const result = await apiFetch<{ suggestions: ProfileSuggestion[] }>('/api/suggestions')
  return result.suggestions
}

export function acceptProfileSuggestion(id: string) {
  return apiFetch<ProfileSuggestionResolution>(
    `/api/suggestions/${encodeURIComponent(id)}/accept`,
    { method: 'POST' },
  )
}

export function dismissProfileSuggestion(id: string) {
  return apiFetch<{ id: string; status: 'dismissed' }>(
    `/api/suggestions/${encodeURIComponent(id)}/dismiss`,
    { method: 'POST' },
  )
}
