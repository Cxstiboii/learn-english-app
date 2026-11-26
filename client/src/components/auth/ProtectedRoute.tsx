import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function ProtectedRoute() {
  const { user, loading, error } = useAuth()

  if (loading) {
    return <p aria-live="polite" className="p-gutter-lg" role="status">Loading session…</p>
  }

  if (error) {
    return <p className="p-gutter-lg" role="alert">{error}</p>
  }

  return user ? <Outlet /> : <Navigate replace to="/login" />
}
