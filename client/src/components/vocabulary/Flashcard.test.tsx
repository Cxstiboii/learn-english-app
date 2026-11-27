import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Flashcard } from './Flashcard'

describe('Flashcard', () => {
  it('uses the selected UK accent when speaking a term', async () => {
    class FakeSpeechSynthesisUtterance {
      lang = ''
      text: string

      constructor(text: string) {
        this.text = text
      }
    }

    Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: FakeSpeechSynthesisUtterance,
    })
    const user = userEvent.setup()
    const speak = vi.mocked(window.speechSynthesis.speak)

    render(
      <Flashcard
        card={{
          id: 'card-1',
          term: 'throughput',
          definition: 'The rate at which work is completed.',
          example: null,
          deck: null,
          ease_factor: 2.5,
          interval_days: 1,
          repetitions: 0,
          due_at: '2026-01-01T00:00:00.000Z',
          created_at: '2026-01-01T00:00:00.000Z',
        }}
        accent="uk"
        cardNumber={1}
        isRevealed={false}
        isReviewing={false}
        onRate={() => undefined}
        onReveal={() => undefined}
        totalCards={1}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Listen to throughput' }))

    expect(speak).toHaveBeenCalledOnce()
    expect(speak.mock.calls[0]?.[0].lang).toBe('en-GB')
  })

  it('cancels speech synthesis when the component unmounts', () => {
    const { unmount } = render(
      <Flashcard
        card={{
          id: 'card-1',
          term: 'throughput',
          definition: 'The rate at which work is completed.',
          example: null,
          deck: null,
          ease_factor: 2.5,
          interval_days: 1,
          repetitions: 0,
          due_at: '2026-01-01T00:00:00.000Z',
          created_at: '2026-01-01T00:00:00.000Z',
        }}
        cardNumber={1}
        isRevealed={false}
        isReviewing={false}
        onRate={() => undefined}
        onReveal={() => undefined}
        totalCards={1}
      />,
    )

    unmount()

    expect(window.speechSynthesis.cancel).toHaveBeenCalledOnce()
  })
})
