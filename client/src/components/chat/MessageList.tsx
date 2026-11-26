import { Card } from '../ui'
import type { ConversationMessage } from '../../services/chat'

interface MessageListProps {
  messages: ConversationMessage[]
  isSending: boolean
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

export function MessageList({ isSending, messages }: MessageListProps) {
  const visibleMessages = messages.filter((message) => message.role !== 'system')

  if (visibleMessages.length === 0 && !isSending) {
    return (
      <div className="p-gutter-lg">
        <p className="rounded-default bg-light-surface-container-low p-gutter-md font-body text-body-md text-light-on-surface-variant">
          Send a message to begin practicing English with your tutor.
        </p>
      </div>
    )
  }

  return (
    <div
      aria-label="Conversation messages"
      aria-live="polite"
      className="flex flex-col gap-gutter-md p-gutter-md sm:p-gutter-lg"
      role="log"
    >
      {visibleMessages.map((message) => {
        const isUser = message.role === 'user'

        return (
          <article
            key={message.id}
            aria-label={`${isUser ? 'You' : 'Tutor'} · ${formatTime(message.created_at)}`}
            className={`flex max-w-2xl flex-col gap-gutter-xs ${isUser ? 'self-end' : ''}`}
          >
            <span className="font-mono text-label-sm text-light-on-surface-variant">
              {isUser ? 'You' : 'Tutor'} · {formatTime(message.created_at)}
            </span>
            {isUser ? (
              <div className="rounded-default bg-light-primary p-gutter-md text-light-on-primary">
                <p className="text-pretty font-body text-body-md">{message.content}</p>
              </div>
            ) : (
              <>
                <Card variant="muted" padding="md">
                  <p className="text-pretty font-body text-body-md text-light-on-surface">
                    {message.content}
                  </p>
                </Card>
                {message.corrections.length > 0 && (
                  <Card className="flex flex-col gap-gutter-sm" padding="md">
                    <h3 className="font-title text-title-sm text-light-on-surface">
                      Language feedback
                    </h3>
                    {message.corrections.map((correction, index) => (
                      <div
                        key={`${message.id}-${index}`}
                        className="flex flex-col gap-1 border-t border-light-outline-variant pt-gutter-sm"
                      >
                        <span className="font-mono text-label-sm text-light-error">
                          {correction.original}
                        </span>
                        <span className="font-mono text-label-sm text-light-primary">
                          {correction.corrected}
                        </span>
                        <p className="font-body text-body-sm text-light-on-surface-variant">
                          {correction.explanation}
                        </p>
                      </div>
                    ))}
                  </Card>
                )}
              </>
            )}
          </article>
        )
      })}
      {isSending && (
        <Card aria-label="Tutor is responding" className="animate-pulse text-light-on-surface-variant" padding="md">
          Tutor is preparing a reply…
        </Card>
      )}
    </div>
  )
}
