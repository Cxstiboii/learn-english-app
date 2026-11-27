import { useEffect } from 'react'
import { Badge, Button, Card } from '../ui'
import type { VocabCard, ReviewRating } from '../../services/vocab'

interface FlashcardProps {
  card: VocabCard
  cardNumber: number
  totalCards: number
  isRevealed: boolean
  isReviewing: boolean
  onRate: (rating: ReviewRating) => void
  onReveal: () => void
}

const ratings: Array<{ id: ReviewRating; label: string }> = [
  { id: 'again', label: 'Again' },
  { id: 'hard', label: 'Hard' },
  { id: 'good', label: 'Good' },
  { id: 'easy', label: 'Easy' },
]

const ratingClasses: Record<ReviewRating, string> = {
  again: 'bg-light-error-container text-light-on-error-container hover:opacity-90',
  hard: 'bg-warning-container text-on-warning-container hover:opacity-90',
  good: 'bg-success-container text-on-success-container hover:opacity-90',
  easy:
    'bg-light-surface-container-low text-light-on-surface hover:bg-light-surface-container-high',
}

export function Flashcard({
  card,
  cardNumber,
  isReviewing,
  isRevealed,
  onRate,
  onReveal,
  totalCards,
}: FlashcardProps) {
  useEffect(() => () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

  function speakTerm() {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(card.term))
  }

  return (
    <section aria-label="Active flashcard" className="flex flex-col gap-gutter-md lg:col-span-8">
      <Card className="flex flex-col gap-gutter-lg sm:p-gutter-xl" padding="lg">
        <header className="flex items-center justify-between gap-gutter-sm border-b border-light-outline-variant pb-gutter-md">
          <div className="flex min-w-0 items-center gap-gutter-sm">
            <Badge variant="neutral">{card.deck || 'Engineering English'}</Badge>
            <span className="shrink-0 font-mono text-label-sm tabular-nums text-light-on-surface-variant">
              Card {cardNumber} of {totalCards}
            </span>
          </div>
          <Button
            aria-label={`Listen to ${card.term}`}
            onClick={speakTerm}
            size="icon"
            variant="secondary"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-body-lg">
              volume_up
            </span>
          </Button>
        </header>

        <div className="flex flex-col gap-gutter-md py-gutter-md">
          <h2 className="font-headline text-display-lg-mobile text-light-on-surface md:text-display-lg">
            {card.term}
          </h2>
          {card.example && (
            <p className="text-pretty font-body text-body-lg text-light-on-surface-variant">
              “{card.example}”
            </p>
          )}
        </div>

        {isRevealed && (
          <section
            aria-label="Meaning and usage"
            className="flex flex-col gap-gutter-sm rounded-default border-t border-light-outline-variant bg-light-surface-container-low p-gutter-md"
          >
            <span className="font-mono text-label-sm text-light-primary">Meaning &amp; usage</span>
            <p className="font-title text-title-md text-light-on-surface">{card.definition}</p>
          </section>
        )}

        <footer className="flex flex-col gap-gutter-sm border-t border-light-outline-variant pt-gutter-md">
          {isRevealed ? (
            <div className="grid grid-cols-2 gap-gutter-sm sm:grid-cols-4">
              {ratings.map((rating) => (
                <button
                  key={rating.id}
                  className={`flex min-h-12 items-center justify-center rounded-md border border-light-outline-variant px-3 py-2.5 font-label text-label-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${ratingClasses[rating.id]}`}
                  disabled={isReviewing}
                  onClick={() => onRate(rating.id)}
                  type="button"
                >
                  {isReviewing ? 'Saving…' : rating.label}
                </button>
              ))}
            </div>
          ) : (
            <Button className="w-full py-3" onClick={onReveal}>
              Show Answer
            </Button>
          )}
        </footer>
      </Card>
    </section>
  )
}
