import { z } from 'zod'
import { supabaseAdmin } from '../config/supabase.js'
import { addFriendlyRationales } from './profileSuggestionReasons.js'
import {
  buildProfileSuggestions,
  profileSuggestionCandidateSchema,
  profileSuggestionKindSchema,
  focusSkillSchema,
  profileLevelSchema,
  type FocusSkill,
  type ProfileSuggestionCandidate,
  type ProfileSuggestionSnapshot,
} from './profileSuggestionRules.js'
import { dateKeyInTimeZone, streakTimeZone } from './streak.js'

const focusSkillsSchema = z.array(focusSkillSchema)
  .length(4)
  .refine((skills) => new Set(skills).size === 4)

const profileSchema = z.object({
  created_at: z.string().min(1).refine((value) => Number.isFinite(Date.parse(value))),
  daily_goal_minutes: z.number().int().min(1).max(1440),
  target_level: profileLevelSchema,
}).strict()

const preferencesSchema = z.object({
  focus_skills: focusSkillsSchema,
}).strict()

const dailyActivitySchema = z.array(z.object({
  date: z.string().date(),
  minutes: z.number().int().nonnegative(),
}).strict())

const evaluationSchema = z.array(z.object({
  scores: z.unknown(),
  created_at: z.string().min(1),
}).strict())

const timestampRowsSchema = z.array(z.object({
  created_at: z.string().min(1),
}))

const progressRowsSchema = z.array(z.object({
  activity_id: z.string().min(1),
  completed_at: z.string().min(1),
}).strict())

const studyActivityRowsSchema = z.array(z.object({
  id: z.string().min(1),
  activity_type: z.string().min(1),
}).strict())

const errorPatternsSchema = z.array(z.object({
  category: z.string().trim().min(1).max(80),
  count: z.number().int().positive(),
  last_seen_at: z.string().min(1),
}).strict())

const pendingRowSchema = z.object({
  id: z.string().uuid(),
  kind: profileSuggestionKindSchema,
  title: z.string().trim().min(1).max(120),
  rationale: z.string().trim().min(1).max(500),
  evidence: z.string().max(500),
  proposed_changes: z.unknown(),
  status: z.literal('pending'),
  created_at: z.string().min(1),
}).strict()

const resolutionSchema = z.object({
  id: z.string().uuid(),
  kind: profileSuggestionKindSchema,
  status: z.enum(['pending', 'accepted', 'dismissed', 'stale']),
  proposedChanges: z.unknown(),
}).strict()

const publicSuggestionSchema = z.object({
  id: z.string().uuid(),
  kind: profileSuggestionKindSchema,
  title: z.string(),
  rationale: z.string(),
  evidence: z.string(),
  createdAt: z.string(),
}).strict()

export type PublicProfileSuggestion = z.infer<typeof publicSuggestionSchema>

export class ProfileSuggestionError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ProfileSuggestionError'
  }
}

function throwOnDatabaseError(error: { message: string } | null, message: string): void {
  if (error) {
    console.error('[database] profile suggestion query failed')
    throw new ProfileSuggestionError(500, 'SUGGESTIONS_STORAGE_FAILED', message)
  }
}

function parseDatabaseRows<T>(
  schema: z.ZodType<T>,
  value: unknown,
  message: string,
): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    throw new ProfileSuggestionError(500, 'SUGGESTIONS_DATA_INVALID', message)
  }
  return parsed.data
}

function addDateOffset(dateKey: string, offset: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

function getEstimatedScore(value: unknown): number | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const estimatedBand = Reflect.get(value, 'estimatedBand')
  return typeof estimatedBand === 'number' && Number.isFinite(estimatedBand)
    ? estimatedBand
    : undefined
}

function incrementPractice(
  counts: Record<FocusSkill, number>,
  skill: FocusSkill,
  amount = 1,
) {
  counts[skill] += amount
}

