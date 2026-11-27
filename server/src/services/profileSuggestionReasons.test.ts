import { afterEach, describe, expect, it, vi } from 'vitest'

const { generateJSONMock } = vi.hoisted(() => ({ generateJSONMock: vi.fn() }))
vi.mock('./ai/aiClient.js', () => ({ generateJSON: generateJSONMock }))
vi.mock('./learnerContext.js', () => ({
  renderStudentData: (value: unknown) => `<student_text>${JSON.stringify(value)}</student_text>`,
}))

import { addFriendlyRationales } from './profileSuggestionReasons.js'
import type { ProfileSuggestionCandidate } from './profileSuggestionRules.js'

const candidate: ProfileSuggestionCandidate = {
  kind: 'lower_daily_goal',
  title: 'Try a smaller daily goal',
  rationale: 'Deterministic fallback text with the measured evidence.',
  evidence: '7 of 14 complete days were below half of the 60-minute daily goal.',
  proposedChanges: { dailyGoalMinutes: 45, expectedDailyGoalMinutes: 60 },
}

afterEach(() => {
  generateJSONMock.mockReset()
  vi.restoreAllMocks()
})

describe('addFriendlyRationales', () => {
  it('uses the AI wording when it validates against the requested kinds', async () => {
    generateJSONMock.mockResolvedValue({
      rationales: [{
        kind: candidate.kind,
        rationale: 'A smaller daily target may feel easier to maintain.',
      }],
    })

    await expect(addFriendlyRationales([candidate])).resolves.toEqual([{
      ...candidate,
      rationale: 'A smaller daily target may feel easier to maintain.',
    }])
    expect(generateJSONMock).toHaveBeenCalledOnce()
  })

  it('falls back to the deterministic rationale when the AI call fails', async () => {
    generateJSONMock.mockRejectedValue(new Error('provider unavailable'))
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await expect(addFriendlyRationales([candidate])).resolves.toEqual([candidate])
    expect(warning).toHaveBeenCalledOnce()
  })
})
