interface VocabularyHeaderProps {
  dueCount: number
  masteredCount: number
  retention: number
}

export function VocabularyHeader({
  dueCount,
  masteredCount,
  retention,
}: VocabularyHeaderProps) {
  return (
    <section
      aria-labelledby="vocabulary-title"
      className="flex flex-col justify-between gap-gutter-md md:flex-row md:items-end"
    >
      <div className="flex flex-col gap-gutter-xs">
        <span className="font-mono text-label-sm uppercase tracking-wider text-light-secondary">
          Module 02 · Spaced Repetition
        </span>
        <h1
          className="font-headline text-display-lg-mobile text-light-on-surface md:text-headline-lg"
          id="vocabulary-title"
        >
          Vocabulary Review
        </h1>
      </div>

      <dl className="flex items-center justify-between gap-gutter-md tabular-nums sm:gap-gutter-lg">
        <div className="flex flex-col gap-gutter-xs">
          <dt className="font-mono text-label-sm text-light-on-surface-variant">Due today</dt>
          <dd
            aria-live="polite"
            className="font-headline text-headline-md text-light-secondary"
          >
            {dueCount} cards
          </dd>
        </div>
        <div className="flex flex-col gap-gutter-xs">
          <dt className="font-mono text-label-sm text-light-on-surface-variant">Mastered</dt>
          <dd className="font-headline text-headline-md text-light-primary">{masteredCount}</dd>
        </div>
        <div className="flex flex-col gap-gutter-xs">
          <dt className="font-mono text-label-sm text-light-on-surface-variant">Retention</dt>
          <dd className="font-headline text-headline-md text-light-on-surface">{retention}%</dd>
        </div>
      </dl>
    </section>
  )
}
