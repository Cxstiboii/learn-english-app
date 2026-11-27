import { describe, expect, it } from 'vitest'
import type { LearnerSettings } from '../types/preferences'
import type { Unit } from '../types/path'
import { getPreferredActivityId, getRecommendedUnitIds } from './pathPersonalization'

const settings: LearnerSettings = {
  currentLevel: 'B1',
  targetLevel: 'B2',
  dailyGoalMinutes: 45,
  preferences: {
    goals: ['interviews', 'remote_job'],
    examTarget: 'none',
    examTargetScore: null,
    examDate: null,
    levelSource: 'self',
    focusSkills: ['speaking', 'writing', 'listening', 'vocab_grammar'],
    softwareArea: 'backend',
    interests: ['system design'],
    aboutMe: null,
    studyDays: [1, 2, 3],
    correctionStyle: 'major_errors',
    explanationLanguage: 'english_only',
    tone: 'friendly',
    replyLength: 'medium',
    accent: 'uk',
    saveTranscripts: true,
  },
}

function makeUnit(
  id: string,
  number: number,
  title: string,
  filterLevels: Unit['filterLevels'],
  activityType: Unit['activities'][number]['type'],
): Unit {
  return {
    id,
    number,
    level: 'B1',
    filterLevels,
    title,
    description: '',
    status: 'Disponible',
    progress: { completedActivities: 0, totalActivities: 1, percentage: 0 },
    activities: [{
      id: `${id}-activity`,
      title,
      type: activityType,
      durationMinutes: 10,
      phrase: 'Example.',
      practiceKey: 'Practice',
      status: 'available',
      completedAt: null,
    }],
  }
}

describe('study path personalization', () => {
  it('recommends units aligned to the learner goals and target level without filtering the source units', () => {
    const units = [
      makeUnit('general', 1, 'Technical vocabulary', ['a2'], 'Vocabulario'),
      makeUnit('interviews', 2, 'System Design Interview and remote role', ['b2'], 'Speaking'),
    ]

    expect([...getRecommendedUnitIds(units, settings)]).toContain('interviews')
    expect(units).toHaveLength(2)
  })

  it('selects the first available activity matching the highest-priority skill', () => {
    const units = [
      makeUnit('writing', 1, 'Write an update', ['b1'], 'Slack-Escritura'),
      makeUnit('speaking', 2, 'Practice an interview', ['b2'], 'Speaking'),
    ]

    expect(getPreferredActivityId(units, settings.preferences.focusSkills))
      .toBe('speaking-activity')
  })
})
