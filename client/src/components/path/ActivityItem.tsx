import type { Activity } from '../../types/path'

interface ActivityItemProps {
  activity: Activity
  isSelected: boolean
  onSelect: (activityId: string) => void
}

const activityTypeLabels = {
  Vocabulario: 'Vocabulario',
  Speaking: 'Speaking',
  'Slack-Escritura': 'Slack / Escritura',
} as const

const statusLabels = {
  completed: 'Completada',
  active: 'En curso',
  available: 'Disponible',
  upcoming: 'Próximo',
} as const

const actionLabels = {
  completed: 'Revisar',
  active: 'Activa',
  available: 'Abrir',
  upcoming: 'Próximo',
} as const

export function ActivityItem({ activity, isSelected, onSelect }: ActivityItemProps) {
  const isUpcoming = activity.status === 'upcoming'
  const icon = activity.status === 'completed'
    ? 'check_circle'
    : isUpcoming
      ? 'lock'
      : activity.type === 'Speaking'
        ? 'mic'
        : activity.type === 'Vocabulario'
          ? 'book_2'
          : 'edit_note'

  return (
    <button
      aria-pressed={isSelected}
      className={`flex w-full items-center justify-between gap-gutter-sm rounded-default border bg-light-surface-container-lowest p-3 text-left transition-colors duration-state-change ease-state-change focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary disabled:cursor-not-allowed disabled:opacity-60 ${
        isSelected
          ? 'border-2 border-light-primary'
          : 'border-light-outline-variant hover:border-light-primary'
      }`}
      disabled={isUpcoming}
      onClick={() => onSelect(activity.id)}
      type="button"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className={`material-symbols-outlined shrink-0 text-body-lg ${
            activity.status === 'completed'
              ? 'text-light-primary'
              : activity.status === 'active'
                ? 'text-light-secondary'
                : 'text-light-on-surface-variant'
          }`}
        >
          {icon}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-label text-label-md text-light-on-surface">{activity.title}</span>
          <span className="font-mono text-label-sm text-light-on-surface-variant">
            {activityTypeLabels[activity.type]} · {activity.durationMinutes} min
          </span>
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={`font-mono text-label-sm ${
            activity.status === 'completed'
              ? 'text-light-primary'
              : activity.status === 'active'
                ? 'text-light-secondary'
                : 'text-light-on-surface-variant'
          }`}
        >
          {statusLabels[activity.status]}
        </span>
        <span className="font-mono text-label-sm text-light-on-surface-variant">
          {actionLabels[activity.status]}
        </span>
      </span>
    </button>
  )
}
