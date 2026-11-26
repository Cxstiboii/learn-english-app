import { supabaseAdmin } from '../config/supabase.js'

type ActivityStatus = 'completed' | 'active' | 'available' | 'upcoming'
type UnitStatus = 'Completado' | 'En curso' | 'Disponible' | 'Próximo' | 'Meta'

function throwOnQueryError(error: { message: string } | null, message: string): void {
  if (error) {
    console.error('[database] query failed', { operation: message })
    throw new Error(message)
  }
}

export async function getStudyPath(userId: string) {
  const [unitResult, activityResult, progressResult] = await Promise.all([
    supabaseAdmin
      .from('study_units')
      .select('id, unit_number, level, filter_levels, title, description')
      .order('unit_number', { ascending: true }),
    supabaseAdmin
      .from('study_activities')
      .select('id, unit_id, position, title, activity_type, duration_minutes, phrase, practice_key')
      .order('position', { ascending: true }),
    supabaseAdmin
      .from('user_activity_progress')
      .select('activity_id, completed_at')
      .eq('user_id', userId),
  ])

  throwOnQueryError(unitResult.error, 'Unable to load study units.')
  throwOnQueryError(activityResult.error, 'Unable to load study activities.')
  throwOnQueryError(progressResult.error, 'Unable to load activity progress.')

  const units = unitResult.data ?? []
  const activities = activityResult.data ?? []
  const completedById = new Map(
    (progressResult.data ?? []).map(({ activity_id, completed_at }) => [activity_id, completed_at]),
  )
  const activityGroups = new Map<string, typeof activities>()
  for (const activity of activities) {
    const group = activityGroups.get(activity.unit_id) ?? []
    group.push(activity)
    activityGroups.set(activity.unit_id, group)
  }

  const unitCompletion = units.map((unit) => {
    const unitActivities = activityGroups.get(unit.id) ?? []
    const completedActivities = unitActivities.filter(({ id }) => completedById.has(id)).length
    return {
      unit,
      activities: unitActivities,
      completedActivities,
      totalActivities: unitActivities.length,
    }
  })

  return {
    units: unitCompletion.map((entry, index) => {
      const { unit, activities: unitActivities, completedActivities, totalActivities } = entry
      const allComplete = totalActivities > 0 && completedActivities === totalActivities
      const unlocked = index === 0
        || unitCompletion.slice(0, index).every(({ totalActivities: priorTotal, completedActivities: priorCompleted }) =>
          priorTotal > 0 && priorCompleted === priorTotal)
      let status: UnitStatus

      if (allComplete) {
        status = 'Completado'
      } else if (completedActivities > 0) {
        status = 'En curso'
      } else if (!unlocked) {
        status = 'Próximo'
      } else if (index === unitCompletion.length - 1) {
        status = 'Meta'
      } else {
        status = 'Disponible'
      }

      let firstIncomplete = true
      const mappedActivities = unitActivities.map((activity) => {
        const completedAt = completedById.get(activity.id)
        let activityStatus: ActivityStatus
        if (completedAt) {
          activityStatus = 'completed'
        } else if (status === 'Próximo') {
          activityStatus = 'upcoming'
        } else if (firstIncomplete) {
          activityStatus = 'active'
          firstIncomplete = false
        } else {
          activityStatus = 'available'
        }

        return {
          id: activity.id,
          title: activity.title,
          type: activity.activity_type,
          durationMinutes: activity.duration_minutes,
          phrase: activity.phrase,
          practiceKey: activity.practice_key,
          status: activityStatus,
          completedAt: completedAt ?? null,
        }
      })

      return {
        id: unit.id,
        number: unit.unit_number,
        level: unit.level,
        filterLevels: unit.filter_levels,
        title: unit.title,
        description: unit.description,
        status,
        progress: {
          completedActivities,
          totalActivities,
          percentage: totalActivities === 0
            ? 0
            : Math.round((completedActivities / totalActivities) * 100),
        },
        activities: mappedActivities,
      }
    }),
  }
}

export class StudyPathError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'StudyPathError'
  }
}

export async function completeStudyActivity(userId: string, activityId: string) {
  const { data, error } = await supabaseAdmin.rpc('complete_study_activity', {
    p_user_id: userId,
    p_activity_id: activityId,
  })

  if (error) {
    if (error.message.includes('ACTIVITY_NOT_FOUND')) {
      throw new StudyPathError(404, 'ACTIVITY_NOT_FOUND', 'Study activity not found.')
    }
    if (error.message.includes('ACTIVITY_LOCKED')) {
      throw new StudyPathError(409, 'ACTIVITY_LOCKED', 'Complete the previous units before this activity.')
    }
    console.error('[database] study activity completion failed')
    throw new StudyPathError(500, 'ACTIVITY_COMPLETION_FAILED', 'Unable to complete this study activity.')
  }

  if (typeof data !== 'string') {
    throw new StudyPathError(500, 'ACTIVITY_COMPLETION_FAILED', 'Unable to complete this study activity.')
  }

  return {
    activityId,
    completedAt: data,
  }
}
