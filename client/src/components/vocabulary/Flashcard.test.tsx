import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Flashcard } from './Flashcard'

describe('Flashcard', () => {
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
