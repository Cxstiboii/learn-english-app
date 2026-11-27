import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import WritingMock from './WritingMock'

vi.mock('../hooks/useWriting', () => ({
  useGradeWriting: () => ({
    data: undefined,
    error: null,
    isError: false,
    isPending: false,
    mutate: () => undefined,
    variables: undefined,
  }),
}))

function renderWritingMock() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <WritingMock />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('WritingMock', () => {
  it('counts words and disables Submit below the minimum', async () => {
    const user = userEvent.setup()
    renderWritingMock()

    const response = screen.getByRole('textbox', { name: 'Your Response' })
    const submit = screen.getByRole('button', { name: 'Submit for AI Grading' })

    expect(screen.getByText('0 / 100 words')).toBeInTheDocument()
    expect(submit).toBeDisabled()

    await user.type(response, 'one two three')

    expect(screen.getByText('3 / 100 words')).toBeInTheDocument()
    expect(submit).toBeDisabled()
  })
})
