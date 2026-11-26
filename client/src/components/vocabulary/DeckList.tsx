import { Badge, Card } from '../ui'
import type { DeckId, VocabularyDeck } from './types'

interface DeckListProps {
  decks: VocabularyDeck[]
  activeDeckId: DeckId | null
  remainingByDeck: Record<DeckId, number>
  onSelect: (deckId: DeckId) => void
}

export function DeckList({
  activeDeckId,
  decks,
  onSelect,
  remainingByDeck,
}: DeckListProps) {
  return (
    <aside aria-label="Study decks" className="flex flex-col gap-gutter-md lg:col-span-4">
      <Card className="flex flex-col gap-gutter-md" padding="lg">
        <h2 className="font-headline text-headline-md text-light-on-surface">Active Decks</h2>
        <ul className="flex flex-col gap-gutter-sm">
          {decks.map((deck) => {
            const isActive = deck.id === activeDeckId

            return (
              <li key={deck.id}>
                <button
                  aria-pressed={isActive}
                  className={`flex w-full items-center justify-between gap-2 rounded-default border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary focus-visible:ring-offset-2 ${
                    isActive
                      ? 'border-light-primary bg-light-surface-container-low'
                      : 'border-light-outline-variant bg-light-surface-container-lowest hover:bg-light-surface-container-low'
                  }`}
                  onClick={() => onSelect(deck.id)}
                  type="button"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-label text-label-md text-light-on-surface">
                      {deck.name}
                    </span>
                    <span className="font-mono text-label-sm text-light-on-surface-variant">
                      {remainingByDeck[deck.id] ?? 0} due now
                    </span>
                  </span>
                  <Badge variant={isActive ? 'success' : 'neutral'}>
                    {isActive ? 'Active' : 'Select'}
                  </Badge>
                </button>
              </li>
            )
          })}
        </ul>
      </Card>
    </aside>
  )
}
