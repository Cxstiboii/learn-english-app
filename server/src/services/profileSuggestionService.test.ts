import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock, rpcMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
}))
vi.mock('../config/supabase.js', () => ({
  supabaseAdmin: { from: fromMock, rpc: rpcMock },
}))

process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.AI_PROVIDER = 'google'
process.env.AI_API_KEY = 'test-google-api-key'
process.env.AI_MODEL = 'gemini-3.5-flash-lite'

const { acceptProfileSuggestion, getProfileSuggestions } = await import('./profileSuggestionService.js')

const userId = '00000000-0000-4000-8000-000000000801'
const suggestionId = '00000000-0000-4000-8000-000000000802'

function mockSuggestionLookup(data: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error: null })
  const userFilter = vi.fn(() => ({ maybeSingle }))
  const idFilter = vi.fn(() => ({ eq: userFilter }))
  const select = vi.fn(() => ({ eq: idFilter }))
  fromMock.mockReturnValue({ select })
  return { idFilter, userFilter }
}

describe('acceptProfileSuggestion', () => {
  beforeEach(() => {
    fromMock.mockReset()
    rpcMock.mockReset()
  })

  it('filters suggestion lookup by the authenticated user and hides another user’s suggestion', async () => {
    const { userFilter } = mockSuggestionLookup(null)

    await expect(acceptProfileSuggestion(userId, suggestionId)).rejects.toMatchObject({
      statusCode: 404,
      code: 'SUGGESTION_NOT_FOUND',
    })

    expect(fromMock).toHaveBeenCalledWith('profile_suggestions')
    expect(userFilter).toHaveBeenCalledWith('user_id', userId)
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('rejects proposed changes containing fields outside the whitelist', async () => {
    mockSuggestionLookup({
      kind: 'lower_daily_goal',
      title: 'Try a smaller daily goal',
      rationale: 'Consider a lower target.',
      evidence: 'Seven recent days were below half the goal.',
      proposed_changes: {
        dailyGoalMinutes: 45,
        expectedDailyGoalMinutes: 60,
        user_id: 'another-user',
      },
      status: 'pending',
    })

    await expect(acceptProfileSuggestion(userId, suggestionId)).rejects.toMatchObject({
      statusCode: 500,
      code: 'SUGGESTION_CHANGES_INVALID',
    })
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('accepts a whitelisted proposal using the authenticated user ID', async () => {
    mockSuggestionLookup({
      kind: 'lower_daily_goal',
      title: 'Try a smaller daily goal',
      rationale: 'Consider a lower target.',
      evidence: 'Seven recent days were below half the goal.',
      proposed_changes: {
        dailyGoalMinutes: 45,
        expectedDailyGoalMinutes: 60,
      },
      status: 'pending',
    })
    rpcMock.mockResolvedValue({
      data: {
        id: suggestionId,
        kind: 'lower_daily_goal',
        status: 'accepted',
        proposedChanges: {
          dailyGoalMinutes: 45,
          expectedDailyGoalMinutes: 60,
        },
      },
      error: null,
    })

    await expect(acceptProfileSuggestion(userId, suggestionId)).resolves.toEqual({
      id: suggestionId,
      status: 'accepted',
      nextAction: null,
    })
    expect(rpcMock).toHaveBeenCalledWith('resolve_profile_suggestion', {
      p_user_id: userId,
      p_suggestion_id: suggestionId,
      p_action: 'accept',
    })
  })

  it('does not generate suggestions more than once in the same day', async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.order.mockReturnValue(query)
    query.limit.mockResolvedValue({ data: [], error: null })
    fromMock.mockReturnValue(query)
    rpcMock.mockResolvedValue({ data: false, error: null })

    await expect(getProfileSuggestions(userId)).resolves.toEqual([])

    expect(rpcMock).toHaveBeenCalledOnce()
    expect(rpcMock).toHaveBeenCalledWith(
      'claim_profile_suggestion_generation',
      { p_user_id: userId },
    )
    expect(fromMock).toHaveBeenCalledTimes(2)
  })

  it('returns at most three existing pending suggestions without running another generation', async () => {
    const data = [
      {
        id: '00000000-0000-4000-8000-000000000811',
        kind: 'lower_daily_goal',
        title: 'Try a smaller daily goal',
        rationale: 'Consider a lower target.',
        evidence: 'Seven days were below half the goal.',
        proposed_changes: {
          dailyGoalMinutes: 45,
          expectedDailyGoalMinutes: 60,
        },
        status: 'pending',
        created_at: '2026-11-27T15:00:00.000Z',
      },
      {
        id: '00000000-0000-4000-8000-000000000812',
        kind: 'raise_target_level',
        title: 'Consider a higher target level',
        rationale: 'Recent estimates may indicate readiness.',
        evidence: 'Three recent estimates averaged 8.0/9.',
        proposed_changes: {
          targetLevel: 'B1+',
          expectedTargetLevel: 'B1',
        },
        status: 'pending',
        created_at: '2026-11-27T14:00:00.000Z',
      },
      {
        id: '00000000-0000-4000-8000-000000000813',
        kind: 'adjust_skill_plan',
        title: 'Adjust your skill priorities',
        rationale: 'A priority skill has little recent activity.',
        evidence: 'Speaking had no tracked sessions in 14 days.',
        proposed_changes: {
          focusSkills: ['writing', 'listening', 'vocab_grammar', 'speaking'],
          expectedFocusSkills: ['speaking', 'writing', 'listening', 'vocab_grammar'],
        },
        status: 'pending',
        created_at: '2026-11-27T13:00:00.000Z',
      },
    ]
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.order.mockReturnValue(query)
    query.limit.mockResolvedValue({ data, error: null })
    fromMock.mockReturnValue({ ...query })

    await expect(getProfileSuggestions(userId)).resolves.toHaveLength(3)

    expect(rpcMock).not.toHaveBeenCalled()
  })
})
