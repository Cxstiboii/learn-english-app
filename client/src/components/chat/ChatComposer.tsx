import type { FormEvent } from 'react'
import { Button } from '../ui'

interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  isSending?: boolean
}

export function ChatComposer({ isSending = false, onChange, onSend, value }: ChatComposerProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSend()
  }

  return (
    <form
      className="flex flex-col gap-gutter-sm border-t border-light-outline-variant bg-light-surface-container-low p-gutter-md sm:p-gutter-lg"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor="chat-input">
        Reply in English
      </label>
      <div className="flex flex-col gap-gutter-sm sm:flex-row">
        <textarea
          aria-describedby="chat-input-help"
          className="min-h-16 min-w-0 flex-1 resize-none rounded-md border border-light-outline-variant bg-light-surface-container-lowest p-3 font-body text-body-md text-light-on-surface placeholder:text-light-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary focus-visible:ring-offset-2"
          id="chat-input"
          onChange={(event) => onChange(event.target.value)}
          placeholder="Write your reply in English (e.g., After seeing the numbers, he agreed to test my approach...)"
          rows={2}
          value={value}
        />
        <span className="sr-only" id="chat-input-help">
          Your message will be sent to your saved tutor conversation.
        </span>
        <div className="flex shrink-0 justify-end gap-gutter-xs">
          <Button disabled={!value.trim() || isSending} type="submit">
            <span aria-hidden="true" className="material-symbols-outlined text-body-lg">
              send
            </span>
            <span>{isSending ? 'Sending…' : 'Send'}</span>
          </Button>
        </div>
      </div>
    </form>
  )
}
