import assert from 'node:assert/strict'
import request from 'supertest'
import { beforeAll, describe, it } from 'vitest'

process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

let app: (typeof import('./app.js'))['app']
let getSafeErrorMessage: (typeof import('./app.js'))['getSafeErrorMessage']

beforeAll(async () => {
  const serverApp = await import('./app.js')
  app = serverApp.app
  getSafeErrorMessage = serverApp.getSafeErrorMessage
})

describe('API app', () => {
  it('returns an ok health response', async () => {
    const response = await request(app).get('/api/health')

    assert.equal(response.status, 200)
    assert.deepEqual(response.body, { status: 'ok' })
  })

  it('rejects a protected route without a bearer token', async () => {
    const response = await request(app).get('/api/conversations')

    assert.equal(response.status, 401)
    assert.deepEqual(response.body, { error: 'A valid bearer token is required.' })
  })

  it('requires authentication to read the profile', async () => {
    const response = await request(app).get('/api/me')

    assert.equal(response.status, 401)
    assert.deepEqual(response.body, { error: 'A valid bearer token is required.' })
  })

  it('does not expose the removed AI ping or legacy tutor chat endpoints', async () => {
    const pingResponse = await request(app).post('/api/ai/ping')
    const tutorChatResponse = await request(app).post('/api/tutor/chat')

    assert.equal(pingResponse.status, 404)
    assert.equal(tutorChatResponse.status, 404)
  })

  it('returns a distinct safe message for common error statuses', () => {
    assert.deepEqual(
      [400, 401, 403, 404, 413, 500].map(getSafeErrorMessage),
      [
        'Invalid request.',
        'Authentication required.',
        'Access denied.',
        'Resource not found.',
        'Request is too large.',
        'Internal server error.',
      ],
    )
  })
})