function createPracticeCounts({
  speaking,
  interviews,
  writing,
  vocabReviews,
  exerciseAttempts,
  progressRows,
  studyActivities,
}: {
  speaking: number
  interviews: number
  writing: number
  vocabReviews: number
  exerciseAttempts: number
  progressRows: z.infer<typeof progressRowsSchema>
  studyActivities: z.infer<typeof studyActivityRowsSchema>
}): Record<FocusSkill, number> {
  const counts: Record<FocusSkill, number> = {
    speaking: speaking + interviews,
    listening: 0,
    writing,
    vocab_grammar: vocabReviews + exerciseAttempts,
  }
  const activityTypeById = new Map(
    studyActivities.map(({ id, activity_type }) => [id, activity_type]),
  )

  for (const { activity_id: activityId } of progressRows) {
    const activityType = activityTypeById.get(activityId)
    if (activityType === 'Speaking') {
      incrementPractice(counts, 'speaking')
      incrementPractice(counts, 'listening')
    } else if (activityType === 'Vocabulario') {
      incrementPractice(counts, 'vocab_grammar')
      incrementPractice(counts, 'listening')
    } else if (activityType === 'Slack-Escritura') {
      incrementPractice(counts, 'writing')
    }
  }

  return counts
}

async function loadSnapshot(userId: string, now: Date): Promise<ProfileSuggestionSnapshot> {
  const cutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const cutoffIso = cutoff.toISOString()
  const todayKey = dateKeyInTimeZone(now, streakTimeZone)
  const dailyStartDate = addDateOffset(todayKey, -14)
  const dailyEndDate = addDateOffset(todayKey, -1)

  const [
    profileResult,
    preferencesResult,
    dailyResult,
    speakingResult,
    writingResult,
    interviewResult,
    vocabReviewResult,
    exerciseAttemptResult,
    progressResult,
    errorPatternResult,
  ] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('created_at, daily_goal_minutes, target_level')
      .eq('id', userId)
      .maybeSingle(),
    supabaseAdmin
      .from('learner_preferences')
      .select('focus_skills')
      .eq('user_id', userId)
      .maybeSingle(),
    supabaseAdmin
      .from('daily_activity')
      .select('date, minutes')
      .eq('user_id', userId)
      .gte('date', dailyStartDate)
      .lte('date', dailyEndDate),
    supabaseAdmin
      .from('speaking_sessions')
      .select('scores, created_at')
      .eq('user_id', userId)
      .gte('created_at', cutoffIso)
      .order('created_at', { ascending: false })
      .limit(100),
    supabaseAdmin
      .from('writing_submissions')
      .select('scores, created_at')
      .eq('user_id', userId)
      .gte('created_at', cutoffIso)
      .order('created_at', { ascending: false })
      .limit(100),
    supabaseAdmin
      .from('interview_sessions')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', cutoffIso)
      .limit(100),
    supabaseAdmin
      .from('vocab_reviews')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', cutoffIso)
      .limit(500),
    supabaseAdmin
      .from('exercise_attempts')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', cutoffIso)
      .limit(500),
    supabaseAdmin
      .from('user_activity_progress')
      .select('activity_id, completed_at')
      .eq('user_id', userId)
      .gte('completed_at', cutoffIso)
      .limit(500),
    supabaseAdmin
      .from('error_patterns')
      .select('category, count, last_seen_at')
      .eq('user_id', userId)
      .gte('last_seen_at', cutoffIso)
      .order('count', { ascending: false })
      .limit(100),
  ])

  const databaseResults = [
    profileResult,
    preferencesResult,
    dailyResult,
    speakingResult,
    writingResult,
    interviewResult,
    vocabReviewResult,
    exerciseAttemptResult,
    progressResult,
    errorPatternResult,
  ]
  if (databaseResults.some(({ error }) => error)) {
    throwOnDatabaseError({ message: 'query failed' }, 'Unable to analyze recent learning activity.')
  }

  if (!profileResult.data || !preferencesResult.data) {
    throw new ProfileSuggestionError(
      409,
      'SUGGESTIONS_PROFILE_INCOMPLETE',
      'Complete your learner profile before requesting suggestions.',
    )
  }

  const profile = parseDatabaseRows(
    profileSchema,
    profileResult.data,
    'Your learner profile contains invalid data.',
  )
  const preferences = parseDatabaseRows(
    preferencesSchema,
    preferencesResult.data,
    'Your focus skill settings are invalid.',
  )
  const dailyActivity = parseDatabaseRows(
    dailyActivitySchema,
    dailyResult.data ?? [],
    'Your daily activity data is invalid.',
  )
  const speakingEvaluations = parseDatabaseRows(
    evaluationSchema,
    speakingResult.data ?? [],
    'Your speaking evaluation data is invalid.',
  )
  const writingEvaluations = parseDatabaseRows(
    evaluationSchema,
    writingResult.data ?? [],
    'Your writing evaluation data is invalid.',
  )
  const speakingSessions = parseDatabaseRows(
    timestampRowsSchema,
    speakingResult.data ?? [],
    'Your speaking session data is invalid.',
  )
  const writingSessions = parseDatabaseRows(
    timestampRowsSchema,
    writingResult.data ?? [],
    'Your writing session data is invalid.',
  )
  const interviewSessions = parseDatabaseRows(
    timestampRowsSchema,
    interviewResult.data ?? [],
    'Your interview session data is invalid.',
  )
  const vocabReviews = parseDatabaseRows(
    timestampRowsSchema,
    vocabReviewResult.data ?? [],
    'Your vocabulary review data is invalid.',
  )
  const exerciseAttempts = parseDatabaseRows(
    timestampRowsSchema,
    exerciseAttemptResult.data ?? [],
    'Your exercise history is invalid.',
  )
  const progressRows = parseDatabaseRows(
    progressRowsSchema,
    progressResult.data ?? [],
    'Your study-path activity data is invalid.',
  )
  const studyActivityIds = [...new Set(progressRows.map(({ activity_id }) => activity_id))]
  const studyActivitiesResult = studyActivityIds.length === 0
    ? { data: [], error: null }
    : await supabaseAdmin
        .from('study_activities')
        .select('id, activity_type')
        .in('id', studyActivityIds)
  throwOnDatabaseError(studyActivitiesResult.error, 'Unable to load study activity details.')
  const studyActivities = parseDatabaseRows(
    studyActivityRowsSchema,
    studyActivitiesResult.data ?? [],
    'Your study activity data is invalid.',
  )
  const errorPatterns = parseDatabaseRows(
    errorPatternsSchema,
    errorPatternResult.data ?? [],
    'Your recent error pattern data is invalid.',
  )
  const evaluationRows = [...speakingEvaluations, ...writingEvaluations]
    .map(({ scores, created_at }) => ({
      createdAt: created_at,
      score: getEstimatedScore(scores),
    }))
    .filter((entry): entry is { createdAt: string; score: number } =>
      entry.score !== undefined,
    )
  const skillPracticeCounts = createPracticeCounts({
    speaking: speakingSessions.length,
    interviews: interviewSessions.length,
    writing: writingSessions.length,
    vocabReviews: vocabReviews.length,
    exerciseAttempts: exerciseAttempts.length,
    progressRows,
    studyActivities,
  })

  return {
    profileCreatedAt: profile.created_at,
    dailyGoalMinutes: profile.daily_goal_minutes,
    targetLevel: profile.target_level,
    focusSkills: preferences.focus_skills,
    dailyActivity,
    recentEvaluations: evaluationRows,
    skillPracticeCounts,
    errorPatterns: errorPatterns.map(({ category, count, last_seen_at }) => ({
      category,
      count,
      lastSeenAt: last_seen_at,
    })),
  }
}

