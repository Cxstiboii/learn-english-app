import { z } from 'zod'
import { dateKeyInTimeZone, streakTimeZone } from './streak.js'

export const profileSuggestionKindSchema = z.enum([
  'lower_daily_goal',
  'raise_target_level',
  'adjust_skill_plan',
  'targeted_error_practice',
])

export const focusSkillSchema = z.enum(['speaking', 'listening', 'writing', 'vocab_grammar'])
export const profileLevelSchema = z.enum(['A2', 'B1', 'B1+', 'B2', 'C1'])

const suggestionBaseSchema = z.object({
  title: z.string().trim().min(1).max(120),
  rationale: z.string().trim().min(1).max(500),
  evidence: z.string().trim().min(1).max(500),
})

export const profileSuggestionCandidateSchema = z.discriminatedUnion('kind', [
  suggestionBaseSchema.extend({
    kind: z.literal('lower_daily_goal'),
    proposedChanges: z.object({
      dailyGoalMinutes: z.number().int().min(1).max(1440),
      expectedDailyGoalMinutes: z.number().int().min(1).max(1440),
    }).strict(),
  }).strict(),
  suggestionBaseSchema.extend({
    kind: z.literal('raise_target_level'),
    proposedChanges: z.object({
      targetLevel: profileLevelSchema,
      expectedTargetLevel: profileLevelSchema,
    }).strict(),
  }).strict(),
  suggestionBaseSchema.extend({
    kind: z.literal('adjust_skill_plan'),
    proposedChanges: z.object({
      focusSkills: z.array(focusSkillSchema).length(4),
      expectedFocusSkills: z.array(focusSkillSchema).length(4),
    }).strict(),
  }).strict(),
  suggestionBaseSchema.extend({
    kind: z.literal('targeted_error_practice'),
    proposedChanges: z.object({
      focusSkills: z.array(focusSkillSchema).length(4),
      expectedFocusSkills: z.array(focusSkillSchema).length(4),
      exerciseFocusCategory: z.string().trim().min(1).max(80),
    }).strict(),
  }).strict(),
])

export type ProfileSuggestionKind = z.infer<typeof profileSuggestionKindSchema>
export type ProfileSuggestionCandidate = z.infer<typeof profileSuggestionCandidateSchema>
export type FocusSkill = z.infer<typeof focusSkillSchema>
export type ProfileLevel = z.infer<typeof profileLevelSchema>

export interface ProfileSuggestionSnapshot {
  profileCreatedAt: string
  dailyGoalMinutes: number
  targetLevel: ProfileLevel
  focusSkills: FocusSkill[]
  dailyActivity: Array<{ date: string; minutes: number }>
  recentEvaluations: Array<{ createdAt: string; score: number }>
  skillPracticeCounts: Record<FocusSkill, number>
  errorPatterns: Array<{ category: string; count: number; lastSeenAt: string }>
}

const suggestionLimits = {
  analysisDays: 14,
  lowGoalDays: 7,
  lowPracticeSessions: 1,
  sustainedHighScoreSessions: 3,
  highScoreThreshold: 7.5,
  lowerGoalFactor: 0.75,
} as const

const levelProgression: ProfileLevel[] = ['A2', 'B1', 'B1+', 'B2', 'C1']

