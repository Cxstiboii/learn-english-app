import { Badge, Card } from '../ui'
import type { Unit, UnitStatus } from '../../types/path'
import { ActivityItem } from './ActivityItem'

interface UnitCardProps {
  unit: Unit
  isRecommended?: boolean
  isExpanded: boolean
  selectedActivityId: string | null
  onToggle: (unitId: string) => void
  onSelectActivity: (unitId: string, activityId: string) => void
}

const statusVariants: Record<UnitStatus, 'neutral' | 'success' | 'warning'> = {
  Completado: 'success',
  'En curso': 'warning',
  Disponible: 'neutral',
  Próximo: 'neutral',
  Meta: 'neutral',
}

export function UnitCard({
  unit,
  isRecommended = false,
  isExpanded,
  selectedActivityId,
  onToggle,
  onSelectActivity,
}: UnitCardProps) {
  const completedActivities = unit.activities.filter(
    (activity) => activity.status === 'completed',
  ).length
  const isUpcoming = unit.status === 'Próximo'
  const summaryId = `unit-summary-${unit.id}`
  const activitiesId = `unit-activities-${unit.id}`

  function handleSelectActivity(activityId: string) {
    onSelectActivity(unit.id, activityId)
  }

  return (
    <Card
      className={`overflow-hidden p-0 ${
        unit.status === 'En curso' ? 'border-light-primary' : ''
      } ${isUpcoming ? 'opacity-60' : ''}`}
      role="article"
    >
      <h2 className="m-0">
        <button
          aria-controls={activitiesId}
          aria-expanded={isExpanded}
          className="flex w-full items-center justify-between gap-gutter-md p-gutter-md text-left transition-colors duration-state-change ease-state-change hover:bg-light-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-light-primary disabled:cursor-not-allowed"
          disabled={isUpcoming}
          id={summaryId}
          onClick={() => onToggle(unit.id)}
          type="button"
        >
          <span className="flex min-w-0 flex-col gap-gutter-xs">
            <span className="flex flex-wrap items-center gap-gutter-sm">
              <span
                className={`font-mono text-label-sm ${
                  unit.status === 'En curso'
                    ? 'text-light-primary'
                    : 'text-light-on-surface-variant'
                }`}
              >
                UNIDAD {String(unit.number).padStart(2, '0')} · {unit.level}
              </span>
              <Badge variant={statusVariants[unit.status]}>
                {unit.status} · {completedActivities}/{unit.activities.length}
              </Badge>
              {isRecommended && <Badge variant="success">Recommended for you</Badge>}
            </span>
            <span className="font-title text-title-md text-light-on-surface">{unit.title}</span>
            <span className="font-body text-body-sm text-light-on-surface-variant">
              {unit.description}
            </span>
          </span>
          <span
            aria-hidden="true"
            className={`material-symbols-outlined shrink-0 text-light-on-surface-variant transition-transform duration-surface-enter ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </button>
      </h2>

      <div
        aria-labelledby={summaryId}
        className="flex flex-col gap-gutter-sm border-t border-light-outline-variant bg-light-surface-container-low px-gutter-md pb-gutter-md pt-gutter-sm sm:px-gutter-lg"
        hidden={!isExpanded}
        id={activitiesId}
        role="region"
      >
        {unit.activities.map((activity) => (
          <ActivityItem
            activity={activity}
            isSelected={selectedActivityId === activity.id}
            key={activity.id}
            onSelect={handleSelectActivity}
          />
        ))}
      </div>
    </Card>
  )
}
