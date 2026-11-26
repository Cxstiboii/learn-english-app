import { Link } from 'react-router-dom'
import { Card } from '../ui'
import type { SessionNote } from './types'

interface SessionNotesProps {
  className?: string
  itemCount: number
  notes: SessionNote[]
}

export function SessionNotes({ className = '', itemCount, notes }: SessionNotesProps) {
  return (
    <aside
      aria-label="Session notes and corrections"
      className={`flex flex-col gap-gutter-md lg:sticky lg:top-20 ${className}`}
    >
      <Card className="flex flex-col gap-gutter-md" padding="lg">
        <header className="flex items-center justify-between gap-gutter-sm border-b border-light-outline-variant pb-gutter-sm">
          <h2 className="font-headline text-headline-md text-light-on-surface">Session Notes</h2>
          <span className="font-mono text-label-sm tabular-nums text-light-on-surface-variant">
            {itemCount} items
          </span>
        </header>

        {notes.length > 0 ? (
          <ul className="flex flex-col gap-gutter-sm">
            {notes.map((note) => (
              <li
                key={note.id}
                className="flex flex-col gap-1 rounded-default border border-light-outline-variant bg-light-surface-container-low p-3"
              >
                <span
                  className={`font-mono text-label-sm ${
                    note.category === 'grammar'
                      ? 'text-light-secondary'
                      : 'text-light-primary'
                  }`}
                >
                  {note.title}
                </span>
                <p className="text-light-on-surface font-body text-body-sm">
                  {note.content}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body text-body-sm text-light-on-surface-variant">
            Corrections and useful phrases from your conversation will appear here.
          </p>
        )}

        {notes.length > 0 && (
          <footer className="border-t border-light-outline-variant pt-gutter-sm">
            <Link
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-light-outline-variant bg-light-surface-container-lowest px-4 py-2.5 font-label text-label-lg text-light-on-surface transition-colors duration-state-change hover:bg-light-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary focus-visible:ring-offset-2"
              to="/exercises"
            >
              Practice these errors
            </Link>
          </footer>
        )}
      </Card>
    </aside>
  )
}
