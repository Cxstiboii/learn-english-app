import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Onboarding from './Onboarding'
import { completeOnboarding } from '../services/onboarding'

vi.mock('../services/onboarding', () => ({
  getOnboardingStatus: vi.fn(),
  completeOnboarding: vi.fn(),
  getPlacementQuestions: vi.fn(),
  submitPlacementAnswers: vi.fn(),
}))
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}))

const mockedCompleteOnboarding = vi.mocked(completeOnboarding)

function renderOnboarding() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/path" element={<p>Study path</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Onboarding', () => {
  beforeEach(() => {
    mockedCompleteOnboarding.mockReset()
  })

  it('does not advance from the level step until a current level is selected', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    await user.click(screen.getByRole('checkbox', { name: 'Get a remote job' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { name: 'Choose your level' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Choose your current level')
    expect(screen.getByText('Step 2 of 5: Level')).toBeInTheDocument()
  })

  it('saves the completed plan and navigates to the study path', async () => {
    const user = userEvent.setup()
    mockedCompleteOnboarding.mockResolvedValue()
    renderOnboarding()

    await user.click(screen.getByRole('checkbox', { name: 'Get a remote job' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('radio', { name: /B1\. I can handle everyday conversations/ }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Software area' }), 'frontend')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Start learning' }))

    expect(await screen.findByText('Study path')).toBeInTheDocument()
    await waitFor(() => {
      expect(mockedCompleteOnboarding).toHaveBeenCalledWith(expect.objectContaining({
        currentLevel: 'B1',
        targetLevel: 'B2',
        dailyGoalMinutes: 30,
        preferences: expect.objectContaining({
          goals: ['remote_job'],
          softwareArea: 'frontend',
        }),
      }))
    })
  })
})
