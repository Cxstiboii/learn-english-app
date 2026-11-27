import { describe, expect, it } from 'vitest'
import {
  buildProfileSuggestions,
  type FocusSkill,
  type ProfileSuggestionSnapshot,
} from './profileSuggestionRules.js'

const now = new Date('2026-11-27T15:00:00.000Z')

function makeSnapshot(
  overrides: Partial<ProfileSuggestionSnapshot> = {},
): ProfileSuggestionSnapshot {
  return {
    profileCreatedAt: '2026-10-01T00:00:00.000Z',
    dailyGoalMinutes: 60,
    targetLevel: 'B1',
    focusSkills: ['speaking', 'writing', 'listening', 'vocab_grammar'],
    dailyActivity: [],
    recentEvaluations: [],
    skillPracticeCounts: {
      speaking: 4,
      writing: 4,
      listening: 4,
      vocab_grammar: 4,
    },
    errorPatterns: [],
    ...overrides,
  }
}

function getSuggestions(snapshot: ProfileSuggestionSnapshot) {
  return buildProfileSuggestions(snapshot, [], now)
}

describe('buildProfileSuggestions', () => {
  it('suggests lowering the goal after seven complete low-activity days', () => {
    const todayKey = '2026-11-27'
    const dailyActivity = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(`${todayKey}T00:00:00.000Z`)
      date.setUTCDate(date.getUTCDate() - index - 1)
      return { date: date.toISOString().slice(0, 10), minutes: 29 }
    })

    expect(getSuggestions(makeSnapshot({ dailyActivity }))).toContainEqual(
      expect.objectContaining({
        kind: 'lower_daily_goal',
        proposedChanges: {
          dailyGoalMinutes: 45,
          expectedDailyGoalMinutes: 60,
        },
      }),
    )
  })

  it('does not suggest lowering the goal from fewer than seven low-activity days', () => {
    const dailyActivity = Array.from({ length: 14 }, (_, index) => {
      const date = new Date('2026-11-27T00:00:00.000Z')
      date.setUTCDate(date.getUTCDate() - index - 1)
      return {
        date: date.toISOString().slice(0, 10),
        minutes: index < 6 ? 0 : 40,
      }
    })

    expect(getSuggestions(makeSnapshot({ dailyActivity }))
      .some(({ kind }) => kind === 'lower_daily_goal')).toBe(false)
  })

  it('suggests a higher target only after several sustained high estimated scores', () => {
    const recentEvaluations = [8, 8.5, 7.5].map((score, index) => ({
      score,
      createdAt: new Date(now.getTime() - index * 60 * 60 * 1000).toISOString(),
    }))

    expect(getSuggestions(makeSnapshot({ recentEvaluations }))).toContainEqual(
      expect.objectContaining({
        kind: 'raise_target_level',
        evidence: expect.stringContaining('estimates, not official results'),
        proposedChanges: {
          targetLevel: 'B1+',
          expectedTargetLevel: 'B1',
        },
      }),
    )
  })

  it('does not suggest a higher target when one of the recent estimates is below threshold', () => {
    const recentEvaluations = [8, 8, 7].map((score, index) => ({
      score,
      createdAt: new Date(now.getTime() - index * 60 * 60 * 1000).toISOString(),
    }))

    expect(getSuggestions(makeSnapshot({ recentEvaluations }))
      .some(({ kind }) => kind === 'raise_target_level')).toBe(false)
  })

  it('suggests moving a barely practiced priority skill lower in the plan', () => {
    const skillPracticeCounts: Record<FocusSkill, number> = {
      speaking: 0,
      writing: 3,
      listening: 3,
      vocab_grammar: 3,
    }

    expect(getSuggestions(makeSnapshot({ skillPracticeCounts }))).toContainEqual(
      expect.objectContaining({
        kind: 'adjust_skill_plan',
        proposedChanges: {
          focusSkills: ['writing', 'listening', 'vocab_grammar', 'speaking'],
          expectedFocusSkills: ['speaking', 'writing', 'listening', 'vocab_grammar'],
        },
      }),
    )
  })

  it('suggests focused practice for a repeated recent error category', () => {
    const errorPatterns = [{
      category: 'grammar',
      count: 3,
      lastSeenAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    }]

    expect(getSuggestions(makeSnapshot({ errorPatterns }))).toContainEqual(
      expect.objectContaining({
        kind: 'targeted_error_practice',
        proposedChanges: expect.objectContaining({
          exerciseFocusCategory: 'grammar',
          expectedFocusSkills: ['speaking', 'writing', 'listening', 'vocab_grammar'],
        }),
      }),
    )
  })

  it('does not duplicate pending suggestion kinds and caps results at three', () => {
    const dailyActivity = Array.from({ length: 7 }, (_, index) => {
      const date = new Date('2026-11-27T00:00:00.000Z')
      date.setUTCDate(date.getUTCDate() - index - 1)
      return { date: date.toISOString().slice(0, 10), minutes: 0 }
    })
    const recentEvaluations = [8, 8, 8].map((score, index) => ({
      score,
      createdAt: new Date(now.getTime() - index * 60 * 60 * 1000).toISOString(),
    }))
    const skillPracticeCounts: Record<FocusSkill, number> = {
      speaking: 4,
      writing: 0,
      listening: 4,
      vocab_grammar: 4,
    }
    const errorPatterns = [{
      category: 'grammar',
      count: 3,
      lastSeenAt: now.toISOString(),
    }]

    const suggestions = buildProfileSuggestions(
      makeSnapshot({ dailyActivity, recentEvaluations, errorPatterns, skillPracticeCounts }),
      ['lower_daily_goal'],
      now,
    )

    expect(suggestions).toHaveLength(3)
    expect(new Set(suggestions.map(({ kind }) => kind)).size).toBe(suggestions.length)
    expect(suggestions.some(({ kind }) => kind === 'lower_daily_goal')).toBe(false)
  })
})
