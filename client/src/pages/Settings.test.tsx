import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Settings from './Settings'
import { getPreferences, updatePreferences } from '../services/preferences'
import type { LearnerSettings } from '../types/preferences'

vi.mock('../services/preferences', () => ({
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
}))
vi.mock('../services/auth', () => ({
  authService: { updatePassword: vi.fn() },
}))
vi.mock('../hooks/useProfileSuggestions', () => ({
  useProfileSuggestions: () => ({ data: [], isLoading: false, isError: false }),
  useAcceptProfileSuggestion: () => ({ isPending: false, isError: false, mutate: vi.fn() }),
  useDismissProfileSuggestion: () => ({ isPending: false, isError: false, mutate: vi.fn() }),
}))
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'learner@example.com' },
    signOut: vi.fn(),
  }),
}))

const initialSettings: LearnerSettings = {
  currentLevel: 'B1',
  targetLevel: 'B2',
  dailyGoalMinutes: 30,
  preferences: {
    goals: ['remote_job', 'toefl'],
    examTarget: 'toefl',
    examTargetScore: 100,
    examDate: '2027-06-15',
    levelSource: 'self',
    focusSkills: ['speaking', 'listening', 'writing', 'vocab_grammar'],
    softwareArea: 'frontend',
    interests: ['open source'],
    aboutMe: 'Frontend developer',
    studyDays: [1, 3, 5],
    correctionStyle: 'major_errors',
    explanationLanguage: 'english_only',
    tone: 'friendly',
    replyLength: 'medium',
    accent: 'us',
    saveTranscripts: true,
  },
}

function renderSettings() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const router = createMemoryRouter([
    {
      path: '/settings',
      element: (
        <>
          <Link to="/other">Leave page</Link>
          <Settings />
        </>
      ),
    },
    { path: '/other', element: <h1>Other page</h1> },
  ], { initialEntries: ['/settings'] })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('Settings page', () => {
  beforeEach(() => {
    vi.mocked(getPreferences).mockResolvedValue(initialSettings)
    vi.mocked(updatePreferences).mockImplementation(async (settings) => settings)
  })

  it('loads the saved preference values', async () => {
    renderSettings()

    expect(await screen.findByLabelText('Current level')).toHaveValue('B1')
    expect(screen.getByLabelText('Target level')).toHaveValue('B2')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()

    await userEvent.click(screen.getByRole('tab', { name: 'Account' }))
    expect(screen.getByLabelText('Email')).toHaveValue('learner@example.com')
  })

  it('saves edited preference values', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.selectOptions(await screen.findByLabelText('Current level'), 'B2')
    expect(screen.getByText('You have unsaved changes.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(updatePreferences).toHaveBeenCalled())
    expect(vi.mocked(updatePreferences).mock.calls[0]?.[0]).toEqual({
      ...initialSettings,
      currentLevel: 'B2',
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Your settings have been saved.')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
  })

  it('asks before leaving with unsaved changes', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.selectOptions(await screen.findByLabelText('Current level'), 'B2')
    await user.click(screen.getByRole('link', { name: 'Leave page' }))

    expect(await screen.findByRole('dialog', { name: 'Unsaved changes' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Stay' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })
})
