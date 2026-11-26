import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'

process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.AI_PROVIDER = 'google'
process.env.AI_API_KEY = 'test-google-api-key'
process.env.AI_MODEL = 'gemini-3.5-flash-lite'

const { generateJSON } = await import('./aiClient.js')

test('Google JSON generation requests an application/json response', async () => {
  const originalFetch = globalThis.fetch
  let requestBody: Record<string, unknown> | undefined

  globalThis.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>
    return new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{ text: '{"answer":"ready"}' }],
        },
      }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const result = await generateJSON({
      system: 'Return an answer.',
      messages: [{ role: 'user', content: 'Say ready.' }],
      schema: z.object({ answer: z.string() }),
    })

    assert.deepEqual(result, { answer: 'ready' })
    const generationConfig = requestBody?.generationConfig as
      | Record<string, unknown>
      | undefined
    assert.equal(generationConfig?.responseMimeType, 'application/json')
  } finally {
    globalThis.fetch = originalFetch
  }
})
