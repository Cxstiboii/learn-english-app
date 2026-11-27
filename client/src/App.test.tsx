import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./pages/Auth', () => ({ default: () => null }))
vi.mock('./pages/Chat', () => ({ default: () => null }))
vi.mock('./pages/Exercises', () => ({ default: () => null }))
vi.mock('./pages/Home', () => ({ default: () => null }))
vi.mock('./pages/Progress', () => ({ default: () => null }))
vi.mock('./pages/Speaking', () => ({ default: () => null }))
vi.mock('./pages/StudyPath', () => ({ default: () => null }))
vi.mock('./pages/Vocabulary', () => ({ default: () => null }))

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    loading: false,
    error: null,
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

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.queryByRole('navigation', { name: 'Primary navigation' }))
      .not.toBeInTheDocument()

    expect(screen.getByRole('button', { name: exitLabel })).toBeInTheDocument()
    expect(screen.getByRole('timer')).toBeInTheDocument()
  })
})
