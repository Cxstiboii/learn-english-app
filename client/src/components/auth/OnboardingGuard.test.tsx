import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OnboardingGuard } from './OnboardingGuard'
import { getOnboardingStatus } from '../../services/onboarding'

vi.mock('../../services/onboarding', () => ({
  getOnboardingStatus: vi.fn(),
  completeOnboarding: vi.fn(),
  getPlacementQuestions: vi.fn(),
  submitPlacementAnswers: vi.fn(),
}))
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}))

const mockedGetOnboardingStatus = vi.mocked(getOnboardingStatus)

function renderGuard(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<OnboardingGuard />}>
            <Route path="/onboarding" element={<p>Onboarding page</p>} />
            <Route path="/path" element={<p>Study path</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OnboardingGuard', () => {
  beforeEach(() => {
    mockedGetOnboardingStatus.mockReset()
  })

  it('redirects an incomplete account to onboarding', async () => {
    mockedGetOnboardingStatus.mockResolvedValue({ completed: false })

    renderGuard('/path')

    expect(await screen.findByText('Onboarding page')).toBeInTheDocument()
  })

  it('redirects completed accounts away from onboarding to the study path', async () => {
    mockedGetOnboardingStatus.mockResolvedValue({ completed: true })

    renderGuard('/onboarding')

    expect(await screen.findByText('Study path')).toBeInTheDocument()
  })
})
