import { Button, Card } from '../ui'
import type { AutosaveStatus } from '../../hooks/useAutosave'

interface ResponseEditorProps {
  value: string
  minimumWords: number
  saveStatus: AutosaveStatus
  saveError: string | null
  isLocked: boolean
  isExpired: boolean
  isGrading: boolean
  isSubmitted: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}

function countWords(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

export function ResponseEditor({
  value,
  minimumWords,
  saveStatus,
  saveError,
  isLocked,
  isExpired,
  isGrading,
  isSubmitted,
  onChange,
  onSubmit,
}: ResponseEditorProps) {
  const wordCount = countWords(value)
  const wordsMissing = Math.max(0, minimumWords - wordCount)
  const submitDisabled = wordsMissing > 0 || isGrading || isSubmitted

  return (
    <Card
      aria-label="Timed response editor"
      className="flex flex-col gap-gutter-md"
      padding="lg"
      role="region"
    >
      <div className="flex items-center justify-between gap-gutter-sm border-b border-light-outline-variant pb-gutter-sm">
        <label className="font-label text-label-md text-light-on-surface" htmlFor="writing-response">
          Your Response
        </label>
        <span
          aria-live="polite"
          className={`shrink-0 font-mono text-label-sm tabular-nums ${
            wordsMissing > 0 ? 'text-light-error' : 'text-light-on-surface-variant'
          }`}
        >
          {wordCount} / {minimumWords} words
        </span>
      </div>

      <textarea
        aria-describedby="writing-editor-help"
        className="min-h-72 w-full resize-y rounded-md border border-light-outline-variant bg-light-surface-container-low p-gutter-md font-body text-body-md leading-relaxed text-light-on-surface placeholder:text-light-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary focus-visible:ring-offset-2 read-only:cursor-not-allowed read-only:opacity-80"
        id="writing-response"
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder="Start typing your response here. Focus on clear structure and B2 transitions..."
        readOnly={isLocked}
        value={value}
      />

      <footer className="flex flex-wrap items-center justify-between gap-gutter-sm pt-gutter-sm">
        <div className="flex min-w-0 flex-col gap-1">
          <span
            aria-live="polite"
            className={`font-mono text-label-sm ${
              saveStatus === 'error'
                ? 'text-light-error'
                : 'text-light-on-surface-variant'
            }`}
          >
            {saveError ??
              (saveStatus === 'saving'
                ? 'Saving locally…'
                : 'Auto-saved locally')}
          </span>
          {isExpired && !isSubmitted && (
            <span className="font-mono text-label-sm text-light-error" role="status">
              Time is up. Your response is locked.
            </span>
          )}
          {wordsMissing > 0 && (
            <span
              aria-live="polite"
              className="font-mono text-label-sm text-light-on-surface-variant"
              id="writing-editor-help"
            >
              {isExpired
                ? `Time expired. ${wordsMissing} more ${wordsMissing === 1 ? 'word is' : 'words are'} needed to submit.`
                : `${wordsMissing} more ${wordsMissing === 1 ? 'word is' : 'words are'} needed to submit.`}
            </span>
          )}
          {wordsMissing === 0 && (
            <span className="sr-only" id="writing-editor-help">
              Minimum word count reached.
            </span>
          )}
        </div>

        <Button
          className="shrink-0"
          disabled={submitDisabled}
          onClick={onSubmit}
        >
          {isGrading
            ? 'Grading…'
            : isSubmitted
              ? 'Submitted'
              : 'Submit for AI Grading'}
        </Button>
      </footer>
    </Card>
  )
}
