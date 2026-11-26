import assert from 'node:assert/strict'
import { test } from 'node:test'

process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

const { normalizeGeneratedExerciseQuestion } = await import('./exerciseService.js')

test('normalizes Gemini question keys to the exercise prompt field', () => {
  const normalized = normalizeGeneratedExerciseQuestion({
    question: 'Choose the correct verb.',
    options: ['is', 'are', 'am'],
  })

  assert.deepEqual(normalized, {
    prompt: 'Choose the correct verb.',
    options: ['is', 'are', 'am'],
  })
})

test('keeps prompt and removes a redundant question key', () => {
  const normalized = normalizeGeneratedExerciseQuestion({
    prompt: 'Choose the correct verb.',
    question: 'A redundant alternate label.',
    options: ['is', 'are', 'am'],
  })

  assert.deepEqual(normalized, {
    prompt: 'Choose the correct verb.',
    options: ['is', 'are', 'am'],
  })
})