async function listPendingSuggestions(userId: string): Promise<PublicProfileSuggestion[]> {
  const { data, error } = await supabaseAdmin
    .from('profile_suggestions')
    .select('id, kind, title, rationale, evidence, proposed_changes, status, created_at')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(3)

  throwOnDatabaseError(error, 'Unable to load your profile suggestions.')
  const rows = parseDatabaseRows(
    z.array(pendingRowSchema),
    data ?? [],
    'Your profile suggestion data is invalid.',
  )
  return rows.map((row) => {
    parseDatabaseRows(
      profileSuggestionCandidateSchema,
      {
        kind: row.kind,
        title: row.title,
        rationale: row.rationale,
        evidence: row.evidence,
        proposedChanges: row.proposed_changes,
      },
      'A saved profile suggestion contains invalid changes.',
    )
    return publicSuggestionSchema.parse({
      id: row.id,
      kind: row.kind,
      title: row.title,
      rationale: row.rationale,
      evidence: row.evidence,
      createdAt: row.created_at,
    })
  })
}

export async function getProfileSuggestions(userId: string): Promise<PublicProfileSuggestion[]> {
  const existing = await listPendingSuggestions(userId)
  if (existing.length >= 3) return existing

  const now = new Date()
  const { data: generationClaimed, error: claimError } = await supabaseAdmin.rpc(
    'claim_profile_suggestion_generation',
    { p_user_id: userId },
  )
  throwOnDatabaseError(claimError, 'Unable to prepare profile suggestions.')
  if (generationClaimed !== true) return listPendingSuggestions(userId)

  const snapshot = await loadSnapshot(userId, now)
  const candidates = buildProfileSuggestions(
    snapshot,
    existing.map(({ kind }) => kind),
    now,
  ).slice(0, 3 - existing.length)
  const candidatesWithRationales = await addFriendlyRationales(candidates)

  if (candidatesWithRationales.length > 0) {
    const { error: saveError } = await supabaseAdmin.rpc('save_profile_suggestions', {
      p_user_id: userId,
      p_suggestions: candidatesWithRationales.map((candidate) => ({
        kind: candidate.kind,
        title: candidate.title,
        rationale: candidate.rationale,
        evidence: candidate.evidence,
        proposedChanges: candidate.proposedChanges,
      })),
    })

    throwOnDatabaseError(saveError, 'Unable to save profile suggestions.')
  }

  return listPendingSuggestions(userId)
}

