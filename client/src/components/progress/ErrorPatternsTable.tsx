import { Link } from 'react-router-dom'
import { Card } from '../ui'
import type { ErrorPattern } from '../../types/progress'

interface ErrorPatternsTableProps {
  patterns: ErrorPattern[]
}

export function ErrorPatternsTable({ patterns }: ErrorPatternsTableProps) {
  return (
    <Card
      aria-labelledby="error-patterns-title"
      className="overflow-hidden p-0"
      role="region"
    >
      <header className="flex flex-wrap items-center justify-between gap-gutter-sm border-b border-light-outline-variant px-gutter-lg py-gutter-md">
        <h2 className="font-headline text-headline-md text-light-on-surface" id="error-patterns-title">
          Frequent Error Patterns
        </h2>
        <Link
          className="inline-flex items-center justify-center rounded-md bg-light-primary px-3 py-1.5 font-label text-label-md text-light-on-primary transition-colors duration-state-change ease-state-change hover:bg-light-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary focus-visible:ring-offset-2"
          to="/exercises"
        >
          Train All
        </Link>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <caption className="sr-only">Frequent English error patterns and their B2 corrections</caption>
          <thead className="bg-light-surface-container-low">
            <tr className="border-b border-light-outline-variant">
              <th className="px-gutter-lg py-3 font-mono text-label-sm text-light-on-surface-variant" scope="col">
                Pattern
              </th>
              <th className="px-gutter-lg py-3 font-mono text-label-sm text-light-on-surface-variant" scope="col">
                Example
              </th>
              <th className="px-gutter-lg py-3 font-mono text-label-sm text-light-on-surface-variant" scope="col">
                B2 Correction
              </th>
              <th className="px-gutter-lg py-3 text-right font-mono text-label-sm text-light-on-surface-variant" scope="col">
                Count
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-outline-variant tabular-nums">
            {patterns.length === 0 ? (
              <tr>
                <td className="px-gutter-lg py-gutter-md font-body text-body-sm text-light-on-surface-variant" colSpan={4}>
                  No error patterns yet. Tutor and evaluation corrections will appear here.
                </td>
              </tr>
            ) : patterns.map((pattern) => (
              <tr key={pattern.id}>
                <th
                  className="px-gutter-lg py-3 text-left font-label text-label-md text-light-on-surface"
                  scope="row"
                >
                  {pattern.pattern}
                </th>
                <td className="px-gutter-lg py-3 font-mono text-label-sm text-light-error">
                  {pattern.example}
                </td>
                <td className="px-gutter-lg py-3 font-mono text-label-sm text-light-primary">
                  {pattern.correction}
                </td>
                <td className="px-gutter-lg py-3 text-right font-mono text-label-sm text-light-on-surface">
                  {pattern.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
