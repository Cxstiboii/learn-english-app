import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useAcceptProfileSuggestion,
  useDismissProfileSuggestion,
  useProfileSuggestions,
} from '../../hooks/useProfileSuggestions'
import { Button, Card } from '../ui'

interface SuggestionsForYouCardProps {
  disabled?: boolean
  onAccepted?: () => void
}

export function SuggestionsForYouCard({
  disabled = false,
  onAccepted,
}: SuggestionsForYouCardProps) {
  const navigate = useNavigate()
  const suggestionsQuery = useProfileSuggestions()
  const acceptMutation = useAcceptProfileSuggestion()
  const dismissMutation = useDismissProfileSuggestion()
  const [notice, setNotice] = useState('')
  const suggestions = suggestionsQuery.data ?? []
  const isMutating = acceptMutation.isPending || dismissMutation.isPending

  function accept(id: string) {
    setNotice('')
    acceptMutation.mutate(id, {
      onSuccess: (result) => {
        onAccepted?.()
        if (result.nextAction) {
          const query = new URLSearchParams({
            focusCategory: result.nextAction.focusCategory,
          })
          navigate(`/exercises?${query.toString()}`)
          return
        }
        setNotice('Suggestion accepted. Your settings have been updated.')
      },
    })
  }

  function dismiss(id: string) {
    setNotice('')
    dismissMutation.mutate(id, {
      onSuccess: () => setNotice('Suggestion dismissed. Your settings were not changed.'),
    })
  }

  return (
    <Card
      aria-labelledby="suggestions-for-you-title"
      className="flex flex-col gap-gutter-md"
      role="region"
    >
      <header>
        <h2 className="font-headline text-headline-md text-light-on-surface" id="suggestions-for-you-title">
          Suggestions for you
        </h2>
        <p className="mt-1 text-body-sm text-light-on-surface-variant">
          These are recommendations only. Nothing changes unless you accept.
        </p>
      </header>

      {suggestionsQuery.isLoading ? (
        <p className="text-body-sm text-light-on-surface-variant" role="status">
          Reviewing your recent learning activity…
        </p>
      ) : suggestionsQuery.isError ? (
        <div className="flex flex-wrap items-center justify-between gap-gutter-sm" role="alert">
          <span className="text-body-sm text-light-error">{suggestionsQuery.error.message}</span>
          <Button onClick={() => void suggestionsQuery.refetch()} size="sm" variant="secondary">
            Retry
          </Button>
        </div>
      ) : suggestions.length === 0 ? (
        <p className="text-body-sm text-light-on-surface-variant">
          No new suggestions yet. Keep practicing and we’ll look for helpful patterns.
        </p>
      ) : (
        <ul className="flex flex-col gap-gutter-sm">
          {suggestions.map((suggestion) => (
            <li
              className="rounded-default border border-light-outline-variant bg-light-surface-container-low p-gutter-md"
              key={suggestion.id}
            >
              <div className="flex flex-col gap-gutter-sm sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <h3 className="font-title text-title-md text-light-on-surface">
                    {suggestion.title}
                  </h3>
                  <p className="text-body-sm text-light-on-surface-variant">
                    {suggestion.rationale}
                  </p>
                  <p className="text-label-sm text-light-on-surface-variant">
                    <span className="font-label">Evidence: </span>
                    {suggestion.evidence}
                  </p>
                </div>
                <div className="flex shrink-0 gap-gutter-xs">
                  <Button
                    disabled={disabled || isMutating}
                    onClick={() => accept(suggestion.id)}
                    size="sm"
                  >
                    {acceptMutation.isPending && acceptMutation.variables === suggestion.id
                      ? 'Accepting…'
                      : 'Accept'}
                  </Button>
                  <Button
                    disabled={disabled || isMutating}
                    onClick={() => dismiss(suggestion.id)}
                    size="sm"
                    variant="secondary"
                  >
                    {dismissMutation.isPending && dismissMutation.variables === suggestion.id
                      ? 'Dismissing…'
                      : 'Dismiss'}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {disabled && (
        <p className="text-body-sm text-light-on-surface-variant" role="status">
          Save or discard your unsaved settings before accepting a suggestion.
        </p>
      )}
      {acceptMutation.isError && (
        <p className="text-body-sm text-light-error" role="alert">
          {acceptMutation.error.message}
        </p>
      )}
      {dismissMutation.isError && (
        <p className="text-body-sm text-light-error" role="alert">
          {dismissMutation.error.message}
        </p>
      )}
      {notice && <p className="text-body-sm text-on-success-container" role="status">{notice}</p>}
    </Card>
  )
}
