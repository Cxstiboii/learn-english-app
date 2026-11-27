import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

const { rpcMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
}))

vi.mock('../config/supabase.js', () => ({
  supabaseAdmin: { rpc: rpcMock },
}))

process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.AI_PROVIDER = 'google'
process.env.AI_API_KEY = 'test-google-api-key'
process.env.AI_MODEL = 'gemini-3.5-flash-lite'

const { prepareEvaluationForStorage, saveEvaluationAtomically } = await import('./evaluationService.js')

const savedEvaluationSchema = z.object({
  sessionId: z.string().uuid(),
})

const userId = '00000000-0000-4000-8000-000000000701'
const idempotencyKey = '00000000-0000-4000-8000-000000000711'
const savedEvaluation = { sessionId: '00000000-0000-4000-8000-000000000721' }

function getSaveInput() {
  return {
    userId,
    idempotencyKey,
    type: 'speaking' as const,
    saveTranscripts: true,
    evaluation: { prompt: 'Describe a deployment.' },
    patterns: [],
    resultSchema: savedEvaluationSchema,
    errorCode: 'SPEAKING_SAVE_FAILED',
    errorMessage: 'Unable to save the speaking evaluation.',
  }
}

describe('saveEvaluationAtomically', () => {
  beforeEach(() => {
    rpcMock.mockReset()
  })

  it('saves an evaluation and returns the RPC result', async () => {
    rpcMock.mockResolvedValue({ data: savedEvaluation, error: null })

    await expect(saveEvaluationAtomically(getSaveInput())).resolves.toEqual(savedEvaluation)
    expect(rpcMock).toHaveBeenCalledOnce()
    expect(rpcMock).toHaveBeenCalledWith(
      'save_evaluation_atomically',
      expect.objectContaining({
        p_user_id: userId,
        p_idempotency_key: idempotencyKey,
        p_evaluation_type: 'speaking',
      }),
    )
  })

  it('reports an RPC failure without attempting separate writes', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'transaction failed' } })

    await expect(saveEvaluationAtomically(getSaveInput())).rejects.toMatchObject({
      code: 'SPEAKING_SAVE_FAILED',
      statusCode: 500,
    })
    expect(rpcMock).toHaveBeenCalledOnce()
  })

  it('reuses the same idempotency key when the operation is retried', async () => {
    rpcMock
      .mockResolvedValueOnce({ data: null, error: { message: 'connection interrupted' } })
      .mockResolvedValueOnce({ data: savedEvaluation, error: null })

    await expect(saveEvaluationAtomically(getSaveInput())).rejects.toMatchObject({
      code: 'SPEAKING_SAVE_FAILED',
    })
    await expect(saveEvaluationAtomically(getSaveInput())).resolves.toEqual(savedEvaluation)

    expect(rpcMock).toHaveBeenCalledTimes(2)
    expect(rpcMock.mock.calls[0][1].p_idempotency_key)
      .toBe(rpcMock.mock.calls[1][1].p_idempotency_key)
  })

  it('omits submitted text from stored speaking, writing, and interview results when privacy is off', () => {
    const privateText = 'private transcript and response text'
    const speaking = prepareEvaluationForStorage('speaking', {
      prompt: 'private speaking prompt',
      transcript: privateText,
      scores: { fluency: 7, estimatedBand: 6.5 },
      feedback: {
        b2UpgradeSuggestion: 'private suggestion',
        corrections: [{ category: 'grammar', original: 'I goes', corrected: 'I go' }],
        disclaimer: 'Estimated score, not an official result.',
      },
    }, false)
    const writing = prepareEvaluationForStorage('writing', {
      exam_mode: 'ielts',
      prompt: 'private writing prompt',
      response: privateText,
      word_count: 70,
      scores: { estimatedBand: 6 },
      feedback: {
        suggestions: ['private writing feedback'],
        corrections: [],
        disclaimer: 'Estimated score, not an official result.',
      },
    }, false)
    const interview = prepareEvaluationForStorage('interview', {
      track: 'behavioral',
      questions: ['private interview question'],
      answers: [{ transcript: privateText }],
      evaluation: {
        estimatedCEFR: 'B1',
        summary: 'private interview summary',
        disclaimer: 'Estimated score, not an official result.',
      },
    }, false)

    for (const result of [speaking, writing, interview]) {
      expect(JSON.stringify(result)).not.toContain('private')
    }
    expect(speaking.scores).toEqual({ fluency: 7, estimatedBand: 6.5 })
    expect(writing.response).toBe('')
    expect(writing.prompt).toBe('')
    expect(interview.questions).toEqual([])
    expect(interview.answers).toEqual([])
  })
})
