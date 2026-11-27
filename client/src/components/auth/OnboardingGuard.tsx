import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Button } from '../ui'
import { useOnboardingStatus } from '../../hooks/useOnboarding'

export function OnboardingGuard() {
  const location = useLocation()
  const onboardingStatus = useOnboardingStatus()
  const isOnboardingRoute = location.pathname === '/onboarding'

  if (onboardingStatus.isLoading) {
    return <p className="p-gutter-lg" role="status">Checking your learning setup…</p>
  }

  if (onboardingStatus.isError) {
    return (
      <div className="flex flex-col items-start gap-gutter-sm p-gutter-lg">
        <p role="alert">{onboardingStatus.error.message}</p>
        <Button onClick={() => void onboardingStatus.refetch()} variant="secondary">
          Retry
        </Button>
      </div>
    )
  }

  if (!onboardingStatus.data) {
    return (
      <div className="flex flex-col items-start gap-gutter-sm p-gutter-lg">
        <p role="alert">Unable to load your learning setup.</p>
        <Button onClick={() => void onboardingStatus.refetch()} variant="secondary">
          Retry
        </Button>
      </div>
    )
  }

  if (onboardingStatus.data.completed && isOnboardingRoute) {
    return <Navigate replace to="/path" />
  }
  if (!onboardingStatus.data.completed && !isOnboardingRoute) {
    return <Navigate replace to="/onboarding" />
  }

  return <Outlet />
}
