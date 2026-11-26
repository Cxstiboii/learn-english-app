import { apiFetch } from './api'

export type UnitStatus = 'Completado' | 'En curso' | 'Disponible' | 'Próximo' | 'Meta'
export type PathActivityStatus = 'completed' | 'active' | 'available' | 'upcoming'
export type PathActivityType = 'Vocabulario' | 'Speaking' | 'Slack-Escritura'

export interface PathActivity {
  id: string
  title: string
  type: PathActivityType
  durationMinutes: number
  phrase: string
  practiceKey: string
  status: PathActivityStatus
  completedAt: string | null
}

export interface PathUnit {
  id: string
  number: number
  level: string
  filterLevels: Array<'a2' | 'b1' | 'b2'>
  title: string
  description: string
  status: UnitStatus
  progress: {
    completedActivities: number
    totalActivities: number
    percentage: number
  }
  activities: PathActivity[]
}

export async function getStudyPath(): Promise<PathUnit[]> {
  const result = await apiFetch<{ units: PathUnit[] }>('/api/path')
  return result.units
}

export function completePathActivity(id: string) {
  return apiFetch<{ activityId: string; completedAt: string }>(
    `/api/path/activities/${encodeURIComponent(id)}/complete`,
    { method: 'POST' },
  )
}
