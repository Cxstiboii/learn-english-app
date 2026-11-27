import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ProfileSuggestion } from '../../services/profileSuggestions'
import { SuggestionsForYouCard } from './SuggestionsForYouCard'

const { getSuggestionsMock, acceptMock, dismissMock } = vi.hoisted(() => ({
  getSuggestionsMock: vi.fn(),
  acceptMock: vi.fn(),
  dismissMock: vi.fn(),
}))
vi.mock('../../services/profileSuggestions', () => ({
  getProfileSuggestions: getSuggestionsMock,
  acceptProfileSuggestion: acceptMock,
  dismissProfileSuggestion: dismissMock,
}))

const suggestion: ProfileSuggestion = {
  id: '00000000-0000-4000-8000-000000000901',
  kind: 'targeted_error_practice',
  title: 'Practice recurring grammar errors',
  rationale: 'A focused set may help with this pattern.',
  evidence: 'Saved grammar corrections have a combined count of 4.',
  createdAt: '2026-11-27T15:00:00.000Z',
}

function renderCard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route element={<SuggestionsForYouCard />} path="/settings" />
          <Route element={<Location />} path="*" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function Location() {
  const location = useLocation()
  return <p>{location.pathname}{location.search}</p>
}

afterEach(() => {
  getSuggestionsMock.mockReset()
  acceptMock.mockReset()
  dismissMock.mockReset()
})

describe('SuggestionsForYouCard', () => {
  it('shows the evidence and waits for the learner to accept before applying a suggestion', async () => {
    getSuggestionsMock.mockResolvedValue([suggestion])
    acceptMock.mockResolvedValue({ id: suggestion.id, status: 'accepted', nextAction: null })
    const user = userEvent.setup()

    renderCard()

    expect(await screen.findByText(suggestion.rationale)).toBeInTheDocument()
    expect(screen.getByText(suggestion.evidence)).toBeInTheDocument()
    expect(acceptMock).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Accept' }))

    expect(acceptMock).toHaveBeenCalledOnce()
    expect(acceptMock.mock.calls[0]?.[0]).toBe(suggestion.id)
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Suggestion accepted. Your settings have been updated.',
    )
  })

  it('opens focused exercise practice only after the learner accepts that suggestion', async () => {
    getSuggestionsMock.mockResolvedValue([suggestion])
    acceptMock.mockResolvedValue({
      id: suggestion.id,
      status: 'accepted',
      nextAction: { type: 'exercise', focusCategory: 'grammar' },
    })
    const user = userEvent.setup()

    renderCard()
    await user.click(await screen.findByRole('button', { name: 'Accept' }))

    expect(await screen.findByText('/exercises?focusCategory=grammar')).toBeInTheDocument()
  })
})
