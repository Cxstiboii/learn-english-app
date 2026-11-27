import { describe, expect, it, vi } from 'vitest'
import { pathActivityRoutes } from './path'

vi.mock('./api', () => ({ apiFetch: vi.fn() }))

describe('pathActivityRoutes', () => {
  it('maps speaking, vocabulary, and writing activities to their practice routes', () => {
    expect(pathActivityRoutes.Speaking).toBe('/speaking')
    expect(pathActivityRoutes.Vocabulario).toBe('/vocabulary')
    expect(pathActivityRoutes['Slack-Escritura']).toBe('/mock/writing')
  })
})
