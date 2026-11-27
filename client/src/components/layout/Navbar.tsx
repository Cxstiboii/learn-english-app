import { useState } from 'react'
import { Link, NavLink, useNavigate, type NavLinkRenderProps } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useProgressSummary } from '../../hooks/useProgressSummary'

const navigation = [
  { label: 'Study Path', to: '/path' },
  { label: 'Tutor Chat', to: '/chat' },
  { label: 'Vocabulary', to: '/vocabulary' },
  { label: 'Exercises', to: '/exercises' },
  { label: 'Speaking', to: '/speaking' },
  { label: 'Writing Mock', to: '/mock/writing' },
  { label: 'Interview', to: '/interview' },
  { label: 'Progress', to: '/progress' },
]

function getLinkClass(isActive: boolean, mobile = false) {
  if (isActive) {
    return mobile
      ? 'shrink-0 rounded-sm border border-light-outline-variant bg-light-surface-container-lowest px-2.5 py-1 font-label text-label-md text-light-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary'
      : 'rounded-md bg-light-surface-container-high px-3 py-1.5 font-label text-label-md text-light-on-surface transition-colors duration-state-change ease-state-change focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary'
  }

  return mobile
    ? 'shrink-0 rounded-sm px-2.5 py-1 font-label text-label-md text-light-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary'
    : 'rounded-md px-3 py-1.5 font-label text-label-md text-light-on-surface-variant transition-colors duration-state-change ease-state-change hover:bg-light-surface-container-low hover:text-light-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary'
}

function renderLinkClass({ isActive }: NavLinkRenderProps, mobile = false) {
  return getLinkClass(isActive, mobile)
}

export default function Navbar() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const progressSummary = useProgressSummary()
  const [signOutError, setSignOutError] = useState('')

  async function handleSignOut() {
    setSignOutError('')
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : 'Unable to sign out. Please try again.',
      )
    }
  }

  const progressLabel = progressSummary.isLoading
    ? 'Loading progress summary'
    : progressSummary.isError || !progressSummary.data
      ? 'Progress summary unavailable'
      : `${progressSummary.data.dailyStreak} day streak, ${progressSummary.data.todayMinutes} of ${progressSummary.data.dailyGoalMinutes} minutes today`

  return (
    <header className="sticky top-0 z-20 border-b border-light-outline-variant bg-light-surface">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-gutter-md px-gutter-md sm:px-page-margin">
        <div className="flex min-w-0 items-center gap-gutter-lg">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-gutter-sm rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary"
          >
            <span className="flex size-7 items-center justify-center rounded-sm bg-light-primary font-mono text-label-md text-light-on-primary">
              df
            </span>
            <span className="font-headline text-title-md tracking-tight text-light-on-surface">
              devfluent
            </span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-gutter-xs md:flex">
            {navigation.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={(props: NavLinkRenderProps) => renderLinkClass(props)}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-gutter-sm">
          <div className="hidden items-center gap-gutter-xs rounded-sm border border-light-outline-variant bg-light-surface-container-low px-2.5 py-1 tabular-nums sm:flex">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-body-lg text-light-secondary"
            >
              local_fire_department
            </span>
            <span
              aria-label={progressLabel}
              className="font-mono text-label-sm text-light-on-surface"
              role="status"
              title={progressSummary.isError ? 'Progress summary unavailable' : undefined}
            >
              {progressSummary.isLoading
                ? '…'
                : progressSummary.isError || !progressSummary.data
                  ? '—'
                  : `${progressSummary.data.dailyStreak}d · ${progressSummary.data.todayMinutes}/${progressSummary.data.dailyGoalMinutes}m`}
            </span>
          </div>
          <span className="inline-flex items-center rounded-sm border border-light-outline-variant bg-light-surface-container-high px-2.5 py-1 font-mono text-label-sm text-light-on-surface">
            B1 → B2
          </span>
          <button
            className="rounded-md px-3 py-1.5 font-label text-label-md text-light-on-surface-variant transition-colors hover:bg-light-surface-container-low hover:text-light-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary"
            onClick={handleSignOut}
            type="button"
          >
            Sign out
          </button>
        </div>
      </div>

      {signOutError && (
        <p className="px-gutter-md pb-gutter-sm text-right font-body text-body-sm text-light-error" role="alert">
          {signOutError}
        </p>
      )}

      <nav
        aria-label="Mobile navigation"
        className="flex items-center gap-gutter-xs overflow-x-auto border-t border-light-outline-variant bg-light-surface-container-low px-gutter-md py-gutter-sm md:hidden"
      >
        {navigation.map(({ label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={(props: NavLinkRenderProps) => renderLinkClass(props, true)}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
