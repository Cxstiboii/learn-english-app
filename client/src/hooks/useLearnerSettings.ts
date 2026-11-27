import { useQuery } from '@tanstack/react-query'
import { getPreferences } from '../services/preferences'

export const learnerSettingsKey = ['preferences'] as const

export function useLearnerSettings() {
  return useQuery({
    queryKey: learnerSettingsKey,
    queryFn: getPreferences,
  })
}
