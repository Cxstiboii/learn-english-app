import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.AI_PROVIDER = 'google'
process.env.AI_API_KEY = 'test-google-api-key'
process.env.AI_MODEL = 'gemini-3.5-flash-lite'

const { getChatTextForStorage } = await import('./chatService.js')

describe('chat transcript privacy', () => {
  it('does not send chat text to persistence when transcript saving is off', () => {
    const storedText = getChatTextForStorage(
      'private student message',
      'private tutor reply',
      false,
    )

    assert.deepEqual(storedText, { userMessage: '', assistantReply: '' })
    assert.ok(!JSON.stringify(storedText).includes('private'))
  })

  it('preserves chat text when transcript saving is enabled', () => {
    assert.deepEqual(
      getChatTextForStorage('student message', 'tutor reply', true),
      { userMessage: 'student message', assistantReply: 'tutor reply' },
    )
  })
})
