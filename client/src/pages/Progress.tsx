import { useState, type FormEvent } from 'react'
import { Button } from '../components/ui'
import { ErrorPatternsTable } from '../components/progress/ErrorPatternsTable'
import { StatCard } from '../components/progress/StatCard'
import { useLogActivity, useProgressSummary } from '../hooks/useProgressSummary'
import type { ErrorPattern } from '../types/progress'

export default function Progress() {
  const [minutes, setMinutes] = useState('10')
  const [logNotice, setLogNotice] = useState<string | null>(null)
  const summaryQuery = useProgressSummary()
  const logMutation = useLogActivity()
  const summary = summaryQuery.data
  const errorPatterns: ErrorPattern[] = (summary?.errorPatterns ?? []).map((pattern) => ({
    id: pattern.id,
    pattern: pattern.category,
    example: pattern.example,
    correction: pattern.correction,
    count: pattern.count,
  }))

  function handleLogActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedMinutes = Number(minutes)
    if (!Number.isInteger(parsedMinutes) || parsedMinutes < 1 || parsedMinutes > 1440) return

    setLogNotice(null)
    logMutation.mutate(parsedMinutes, {
      onSuccess: ({ minutes: totalMinutes }) => {
        setLogNotice(`Logged. Today's total is ${totalMinutes} minutes.`)
      },
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-gutter-lg px-gutter-md py-gutter-lg sm:px-page-margin">
      <section aria-labelledby="progress-title" className="flex flex-col gap-gutter-xs">
        <span className="font-mono text-label-sm uppercase tracking-wider text-light-secondary">
          Module 05 · Progress &amp; Readiness
        </span>
        <h1 className="font-headline text-display-lg-mobile text-light-on-surface md:text-headline-lg" id="progress-title">
          Progress Overview
        </h1>
      </section>

      {summaryQuery.isLoading ? (
        <div aria-label="Loading progress" className="grid grid-cols-2 gap-gutter-md lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="h-28 animate-pulse rounded-default bg-light-surface-container-high" key={index} />
          ))}
        </div>
      ) : summaryQuery.isError ? (
        <div className="flex flex-wrap items-center justify-between gap-gutter-sm rounded-default border border-light-error bg-light-error-container px-gutter-md py-gutter-sm text-light-on-error-container" role="alert">
          <span>{summaryQuery.error.message}</span>
          <Button onClick={() => void summaryQuery.refetch()} size="sm" variant="secondary">Retry</Button>
        </div>
      ) : summary ? (
        <>
          {logMutation.isError && logMutation.variables !== undefined && (
            <div className="flex flex-wrap items-center justify-between gap-gutter-sm rounded-default border border-light-error bg-light-error-container px-gutter-md py-gutter-sm text-light-on-error-container" role="alert">
              <span>{logMutation.error.message}</span>
              <Button
                onClick={() => logMutation.variables !== undefined && logMutation.mutate(logMutation.variables)}
                size="sm"
                variant="secondary"
              >
                Retry
              </Button>
            </div>
          )}
          {logNotice && (
            <p className="rounded-default border border-success bg-success-container px-gutter-md py-gutter-sm font-body text-body-sm text-on-success-container" role="status">
              {logNotice}
            </p>
          )}
          <section aria-label="Key metrics" className="grid grid-cols-2 gap-gutter-md tabular-nums lg:grid-cols-4">
            <StatCard
              subtitle={`${summary.levelProgress}% toward B2`}
              title="Current Level"
              value={summary.currentLevel}
            />
            <StatCard
              subtitle={`Goal: ${summary.dailyGoalMinutes} min/day`}
              title="Daily Streak"
              value={`${summary.dailyStreak} days`}
            />
            <StatCard
              subtitle={`${summary.recentEvaluationsCount} recent speaking/writing evaluations`}
              title="Estimated Score"
              value={summary.recentEstimatedScore === null
                ? '—'
                : summary.recentEstimatedScore.toFixed(1)}
            />
            <StatCard
              subtitle={`${summary.todayRemainingMinutes} min remaining`}
              title="Today's Session"
              value={`${summary.todayMinutes} min`}
            />
          </section>
          <ErrorPatternsTable patterns={errorPatterns} />
          <form
            className="flex flex-wrap items-end gap-gutter-sm rounded-default border border-light-outline-variant bg-light-surface-container-lowest p-gutter-md"
            onSubmit={handleLogActivity}
          >
            <label className="flex flex-col gap-1 font-label text-label-md text-light-on-surface" htmlFor="activity-minutes">
              Log study minutes
              <input
                className="min-h-11 w-36 rounded-md border border-light-outline-variant bg-light-surface-container-lowest px-3 font-body text-body-md"
                id="activity-minutes"
                max={1440}
                min={1}
                onChange={(event) => setMinutes(event.target.value)}
                required
                type="number"
                value={minutes}
              />
            </label>
            <Button disabled={logMutation.isPending} type="submit">
              {logMutation.isPending ? 'Logging…' : 'Add minutes'}
            </Button>
          </form>
        </>
      ) : (
        <p className="rounded-default border border-light-outline-variant bg-light-surface-container-low p-gutter-md font-body text-body-md text-light-on-surface-variant">
          No progress summary is available yet.
        </p>
      )}
    </div>
  )
}
