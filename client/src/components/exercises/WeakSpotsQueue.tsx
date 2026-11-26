import { Card } from '../ui'
import type { WeakSpot } from '../../services/exercises'

interface WeakSpotsQueueProps {
  weakSpots: WeakSpot[]
  activeWeakSpotId: string | null
}

export function WeakSpotsQueue({ activeWeakSpotId, weakSpots }: WeakSpotsQueueProps) {
  return (
    <aside aria-label="Your error patterns" className="flex flex-col gap-gutter-md lg:col-span-4">
      <Card className="flex flex-col gap-gutter-md" padding="lg">
        <h2 className="font-headline text-headline-md text-light-on-surface">Weak Spots Queue</h2>
        {weakSpots.length === 0 ? (
          <p className="font-body text-body-sm text-light-on-surface-variant">
            No saved errors yet. New drills will focus on common B1+ technical English.
          </p>
        ) : (
          <ul className="flex flex-col gap-gutter-sm">
            {weakSpots.map((weakSpot) => {
            const isActive = weakSpot.id === activeWeakSpotId

            return (
              <li
                key={weakSpot.id}
                aria-current={isActive ? 'true' : undefined}
                className={`flex items-center justify-between gap-2 rounded-default border p-3 ${
                  isActive
                    ? 'border-light-primary bg-light-surface-container-low'
                    : 'border-light-outline-variant bg-light-surface-container-lowest'
                }`}
              >
                <span className="font-label text-label-md text-light-on-surface">
                  {weakSpot.category}
                </span>
                <span
                  className={`shrink-0 font-mono text-label-sm tabular-nums ${
                    isActive ? 'text-light-secondary' : 'text-light-on-surface-variant'
                  }`}
                >
                  {weakSpot.count} hits
                </span>
              </li>
            )
            })}
          </ul>
        )}
      </Card>
    </aside>
  )
}
