import { useMemo, useState, type FormEvent } from 'react'
import { DeckList } from '../components/vocabulary/DeckList'
import { Flashcard } from '../components/vocabulary/Flashcard'
import { VocabularyHeader } from '../components/vocabulary/VocabularyHeader'
import { Button, Card } from '../components/ui'
import {
  useCreateVocabCard,
  useDueCards,
  useGenerateVocabCards,
  useReviewCard,
  useVocabStats,
} from '../hooks/useVocab'
import type { ReviewRating, VocabCard } from '../services/vocab'

const noDueCards: VocabCard[] = []

function RetryNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-gutter-sm rounded-default border border-light-error bg-light-error-container px-gutter-md py-gutter-sm text-light-on-error-container"
      role="alert"
    >
      <span>{message}</span>
      <Button onClick={onRetry} size="sm" variant="secondary">Retry</Button>
    </div>
  )
}

export default function Vocabulary() {
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [topic, setTopic] = useState('')
  const [manualTerm, setManualTerm] = useState('')
  const [manualDefinition, setManualDefinition] = useState('')
  const [manualExample, setManualExample] = useState('')
  const [manualDeck, setManualDeck] = useState('')
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const dueQuery = useDueCards()
  const statsQuery = useVocabStats()
  const reviewMutation = useReviewCard()
  const createMutation = useCreateVocabCard()
  const generateMutation = useGenerateVocabCards()

  const cards = dueQuery.data ?? noDueCards
  const decks = useMemo(() => {
    const counts = new Map<string, number>()
    cards.forEach((card) => {
      const name = card.deck?.trim() || 'Engineering English'
      counts.set(name, (counts.get(name) ?? 0) + 1)
    })
    return [...counts].map(([name, due]) => ({ id: name, name, due }))
  }, [cards])
  const remainingByDeck = Object.fromEntries(decks.map(({ id, due }) => [id, due]))

  const activeDeckId = selectedDeckId && decks.some(({ id }) => id === selectedDeckId)
    ? selectedDeckId
    : decks[0]?.id ?? null
  const activeCards = cards.filter((card) =>
    (card.deck?.trim() || 'Engineering English') === activeDeckId,
  )
  const currentCard = activeCards[0]
  const stats = statsQuery.data

  function review(rating: ReviewRating) {
    if (!currentCard || reviewMutation.isPending) return
    setActionNotice(null)
    submitReview({ id: currentCard.id, rating })
  }

  function submitReview(input: { id: string; rating: ReviewRating }) {
    reviewMutation.mutate(input, { onSuccess: () => setIsRevealed(false) })
  }

  function createManualCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setActionNotice(null)
    submitManualCard({
      term: manualTerm.trim(),
      definition: manualDefinition.trim(),
      example: manualExample.trim() || undefined,
      deck: manualDeck.trim() || undefined,
    })
  }

  function submitManualCard(input: {
    term: string
    definition: string
    example?: string
    deck?: string
  }) {
    createMutation.mutate(input, {
      onSuccess: () => {
        setManualTerm('')
        setManualDefinition('')
        setManualExample('')
        setActionNotice('Vocabulary card saved.')
      },
    })
  }

  function generateCards(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setActionNotice(null)
    submitGeneration({
      topic: topic.trim() || undefined,
      count: 5,
    })
  }

  function submitGeneration(input: { topic?: string; count: number }) {
    generateMutation.mutate(input, {
      onSuccess: ({ cards: generatedCards, duplicatesSkipped }) => {
        setActionNotice(
          generatedCards.length > 0
            ? `${generatedCards.length} cards generated${duplicatesSkipped ? `; ${duplicatesSkipped} duplicates skipped` : ''}.`
            : 'No new cards were added because those terms already exist.',
        )
      },
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-gutter-lg px-gutter-md py-gutter-lg sm:px-page-margin">
      {statsQuery.isLoading ? (
        <div aria-label="Loading vocabulary statistics" className="h-24 animate-pulse rounded-default bg-light-surface-container-high" />
      ) : (
        <VocabularyHeader
          dueCount={stats?.dueToday ?? cards.length}
          masteredCount={stats?.mastered ?? 0}
          retention={stats?.retentionPercent ?? 0}
        />
      )}

      {statsQuery.isError && (
        <RetryNotice message={statsQuery.error.message} onRetry={() => void statsQuery.refetch()} />
      )}
      {dueQuery.isError && (
        <RetryNotice message={dueQuery.error.message} onRetry={() => void dueQuery.refetch()} />
      )}
      {reviewMutation.isError && reviewMutation.variables && (
        <RetryNotice
          message={reviewMutation.error.message}
          onRetry={() => reviewMutation.variables && submitReview(reviewMutation.variables)}
        />
      )}
      {createMutation.isError && createMutation.variables && (
        <RetryNotice
          message={createMutation.error.message}
          onRetry={() => createMutation.variables && submitManualCard(createMutation.variables)}
        />
      )}
      {generateMutation.isError && generateMutation.variables && (
        <RetryNotice
          message={generateMutation.error.message}
          onRetry={() => generateMutation.variables && submitGeneration(generateMutation.variables)}
        />
      )}
      {actionNotice && (
        <p className="rounded-default border border-success bg-success-container px-gutter-md py-gutter-sm font-body text-body-sm text-on-success-container" role="status">
          {actionNotice}
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-gutter-lg lg:grid-cols-12">
        <div className="lg:col-span-8">
          {dueQuery.isLoading ? (
            <div aria-label="Loading due vocabulary cards" className="flex min-h-96 animate-pulse flex-col gap-gutter-lg rounded-default border border-light-outline-variant bg-light-surface-container-lowest p-gutter-lg">
              <div className="h-8 w-40 rounded bg-light-surface-container-high" />
              <div className="h-12 w-2/3 rounded bg-light-surface-container-high" />
              <div className="h-20 rounded bg-light-surface-container-high" />
              <div className="mt-auto h-12 rounded bg-light-surface-container-high" />
            </div>
          ) : !dueQuery.isError && currentCard ? (
            <Flashcard
              card={currentCard}
              cardNumber={cards.findIndex(({ id }) => id === currentCard.id) + 1}
              isRevealed={isRevealed}
              isReviewing={reviewMutation.isPending}
              onRate={review}
              onReveal={() => setIsRevealed(true)}
              totalCards={cards.length}
            />
          ) : !dueQuery.isError ? (
            <Card className="flex min-h-64 flex-col items-center justify-center gap-gutter-sm text-center" padding="lg">
              <h2 className="font-headline text-headline-md text-light-on-surface">
                {cards.length === 0 ? 'You’re all caught up' : 'No cards due in this deck'}
              </h2>
              <p className="max-w-md font-body text-body-md text-light-on-surface-variant">
                {cards.length === 0
                  ? 'There are no vocabulary cards due today. Add a card or generate a set to keep learning.'
                  : 'Choose another deck or come back when these cards are due.'}
              </p>
            </Card>
          ) : null}
        </div>

        <aside className="flex flex-col gap-gutter-md lg:col-span-4">
          {decks.length > 0 && (
            <DeckList
              activeDeckId={activeDeckId}
              decks={decks}
              onSelect={(deckId) => {
                setSelectedDeckId(deckId)
                setIsRevealed(false)
              }}
              remainingByDeck={remainingByDeck}
            />
          )}

          <Card className="flex flex-col gap-gutter-md" padding="lg">
            <h2 className="font-headline text-headline-md text-light-on-surface">Add vocabulary</h2>
            <form className="flex flex-col gap-gutter-sm" onSubmit={generateCards}>
              <label className="font-label text-label-md text-light-on-surface" htmlFor="vocab-topic">
                Generate five engineering words
              </label>
              <input
                className="min-h-11 rounded-md border border-light-outline-variant bg-light-surface-container-lowest px-3 font-body text-body-sm text-light-on-surface"
                id="vocab-topic"
                maxLength={200}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Topic (optional)"
                value={topic}
              />
              <Button disabled={generateMutation.isPending} type="submit">
                {generateMutation.isPending ? 'Generating…' : 'Generate with AI'}
              </Button>
            </form>

            <details className="border-t border-light-outline-variant pt-gutter-sm">
              <summary className="cursor-pointer font-label text-label-md text-light-primary">
                Create a card manually
              </summary>
              <form className="mt-gutter-sm flex flex-col gap-gutter-sm" onSubmit={createManualCard}>
                <input
                  aria-label="Term"
                  className="min-h-11 rounded-md border border-light-outline-variant bg-light-surface-container-lowest px-3 font-body text-body-sm"
                  maxLength={120}
                  onChange={(event) => setManualTerm(event.target.value)}
                  placeholder="Term"
                  required
                  value={manualTerm}
                />
                <textarea
                  aria-label="Definition"
                  className="min-h-20 rounded-md border border-light-outline-variant bg-light-surface-container-lowest p-3 font-body text-body-sm"
                  maxLength={1000}
                  onChange={(event) => setManualDefinition(event.target.value)}
                  placeholder="Definition"
                  required
                  value={manualDefinition}
                />
                <textarea
                  aria-label="Example"
                  className="min-h-20 rounded-md border border-light-outline-variant bg-light-surface-container-lowest p-3 font-body text-body-sm"
                  maxLength={1000}
                  onChange={(event) => setManualExample(event.target.value)}
                  placeholder="Example (optional)"
                  value={manualExample}
                />
                <input
                  aria-label="Deck"
                  className="min-h-11 rounded-md border border-light-outline-variant bg-light-surface-container-lowest px-3 font-body text-body-sm"
                  maxLength={80}
                  onChange={(event) => setManualDeck(event.target.value)}
                  placeholder="Deck (optional)"
                  value={manualDeck}
                />
                <Button disabled={createMutation.isPending} type="submit" variant="secondary">
                  {createMutation.isPending ? 'Saving…' : 'Save card'}
                </Button>
              </form>
            </details>
          </Card>
        </aside>
      </div>
    </div>
  )
}