function dateOffset(dateKey: string, offset: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

function getNextTargetLevel(level: ProfileLevel): ProfileLevel | undefined {
  const index = levelProgression.indexOf(level)
  return levelProgression[index + 1]
}

function moveSkillToEnd(skills: FocusSkill[], skill: FocusSkill): FocusSkill[] {
  return [...skills.filter((candidate) => candidate !== skill), skill]
}

function moveSkillToStart(skills: FocusSkill[], skill: FocusSkill): FocusSkill[] {
  return [skill, ...skills.filter((candidate) => candidate !== skill)]
}

function getLowGoalEvidence(
  snapshot: ProfileSuggestionSnapshot,
  now: Date,
): { lowDays: number; observedDays: number } {
  const today = dateKeyInTimeZone(now, streakTimeZone)
  const profileStart = dateKeyInTimeZone(new Date(snapshot.profileCreatedAt), streakTimeZone)
  const dailyMinutes = new Map(snapshot.dailyActivity.map(({ date, minutes }) => [date, minutes]))
  const completedDays = Array.from(
    { length: suggestionLimits.analysisDays },
    (_, index) => dateOffset(today, -(index + 1)),
  ).filter((date) => date >= profileStart)
  const lowDays = completedDays.filter(
    (date) => (dailyMinutes.get(date) ?? 0) < snapshot.dailyGoalMinutes / 2,
  ).length

  return { lowDays, observedDays: completedDays.length }
}

function getRecentEvaluations(
  evaluations: ProfileSuggestionSnapshot['recentEvaluations'],
  now: Date,
) {
  const cutoff = now.getTime() - suggestionLimits.analysisDays * 24 * 60 * 60 * 1000
  return evaluations
    .filter(({ createdAt, score }) => {
      const timestamp = Date.parse(createdAt)
      return Number.isFinite(timestamp)
        && timestamp >= cutoff
        && timestamp <= now.getTime()
        && Number.isFinite(score)
    })
    .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
    .slice(0, suggestionLimits.sustainedHighScoreSessions)
}

function getRepeatedErrorPattern(
  patterns: ProfileSuggestionSnapshot['errorPatterns'],
  now: Date,
) {
  const cutoff = now.getTime() - suggestionLimits.analysisDays * 24 * 60 * 60 * 1000
  const countsByCategory = new Map<string, { count: number; lastSeenAt: string }>()

  for (const pattern of patterns) {
    const category = pattern.category.trim()
    const timestamp = Date.parse(pattern.lastSeenAt)
    if (!category || !Number.isFinite(timestamp) || timestamp < cutoff || timestamp > now.getTime()) {
      continue
    }

    const key = category.toLocaleLowerCase('en-US')
    const existing = countsByCategory.get(key)
    countsByCategory.set(key, {
      count: (existing?.count ?? 0) + pattern.count,
      lastSeenAt: !existing || timestamp > Date.parse(existing.lastSeenAt)
        ? pattern.lastSeenAt
        : existing.lastSeenAt,
    })
  }

  return [...countsByCategory.entries()]
    .filter(([, value]) => value.count >= 2)
    .sort(([firstCategory, first], [secondCategory, second]) =>
      second.count - first.count || firstCategory.localeCompare(secondCategory),
    )
    .map(([category, value]) => ({ category, ...value }))[0]
}

export function buildProfileSuggestions(
  snapshot: ProfileSuggestionSnapshot,
  existingKinds: readonly ProfileSuggestionKind[],
  now = new Date(),
): ProfileSuggestionCandidate[] {
  const existing = new Set(existingKinds)
  const candidates: ProfileSuggestionCandidate[] = []
  const { lowDays, observedDays } = getLowGoalEvidence(snapshot, now)

  if (
    !existing.has('lower_daily_goal')
    && observedDays >= suggestionLimits.lowGoalDays
    && lowDays >= suggestionLimits.lowGoalDays
  ) {
    const suggestedMinutes = Math.max(
      1,
      Math.floor(snapshot.dailyGoalMinutes * suggestionLimits.lowerGoalFactor),
    )
    if (suggestedMinutes < snapshot.dailyGoalMinutes) {
      candidates.push({
        kind: 'lower_daily_goal',
        title: 'Try a smaller daily goal',
        rationale: `You recorded less than half of your daily target on ${lowDays} of the last ${observedDays} complete days. Consider lowering your target to ${suggestedMinutes} minutes; you can decide whether this feels more sustainable.`,
        evidence: `${lowDays} of ${observedDays} complete days were below half of your ${snapshot.dailyGoalMinutes}-minute daily goal.`,
        proposedChanges: {
          dailyGoalMinutes: suggestedMinutes,
          expectedDailyGoalMinutes: snapshot.dailyGoalMinutes,
        },
      })
    }
  }

  const highScoreEvaluations = getRecentEvaluations(snapshot.recentEvaluations, now)
  const nextLevel = getNextTargetLevel(snapshot.targetLevel)
  if (
    !existing.has('raise_target_level')
    && nextLevel
    && highScoreEvaluations.length === suggestionLimits.sustainedHighScoreSessions
    && highScoreEvaluations.every(({ score }) => score >= suggestionLimits.highScoreThreshold)
  ) {
    const average = highScoreEvaluations.reduce((total, { score }) => total + score, 0)
      / highScoreEvaluations.length
    const formattedAverage = average.toFixed(1)
    candidates.push({
      kind: 'raise_target_level',
      title: 'Consider a higher target level',
      rationale: `Your recent results may indicate readiness to aim for ${nextLevel}. This is only an estimate, so review the evidence and choose whether to update your target.`,
      evidence: `${highScoreEvaluations.length} recent speaking/writing evaluations averaged ${formattedAverage}/9, with each at or above ${suggestionLimits.highScoreThreshold}/9. Scores are estimates, not official results.`,
      proposedChanges: {
        targetLevel: nextLevel,
        expectedTargetLevel: snapshot.targetLevel,
      },
    })
  }

  const underPracticedSkill = snapshot.focusSkills.find((skill, index) =>
    index < snapshot.focusSkills.length - 1
      && snapshot.skillPracticeCounts[skill] <= suggestionLimits.lowPracticeSessions,
  )
  if (!existing.has('adjust_skill_plan') && underPracticedSkill) {
    const practiceCount = snapshot.skillPracticeCounts[underPracticedSkill]
    candidates.push({
      kind: 'adjust_skill_plan',
      title: 'Adjust your skill priorities',
      rationale: `${underPracticedSkill} appears near the top of your plan but has very little recorded practice. You could move it lower to make room for a skill you are practicing more often.`,
      evidence: `${underPracticedSkill} had ${practiceCount} tracked practice session${practiceCount === 1 ? '' : 's'} in the last ${suggestionLimits.analysisDays} days.`,
      proposedChanges: {
        focusSkills: moveSkillToEnd(snapshot.focusSkills, underPracticedSkill),
        expectedFocusSkills: snapshot.focusSkills,
      },
    })
  }

  const repeatedPattern = getRepeatedErrorPattern(snapshot.errorPatterns, now)
  if (!existing.has('targeted_error_practice') && repeatedPattern) {
    const focusSkills = moveSkillToStart(snapshot.focusSkills, 'vocab_grammar')
    const normalizedCategory = repeatedPattern.category.trim().slice(0, 80)
    candidates.push({
      kind: 'targeted_error_practice',
      title: `Practice recurring ${normalizedCategory} errors`,
      rationale: `A focused exercise set for ${normalizedCategory} could help you practice this recurring correction pattern.`,
      evidence: `Saved ${normalizedCategory} corrections have a combined count of ${repeatedPattern.count}; the pattern was last seen within the last ${suggestionLimits.analysisDays} days.`,
      proposedChanges: {
        focusSkills,
        expectedFocusSkills: snapshot.focusSkills,
        exerciseFocusCategory: normalizedCategory,
      },
    })
  }

  return candidates.slice(0, 3)
}
