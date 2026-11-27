import assert from 'node:assert/strict'
import request from 'supertest'
import { beforeAll, describe, it } from 'vitest'

process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

let app: (typeof import('./app.js'))['app']

beforeAll(async () => {
  const serverApp = await import('./app.js')
  app = serverApp.app
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
})
