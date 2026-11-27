import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PathFilterTabs } from '../components/path/PathFilterTabs'
import { PathHeader } from '../components/path/PathHeader'
import { TodayPanel } from '../components/path/TodayPanel'
import { UnitCard } from '../components/path/UnitCard'
import { Button, Card } from '../components/ui'
import { useCompletePathActivity, useStudyPath } from '../hooks/useStudyPath'
import { pathActivityRoutes } from '../services/path'
import type { Activity, PathFilter, Unit } from '../types/path'

const noUnits: Unit[] = []

export default function StudyPath() {
  const navigate = useNavigate()
  const pathQuery = useStudyPath()
  const completeMutation = useCompletePathActivity()
  const failedActivityId = completeMutation.variables
  const units = pathQuery.data ?? noUnits
  const [selectedFilter, setSelectedFilter] = useState<PathFilter>('all')
  const [expandedUnitSelection, setExpandedUnitSelection] = useState<string | null | undefined>(undefined)
  const [activitySelection, setActivitySelection] = useState<string | null | undefined>(undefined)

  const defaultExpandedUnit = units.find(({ status }) =>
    status === 'En curso' || status === 'Disponible' || status === 'Meta',
  )
  const expandedUnitId = expandedUnitSelection === undefined
    ? defaultExpandedUnit?.id ?? ''
    : expandedUnitSelection
  const defaultActivity = units
    .flatMap(({ activities }) => activities)
    .find(({ status }) => status === 'active' || status === 'available' || status === 'completed')
  const selectedActivityId = activitySelection === undefined
    ? defaultActivity?.id ?? null
    : activitySelection

  const filteredUnits = units.filter(
    (unit) => selectedFilter === 'all' || unit.filterLevels.includes(selectedFilter),
  )
  const selectedActivityEntry = units
    .flatMap((unit) => unit.activities.map((activity) => ({ activity, unit })))
    .find(({ activity }) => activity.id === selectedActivityId)
  const totalActivities = units.reduce((total, unit) => total + unit.activities.length, 0)
  const completedCount = units.reduce(
    (total, unit) => total + unit.activities.filter(({ status }) => status === 'completed').length,
    0,
  )

  function handleFilterChange(filter: PathFilter) {
    setSelectedFilter(filter)
    const nextUnit = units.find((unit) =>
      unit.status !== 'Próximo' && (filter === 'all' || unit.filterLevels.includes(filter)),
    )
    if (!nextUnit) {
      setExpandedUnitSelection('')
      setActivitySelection(null)
      return
    }
    setExpandedUnitSelection(nextUnit.id)
    setActivitySelection(
      nextUnit.activities.find(({ status }) => status !== 'upcoming')?.id ?? null,
    )
  }

  function handleToggleUnit(unitId: string) {
    const unit = units.find((item) => item.id === unitId)
    if (!unit || unit.status === 'Próximo') return
    if (expandedUnitId === unitId) {
      setExpandedUnitSelection('')
      return
    }
    setExpandedUnitSelection(unitId)
    setActivitySelection(
      unit.activities.find(({ status }) => status !== 'upcoming')?.id ?? null,
    )
  }

  function handleSelectActivity(unitId: string, activityId: string) {
    const unit = units.find((item) => item.id === unitId)
    const activity = unit?.activities.find((item) => item.id === activityId)
    if (!unit || !activity || activity.status === 'upcoming') return
    setExpandedUnitSelection(unitId)
    setActivitySelection(activityId)
  }

  function handlePractice(activity: Activity) {
    navigate(pathActivityRoutes[activity.type])
  }

  const visibleUnits: Unit[] = filteredUnits

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-gutter-lg px-gutter-md py-gutter-lg sm:px-page-margin sm:py-gutter-xl">
      {pathQuery.isLoading ? (
        <div aria-label="Loading study path" className="h-48 animate-pulse rounded-default bg-light-surface-container-high" />
      ) : pathQuery.isError ? (
        <div className="flex flex-wrap items-center justify-between gap-gutter-sm rounded-default border border-light-error bg-light-error-container px-gutter-md py-gutter-sm text-light-on-error-container" role="alert">
          <span>{pathQuery.error.message}</span>
          <Button onClick={() => void pathQuery.refetch()} size="sm" variant="secondary">Retry</Button>
        </div>
      ) : units.length === 0 ? (
        <Card className="flex flex-col gap-gutter-sm" padding="lg">
          <h1 className="font-headline text-headline-md text-light-on-surface">Study path is empty</h1>
          <p className="font-body text-body-md text-light-on-surface-variant">
            Load the study-path seed data in Supabase, then retry.
          </p>
          <Button className="w-fit" onClick={() => void pathQuery.refetch()} variant="secondary">Retry</Button>
        </Card>
      ) : (
        <>
          <PathHeader completedCount={completedCount} totalActivities={totalActivities} />
          {completeMutation.isError && failedActivityId && (
            <div className="flex flex-wrap items-center justify-between gap-gutter-sm rounded-default border border-light-error bg-light-error-container px-gutter-md py-gutter-sm text-light-on-error-container" role="alert">
              <span>{completeMutation.error.message}</span>
              <Button
                onClick={() => completeMutation.mutate(failedActivityId)}
                size="sm"
                variant="secondary"
              >
                Retry
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-gutter-lg lg:grid-cols-12">
            <section aria-label="Unidades de la ruta de estudio" className="flex min-w-0 flex-col gap-gutter-md lg:col-span-7">
              <PathFilterTabs onSelectFilter={handleFilterChange} selectedFilter={selectedFilter} />
              <div
                aria-labelledby={`path-filter-${selectedFilter}`}
                className="flex flex-col gap-gutter-md"
                id="path-units"
                role="tabpanel"
              >
                {visibleUnits.length > 0 ? visibleUnits.map((unit) => (
                  <UnitCard
                    isExpanded={expandedUnitId === unit.id}
                    key={unit.id}
                    onSelectActivity={handleSelectActivity}
                    onToggle={handleToggleUnit}
                    selectedActivityId={selectedActivityId}
                    unit={unit}
                  />
                )) : (
                  <p className="rounded-default border border-light-outline-variant bg-light-surface-container-low p-gutter-md font-body text-body-sm text-light-on-surface-variant">
                    No units match this level filter.
                  </p>
                )}
              </div>
            </section>

            <aside aria-label="Módulo activo y sesión de hoy" className="min-w-0 lg:sticky lg:top-20 lg:col-span-5">
              {selectedActivityEntry && (
                <TodayPanel
                  activity={selectedActivityEntry.activity}
                  isCompleting={completeMutation.isPending}
                  onComplete={() => completeMutation.mutate(selectedActivityEntry.activity.id)}
                  onPractice={handlePractice}
                  unit={selectedActivityEntry.unit}
                />
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
