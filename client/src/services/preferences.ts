import { apiFetch } from './api'
import type { LearnerSettings } from '../types/preferences'

export function getPreferences(): Promise<LearnerSettings> {
  return apiFetch<LearnerSettings>('/api/preferences')
}

export function updatePreferences(settings: LearnerSettings): Promise<LearnerSettings> {
  return apiFetch<LearnerSettings>('/api/preferences', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}
