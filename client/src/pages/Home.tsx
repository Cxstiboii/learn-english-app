import { NavLink, type NavLinkRenderProps } from 'react-router-dom'

const sections = [
  {
    title: 'Study Path',
    description: 'Follow your A2-to-B2 roadmap with short, practical activities.',
    to: '/path',
    label: 'View study path',
  },
  {
    title: 'AI Tutor Chat',
    description: 'Practice conversations and get clear feedback tailored to your level.',
    to: '/chat',
    label: 'Start a conversation',
  },
  {
    title: 'Vocabulary',
    description: 'Build your vocabulary with focused reviews and useful new words.',
    to: '/vocabulary',
    label: 'Review words',
  },
  {
    title: 'Exercises',
    description: 'Strengthen grammar and reading skills with targeted practice.',
    to: '/exercises',
    label: 'Practice now',
  },
  {
    title: 'Speaking',
    description: 'Work on speaking with confidence, one short session at a time.',
    to: '/speaking',
    label: 'Practice speaking',
  },
  {
    title: 'Writing Mock',
    description: 'Practice timed writing tasks and get clear feedback on your response.',
    to: '/mock/writing',
    label: 'Start a writing mock',
  },
  {
    title: 'Interview',
    description: 'Practice common engineering interview questions in English.',
    to: '/interview',
    label: 'Practice an interview',
  },
  {
    title: 'Progress',
    description: 'Keep track of your learning and your next steps toward B2.',
    to: '/progress',
    label: 'View progress',
  },
]

export default function Home() {
  return (
    <div>
      <section className="mb-8">
        <p className="mb-2 text-sm font-semibold text-violet-700">YOUR B1 TO B2 LEARNING PATH</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Small steps. Stronger English.
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          Choose a section to build your English skills and keep moving toward B2.
        </p>
      </section>

      <section aria-label="Learning sections" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map(({ title, description, to, label }) => (
          <NavLink
            end
            key={to}
            to={to}
            className={({ isActive }: NavLinkRenderProps) =>
              `group rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md ${
                isActive ? 'border-violet-300 ring-2 ring-violet-100' : 'border-slate-200'
              }`
            }
          >
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{description}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
              {label}
              <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
            </span>
          </NavLink>
        ))}
      </section>
    </div>
  )
}
