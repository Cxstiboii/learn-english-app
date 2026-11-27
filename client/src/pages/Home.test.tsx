import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppLayout from '../components/layout/AppLayout'
import Home from './Home'

const { useProgressSummaryMock } = vi.hoisted(() => ({
  useProgressSummaryMock: vi.fn(),
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ signOut: vi.fn() }),
}))

vi.mock('../hooks/useProgressSummary', () => ({
  useProgressSummary: useProgressSummaryMock,
}))

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
        </Route>
        <Route path="mock/writing" element={<h1>Writing mock destination</h1>} />
        <Route path="interview" element={<h1>Interview destination</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Home navigation cards', () => {
  beforeEach(() => {
    useProgressSummaryMock.mockReturnValue({
      data: {
        dailyStreak: 2,
        dailyGoalMinutes: 30,
        todayMinutes: 10,
      },
      isError: false,
      isLoading: false,
    })
  })

  it.each([
    ['Writing Mock', 'Writing mock destination'],
    ['Interview', 'Interview destination'],
  ])('navigates to %s without rendering the Navbar', async (title, destination) => {
    const user = userEvent.setup()
    renderHome()

    const cards = screen.getByRole('region', { name: 'Learning sections' })
    await user.click(within(cards).getByRole('link', { name: new RegExp(title) }))

    expect(screen.getByRole('heading', { name: destination })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' }))
      .not.toBeInTheDocument()
    expect(screen.queryByRole('status', {
      name: '2 day streak, 10 of 30 minutes today',
    })).not.toBeInTheDocument()
  })

  it('shows a subtle loading state for the progress summary', () => {
    useProgressSummaryMock.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: true,
    })
    renderHome()

    expect(screen.getByRole('status', { name: 'Loading progress summary' }))
      .toHaveTextContent('…')
  })

  it('shows a subtle error state when the progress summary is unavailable', () => {
    useProgressSummaryMock.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
    })
    renderHome()

    expect(screen.getByRole('status', { name: 'Progress summary unavailable' }))
      .toHaveTextContent('—')
  })
})
