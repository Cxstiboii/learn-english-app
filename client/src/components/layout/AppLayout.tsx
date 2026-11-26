import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-light-surface text-light-on-surface">
      <Navbar />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
