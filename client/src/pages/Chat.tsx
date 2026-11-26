import { useMemo, useState } from 'react'
import { ChatComposer } from '../components/chat/ChatComposer'
import { MessageList } from '../components/chat/MessageList'
import { SessionNotes } from '../components/chat/SessionNotes'
import { Button, Card } from '../components/ui'
import { useConversationMessages, useConversations, useSendTutorMessage } from '../hooks/useChat'
import type {
  ChatRequest,
  Conversation,
  ConversationMessage,
} from '../services/chat'
import type { SessionNote } from '../components/chat/types'

const noConversations: Conversation[] = []
const noMessages: ConversationMessage[] = []

function RetryMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-gutter-sm rounded-default border border-light-error bg-light-error-container px-gutter-md py-gutter-sm text-light-on-error-container"
      role="alert"
    >
      <span>{message}</span>
      <Button onClick={onRetry} size="sm" variant="secondary">Retry</Button>
    </div>
  )
}

export default function Chat() {
  const [conversationSelection, setConversationSelection] = useState<string | null | undefined>(undefined)
  const [draft, setDraft] = useState('')
  const conversationsQuery = useConversations()
  const conversations = conversationsQuery.data ?? noConversations
  const selectedConversationId = conversationSelection === undefined
    ? conversations[0]?.id ?? null
    : conversationSelection
  const messagesQuery = useConversationMessages(selectedConversationId)
  const sendMutation = useSendTutorMessage()

  const messages = messagesQuery.data ?? noMessages
  const correctionNotes = useMemo<SessionNote[]>(() => messages.flatMap((message) =>
    message.corrections.map((correction, index) => {
      const category: SessionNote['category'] =
        correction.category === 'grammar' || correction.category === 'tense'
          ? 'grammar'
          : 'phrase'
      return {
        id: `${message.id}-${index}`,
        category,
        title: correction.category.replaceAll('_', ' '),
        content: `${correction.original} → ${correction.corrected}. ${correction.explanation}`,
      }
    }),
  ).slice(-8), [messages])

  function startNewConversation() {
    setConversationSelection(null)
    setDraft('')
    sendMutation.reset()
  }

  function send(input: ChatRequest) {
    sendMutation.mutate(input, {
      onSuccess: (result) => {
        setConversationSelection(result.conversationId)
        setDraft('')
      },
    })
  }

  function handleSend() {
    const message = draft.trim()
    if (!message || sendMutation.isPending) return
    send({
      message,
      ...(selectedConversationId ? { conversationId: selectedConversationId } : {}),
    })
  }

  function retrySend() {
    if (sendMutation.variables) send(sendMutation.variables)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-gutter-lg px-gutter-md py-gutter-lg sm:px-page-margin">
      <section
        aria-labelledby="chat-page-title"
        className="flex flex-col justify-between gap-gutter-md md:flex-row md:items-center"
      >
        <div className="flex flex-col gap-gutter-xs">
          <span className="font-mono text-label-sm uppercase tracking-wider text-light-secondary">
            Module 01 · Adaptive Conversation
          </span>
          <h1
            className="font-headline text-display-lg-mobile text-light-on-surface md:text-headline-lg"
            id="chat-page-title"
          >
            AI English Tutor
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-gutter-sm">
          {conversationsQuery.isLoading ? (
            <div aria-label="Loading conversations" className="h-10 w-48 animate-pulse rounded-md bg-light-surface-container-high" />
          ) : conversationsQuery.isError ? (
            <Button onClick={() => void conversationsQuery.refetch()} variant="secondary">
              Retry conversations
            </Button>
          ) : conversations.length > 0 ? (
            <label className="sr-only" htmlFor="conversation-select">Choose a conversation</label>
          ) : null}
          {!conversationsQuery.isLoading && !conversationsQuery.isError && conversations.length > 0 && (
            <select
              className="min-h-10 max-w-64 rounded-md border border-light-outline-variant bg-light-surface-container-lowest px-3 font-body text-body-sm text-light-on-surface"
              id="conversation-select"
              onChange={(event) => {
                setConversationSelection(event.target.value || null)
                sendMutation.reset()
              }}
              value={selectedConversationId ?? ''}
            >
              <option value="">New conversation</option>
              {conversations.map((conversation) => (
                <option key={conversation.id} value={conversation.id}>
                  {conversation.title || 'Untitled conversation'}
                </option>
              ))}
            </select>
          )}
          <Button
            disabled={sendMutation.isPending}
            onClick={startNewConversation}
            variant="secondary"
          >
            New conversation
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-gutter-lg lg:grid-cols-12">
        <section aria-label="Conversation thread" className="min-w-0 lg:col-span-8">
          <Card className="flex flex-col overflow-hidden" padding="none">
            <header className="flex items-center justify-between gap-gutter-sm border-b border-light-outline-variant bg-light-surface-container-low px-gutter-md py-gutter-md sm:px-gutter-lg">
              <div className="flex min-w-0 items-center gap-gutter-sm">
                <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-light-primary" />
                <h2 className="truncate font-title text-title-md text-light-on-surface">
                  {selectedConversationId
                    ? conversations.find(({ id }) => id === selectedConversationId)?.title || 'Tutor conversation'
                    : 'New tutor conversation'}
                </h2>
              </div>
              <span className="shrink-0 font-mono text-label-sm text-light-on-surface-variant">
                Target: B2
              </span>
            </header>

            {conversationsQuery.isError ? (
              <div className="p-gutter-md">
                <RetryMessage
                  message={conversationsQuery.error.message}
                  onRetry={() => void conversationsQuery.refetch()}
                />
              </div>
            ) : conversationsQuery.isLoading || messagesQuery.isLoading ? (
              <div aria-label="Loading conversation" className="flex flex-col gap-gutter-md p-gutter-lg">
                <div className="h-20 animate-pulse rounded-default bg-light-surface-container-high" />
                <div className="ml-auto h-16 w-3/4 animate-pulse rounded-default bg-light-primary-container" />
                <div className="h-20 w-4/5 animate-pulse rounded-default bg-light-surface-container-high" />
              </div>
            ) : messagesQuery.isError ? (
              <div className="p-gutter-md">
                <RetryMessage
                  message={messagesQuery.error.message}
                  onRetry={() => void messagesQuery.refetch()}
                />
              </div>
            ) : (
              <MessageList isSending={sendMutation.isPending} messages={messages} />
            )}

            {sendMutation.isError && (
              <div className="px-gutter-md pb-gutter-md">
                <RetryMessage message={sendMutation.error.message} onRetry={retrySend} />
              </div>
            )}
            <ChatComposer
              isSending={sendMutation.isPending}
              onChange={setDraft}
              onSend={handleSend}
              value={draft}
            />
          </Card>
        </section>

        <SessionNotes
          className="lg:col-span-4"
          itemCount={correctionNotes.length}
          notes={correctionNotes}
        />
      </div>
    </div>
  )
}
