import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'

process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.AI_PROVIDER = 'google'
process.env.AI_API_KEY = 'test-google-api-key'
process.env.AI_MODEL = 'gemini-3.5-flash-lite'

const { generateJSON } = await import('./aiClient.js')

test('Google JSON generation requests JSON and retries with validation issues', async () => {
  const originalFetch = globalThis.fetch
  const requestBodies: Record<string, unknown>[] = []
  const responses = [
    '{"answer":42}',
    '{"answer":"ready"}',
  ]

  globalThis.fetch = async (_input, init) => {
    requestBodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>)
    return new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{ text: responses.shift() }],
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
    assert.equal(requestBodies.length, 2)
    for (const requestBody of requestBodies) {
      const generationConfig = requestBody.generationConfig as Record<string, unknown>
      assert.equal(generationConfig.responseMimeType, 'application/json')
    }

    const secondSystemInstruction = requestBodies[1].systemInstruction as {
      parts: Array<{ text: string }>
    }
    assert.match(secondSystemInstruction.parts[0].text, /answer.*string/i)
  } finally {
    globalThis.fetch = originalFetch
  }
})
