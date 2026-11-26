import { supabaseAdmin } from '../config/supabase.js'
import { config } from '../config/index.js'
import {
  calculateDailyStreak,
  dateKeyInTimeZone,
  streakTimeZone,
  type DailyActivityEntry,
} from './streak.js'

const dailyActivityPageSize = 1000
const recentEvaluationLimit = 5

function throwOnQueryError(error: { message: string } | null, message: string): void {
  if (error) {
    console.error('[database] query failed', { operation: message })
    throw new Error(message)
  }
}

async function getDailyActivityHistory(userId: string): Promise<DailyActivityEntry[]> {
  const entries: DailyActivityEntry[] = []

  for (let offset = 0; ; offset += dailyActivityPageSize) {
    const { data, error } = await supabaseAdmin
      .from('daily_activity')
      .select('date, minutes')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(offset, offset + dailyActivityPageSize - 1)

    throwOnQueryError(error, 'Unable to load daily activity history.')
    entries.push(...(data ?? []).map(({ date, minutes }) => ({
      date: String(date),
      minutes,
    })))
    if (!data || data.length < dailyActivityPageSize) break
  }

  return entries
}

function estimatedBand(scores: unknown): number | undefined {
  if (typeof scores !== 'object' || scores === null || !('estimatedBand' in scores)) {
    return undefined
  }

  const band = scores.estimatedBand
  return typeof band === 'number' && Number.isFinite(band) ? band : undefined
}

export async function getProgressSummary(userId: string) {
  const today = dateKeyInTimeZone(new Date(), streakTimeZone)
  const [
    profileResult,
    todayResult,
    activityCountResult,
    completedResult,
    errorPatternResult,
    speakingResult,
    writingResult,
    activityHistory,
  ] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('current_level, daily_goal_minutes')
      .eq('id', userId)
      .maybeSingle(),
    supabaseAdmin
      .from('daily_activity')
      .select('minutes')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle(),
    supabaseAdmin
      .from('study_activities')
      .select('id', { count: 'exact', head: true }),
    supabaseAdmin
      .from('user_activity_progress')
      .select('activity_id')
      .eq('user_id', userId),
    supabaseAdmin
      .from('error_patterns')
      .select('id, category, example, correction, count')
      .eq('user_id', userId)
      .order('count', { ascending: false })
      .order('last_seen_at', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('speaking_sessions')
      .select('scores, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(recentEvaluationLimit),
    supabaseAdmin
      .from('writing_submissions')
      .select('scores, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(recentEvaluationLimit),
    getDailyActivityHistory(userId),
  ])

  throwOnQueryError(profileResult.error, 'Unable to load the learner profile.')
  throwOnQueryError(todayResult.error, "Unable to load today's activity.")
  throwOnQueryError(activityCountResult.error, 'Unable to load study-path activities.')
  throwOnQueryError(completedResult.error, 'Unable to load completed activities.')
  throwOnQueryError(errorPatternResult.error, 'Unable to load error patterns.')
  throwOnQueryError(speakingResult.error, 'Unable to load speaking evaluations.')
  throwOnQueryError(writingResult.error, 'Unable to load writing evaluations.')

  const profile = profileResult.data
  if (!profile) throw new Error('Profile not found.')

  const dailyGoalMinutes = profile.daily_goal_minutes
  const todayMinutes = todayResult.data?.minutes ?? 0
  const completedActivityIds = completedResult.data ?? []
  const totalActivities = activityCountResult.count ?? 0
  const estimatedScores = [
    ...(speakingResult.data ?? []),
    ...(writingResult.data ?? []),
  ]
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))
    .slice(0, recentEvaluationLimit)
    .map(({ scores }) => estimatedBand(scores))
    .filter((score): score is number => score !== undefined)

  return {
    currentLevel: profile.current_level,
    levelProgress: totalActivities === 0
      ? 0
      : Math.round((completedActivityIds.length / totalActivities) * 100),
    dailyStreak: calculateDailyStreak(
      activityHistory,
      dailyGoalMinutes,
      config.DAILY_STREAK_GOAL_FRACTION,
    ),
    dailyGoalMinutes,
    todayMinutes,
    todayRemainingMinutes: Math.max(0, dailyGoalMinutes - todayMinutes),
    recentEstimatedScore: estimatedScores.length === 0
      ? null
      : Number((estimatedScores.reduce((total, score) => total + score, 0) / estimatedScores.length).toFixed(1)),
    recentEvaluationsCount: estimatedScores.length,
    errorPatterns: errorPatternResult.data ?? [],
  }
}

export async function logActivityMinutes(userId: string, minutes: number) {
  const { data, error } = await supabaseAdmin.rpc('log_daily_activity', {
    p_user_id: userId,
    p_minutes: minutes,
  })

  throwOnQueryError(error, 'Unable to log activity minutes.')
  if (
    typeof data !== 'object'
    || data === null
    || !('date' in data)
    || typeof data.date !== 'string'
    || !('minutes' in data)
    || typeof data.minutes !== 'number'
  ) {
    throw new Error('The activity log returned an invalid response.')
  }

  return data
}