function parseStoredCandidate(value: {
  kind: unknown
  title: unknown
  rationale: unknown
  evidence: unknown
  proposed_changes: unknown
}): ProfileSuggestionCandidate {
  const parsed = profileSuggestionCandidateSchema.safeParse({
    kind: value.kind,
    title: value.title,
    rationale: value.rationale,
    evidence: value.evidence,
    proposedChanges: value.proposed_changes,
  })
  if (!parsed.success) {
    throw new ProfileSuggestionError(
      500,
      'SUGGESTION_CHANGES_INVALID',
      'This suggestion contains invalid changes and cannot be accepted.',
    )
  }
  return parsed.data
}

async function resolveSuggestion(
  userId: string,
  suggestionId: string,
  action: 'accept' | 'dismiss',
) {
  const { data, error } = await supabaseAdmin.rpc('resolve_profile_suggestion', {
    p_user_id: userId,
    p_suggestion_id: suggestionId,
    p_action: action,
  })
  throwOnDatabaseError(error, 'Unable to update this profile suggestion.')
  const result = resolutionSchema.safeParse(data)
  if (!result.success) {
    throw new ProfileSuggestionError(
      404,
      'SUGGESTION_NOT_FOUND',
      'This profile suggestion is no longer available.',
    )
  }
  const expectedStatus = action === 'accept' ? 'accepted' : 'dismissed'
  if (result.data.status === 'stale') {
    throw new ProfileSuggestionError(
      409,
      'SUGGESTION_STALE',
      'Your settings changed after this suggestion was created. Review the current settings before accepting it.',
    )
  }
  if (result.data.status !== expectedStatus) {
    throw new ProfileSuggestionError(
      409,
      'SUGGESTION_ALREADY_RESOLVED',
      'This profile suggestion has already been resolved.',
    )
  }
  return result.data
}

export async function acceptProfileSuggestion(userId: string, suggestionId: string) {
  const { data, error } = await supabaseAdmin
    .from('profile_suggestions')
    .select('kind, title, rationale, evidence, proposed_changes, status')
    .eq('id', suggestionId)
    .eq('user_id', userId)
    .maybeSingle()

  throwOnDatabaseError(error, 'Unable to load this profile suggestion.')
  if (!data) {
    throw new ProfileSuggestionError(404, 'SUGGESTION_NOT_FOUND', 'Profile suggestion not found.')
  }
  if (data.status !== 'pending') {
    throw new ProfileSuggestionError(
      409,
      'SUGGESTION_ALREADY_RESOLVED',
      'This profile suggestion has already been resolved.',
    )
  }

  const candidate = parseStoredCandidate(data)
  const resolution = await resolveSuggestion(userId, suggestionId, 'accept')
  return {
    id: resolution.id,
    status: 'accepted' as const,
    nextAction: candidate.kind === 'targeted_error_practice'
      ? {
          type: 'exercise' as const,
          focusCategory: candidate.proposedChanges.exerciseFocusCategory,
        }
      : null,
  }
}

export async function dismissProfileSuggestion(userId: string, suggestionId: string) {
  const resolution = await resolveSuggestion(userId, suggestionId, 'dismiss')
  return { id: resolution.id, status: 'dismissed' as const }
}

export function toProfileSuggestionError(error: unknown): ProfileSuggestionError | undefined {
  return error instanceof ProfileSuggestionError ? error : undefined
}
