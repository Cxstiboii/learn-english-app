import { Card } from '../ui'

interface PathHeaderProps {
  completedCount: number
  totalActivities: number
}

const milestones = ['A2', 'A2+ → B1', 'B1+', 'B2 Meta']

export function PathHeader({ completedCount, totalActivities }: PathHeaderProps) {
  const progress = totalActivities > 0
    ? Math.min(100, Math.round((completedCount / totalActivities) * 100))
    : 0

  return (
    <Card
      aria-labelledby="path-heading"
      className="flex flex-col gap-gutter-md"
      padding="md"
      role="region"
    >
      <div className="flex flex-col justify-between gap-gutter-md md:flex-row md:items-end">
        <div className="flex max-w-2xl flex-col gap-gutter-xs">
          <span className="font-mono text-label-sm uppercase tracking-wider text-light-secondary">
            Plan de carrera · Remoto USD
          </span>
          <h1
            className="font-headline text-display-lg-mobile text-balance text-light-on-surface md:text-headline-lg"
            id="path-heading"
          >
            Ruta de estudio A2 a B2 para desarrolladores
          </h1>
          <p className="font-body text-body-md text-pretty text-light-on-surface-variant">
            Mix diario equilibrado: hablar en standups, escribir claro en Slack y Pull Requests, y
            dominar vocabulario de arquitectura.
          </p>
        </div>

        <div className="flex shrink-0 gap-gutter-lg border-t border-light-outline-variant pt-gutter-sm tabular-nums md:border-t-0 md:pt-0">
          <div className="flex flex-col gap-gutter-xs">
            <span className="font-mono text-label-sm text-light-on-surface-variant">
              Avance total
            </span>
            <span aria-live="polite" className="font-headline text-headline-md text-light-primary">
              {progress}% hacia B2
            </span>
          </div>
          <div className="flex flex-col gap-gutter-xs">
            <span className="font-mono text-label-sm text-light-on-surface-variant">
              Prácticas
            </span>
            <span aria-live="polite" className="font-headline text-headline-md text-light-on-surface">
              {completedCount} / {totalActivities}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-gutter-sm pt-gutter-xs">
        <div
          aria-label="Avance de la ruta"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progress}
          className="grid h-2 grid-cols-4 gap-1 overflow-hidden rounded-full"
          role="progressbar"
        >
          {milestones.map((_, index) => {
            const segmentProgress = Math.max(0, Math.min(100, (progress - index * 25) * 4))

            return (
              <span
                aria-hidden="true"
                className="h-full overflow-hidden rounded-full bg-light-surface-container-high"
                key={index}
              >
                <span
                  className="block h-full rounded-full bg-light-primary transition-[width] duration-surface-enter ease-surface-enter"
                  style={{ width: `${segmentProgress}%` }}
                />
              </span>
            )
          })}
        </div>

        <ol className="grid grid-cols-4 gap-gutter-sm" aria-label="Hitos de nivel">
          {milestones.map((milestone, index) => (
            <li className="flex min-w-0 items-center gap-1.5" key={milestone}>
              <span
                aria-hidden="true"
                className={`size-2 shrink-0 rounded-full ${
                  index === 0
                    ? 'bg-light-primary'
                    : index === 1
                      ? 'bg-light-secondary'
                      : 'bg-light-outline-variant'
                }`}
              />
              <span
                className={`font-mono text-label-sm ${
                  index < 2 ? 'text-light-on-surface' : 'text-light-on-surface-variant'
                }`}
              >
                {milestone}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  )
}
