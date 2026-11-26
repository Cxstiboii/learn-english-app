import { NavLink, type NavLinkRenderProps } from 'react-router-dom'

const navigation = [
  { label: 'Home', to: '/' },
  { label: 'Chat tutor', to: '/chat' },
  { label: 'Vocabulary', to: '/vocabulary' },
  { label: 'Exercises', to: '/exercises' },
  { label: 'Speaking', to: '/speaking' },
  { label: 'Progress', to: '/progress' },
]

export default function Sidebar() {
  return (
    <nav
      aria-label="Main navigation"
      className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white p-3 lg:min-h-[calc(100vh-4rem)] lg:w-56 lg:flex-col lg:border-b-0 lg:border-r lg:p-5"
    >
      {navigation.map(({ label, to }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }: NavLinkRenderProps) =>
            `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-violet-50 text-violet-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
