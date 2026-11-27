import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { getPreferences } from './services/preferences'
import type { LearnerSettings } from './types/preferences'

vi.mock('./pages/Auth', () => ({ default: () => null }))
vi.mock('./pages/Onboarding', () => ({ default: () => null }))
vi.mock('./pages/Chat', () => ({ default: () => null }))
vi.mock('./pages/Exercises', () => ({ default: () => null }))
vi.mock('./pages/Home', () => ({ default: () => null }))
vi.mock('./pages/Progress', () => ({ default: () => null }))
vi.mock('./pages/Speaking', () => ({ default: () => null }))
vi.mock('./pages/StudyPath', () => ({ default: () => null }))
vi.mock('./pages/Vocabulary', () => ({ default: () => null }))
vi.mock('./services/preferences', () => ({
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
}))
vi.mock('./services/auth', () => ({
  authService: { updatePassword: vi.fn() },
}))
vi.mock('./hooks/useProfileSuggestions', () => ({
  useProfileSuggestions: () => ({ data: [], isLoading: false, isError: false }),
  useAcceptProfileSuggestion: () => ({ isPending: false, isError: false, mutate: vi.fn() }),
  useDismissProfileSuggestion: () => ({ isPending: false, isError: false, mutate: vi.fn() }),
}))

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    loading: false,
    error: null,
  }),
}))

vi.mock('./hooks/useOnboarding', () => ({
  useOnboardingStatus: () => ({
    data: { completed: true },
    isError: false,
    isLoading: false,
  }),
}))

vi.mock('./hooks/useProgressSummary', () => ({
  useProgressSummary: () => ({
    data: undefined,
    isError: false,
    isLoading: false,
  }),
}))

vi.mock('./hooks/useWriting', () => ({
  useGradeWriting: () => ({
    data: undefined,
    error: null,
    isError: false,
    isPending: false,
    mutate: vi.fn(),
    variables: undefined,
  }),
}))

vi.mock('./hooks/useInterview', () => ({
  useEvaluateInterview: () => ({
    error: null,
    isError: false,
    isPending: false,
    mutate: vi.fn(),
    reset: vi.fn(),
    variables: undefined,
  }),
}))

describe('focus page routes', () => {
  it.each([
    ['/mock/writing', 'Exit Mock'],
    ['/interview', 'Back'],
  ])('%s renders FocusLayout without the Navbar', (path, exitLabel) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    })

    const router = createMemoryRouter([{ path: '*', element: <App /> }], {
      initialEntries: [path],
    })
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    expect(screen.queryByRole('navigation', { name: 'Primary navigation' }))
      .not.toBeInTheDocument()

    expect(screen.getByRole('button', { name: exitLabel })).toBeInTheDocument()
    expect(screen.getByRole('timer')).toBeInTheDocument()
  })
})

describe('settings route', () => {
  it('renders in the app layout and is reachable from the user menu', async () => {
    const settings: LearnerSettings = {
      currentLevel: 'B1',
      targetLevel: 'B2',
      dailyGoalMinutes: 30,
      preferences: {
        goals: ['remote_job'],
        examTarget: 'none',
        examTargetScore: null,
        examDate: null,
        levelSource: 'self',
        focusSkills: ['speaking', 'listening', 'writing', 'vocab_grammar'],
        softwareArea: 'frontend',
        interests: [],
        aboutMe: null,
        studyDays: [1, 2, 3],
        correctionStyle: 'major_errors',
        explanationLanguage: 'english_only',
        tone: 'friendly',
        replyLength: 'medium',
        accent: 'us',
        saveTranscripts: true,
      },
    }
    vi.mocked(getPreferences).mockResolvedValue(settings)
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    })
    const router = createMemoryRouter([{ path: '*', element: <App /> }], {
      initialEntries: ['/settings'],
    })
    const user = userEvent.setup()

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Goals & level' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Account' }))
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveAttribute('href', '/settings')
  })
})
