import { useEffect } from 'react'
import { EvaluationPanel } from '../components/speaking/EvaluationPanel'
import { PromptCard } from '../components/speaking/PromptCard'
import { RecordControls } from '../components/speaking/RecordControls'
import { useCountdown } from '../hooks/useCountdown'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { speakingPrompt } from '../content/speakingPrompt'
import { useEvaluateSpeaking } from '../hooks/useSpeaking'
import { Button } from '../components/ui'
import { createIdempotencyKey } from '../lib/idempotency'
import { useLearnerSettings } from '../hooks/useLearnerSettings'

export default function Speaking() {
  const settingsQuery = useLearnerSettings()
  const language = settingsQuery.data?.preferences.accent === 'uk' ? 'en-GB' : 'en-US'
  const {
    transcript,
    isListening,
    start,
    stop,
    reset,
    isSupported,
    error: recognitionError,
  } = useSpeechRecognition(undefined, language)
  const { elapsedSeconds, reset: resetCountdown } = useCountdown(
    speakingPrompt.durationSeconds,
    isListening,
  )
  const evaluationMutation = useEvaluateSpeaking()
  const evaluation = evaluationMutation.data ?? null
  const isEvaluating = evaluationMutation.isPending
  const evaluationError = evaluationMutation.error?.message

  useEffect(() => {
    if (elapsedSeconds >= speakingPrompt.durationSeconds && isListening) stop()
  }, [elapsedSeconds, isListening, stop])

  function toggleRecording() {
    if (isListening) {
      stop()
      return
    }

    reset()
    resetCountdown()
    evaluationMutation.reset()
    start()
  }

  function handleEvaluate() {
    evaluationMutation.mutate({
      prompt: speakingPrompt.question,
      transcript,
      durationSeconds: Math.max(1, elapsedSeconds),
      idempotencyKey: createIdempotencyKey(),
    })
  }

  function retryEvaluation() {
    if (evaluationMutation.variables) evaluationMutation.mutate(evaluationMutation.variables)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-gutter-lg px-gutter-md py-gutter-lg sm:px-page-margin">
      <section aria-labelledby="speaking-title" className="flex flex-col gap-gutter-xs">
        <span className="font-mono text-label-sm uppercase tracking-wider text-light-secondary">
          Module 04 · Web Speech API
        </span>
        <h1
          className="font-headline text-display-lg-mobile text-light-on-surface md:text-headline-lg"
          id="speaking-title"
        >
          Speaking Practice &amp; Evaluation
        </h1>
      </section>

      <div className="grid grid-cols-1 items-start gap-gutter-lg lg:grid-cols-12">
        <section
          aria-label="Speech recorder"
          className="flex flex-col gap-gutter-md lg:col-span-7"
        >
          <PromptCard
            elapsedSeconds={elapsedSeconds}
            prompt={speakingPrompt}
            transcript={transcript}
          />

          {!isSupported && (
            <p
              className="rounded-default border border-warning bg-warning-container px-gutter-md py-gutter-sm font-body text-body-sm text-on-warning-container"
              role="alert"
            >
              Speech recognition is not supported in this browser. Use Chrome or Edge to record your answer.
            </p>
          )}
          {settingsQuery.isLoading && (
            <p className="text-body-sm text-light-on-surface-variant" role="status">
              Loading your preferred English accent…
            </p>
          )}
          {settingsQuery.isError && (
            <div className="flex flex-wrap items-center justify-between gap-gutter-sm rounded-default border border-light-error bg-light-error-container px-gutter-md py-gutter-sm text-light-on-error-container" role="alert">
              <span>{settingsQuery.error.message}</span>
              <Button onClick={() => void settingsQuery.refetch()} size="sm" variant="secondary">Retry</Button>
            </div>
          )}
          {recognitionError && (
            <p
              className="rounded-default border border-light-error bg-light-error-container px-gutter-md py-gutter-sm font-body text-body-sm text-light-on-error-container"
              role="alert"
            >
              {recognitionError}
            </p>
          )}
          {evaluationError && (
            <div
              className="flex flex-wrap items-center justify-between gap-gutter-sm rounded-default border border-light-error bg-light-error-container px-gutter-md py-gutter-sm font-body text-body-sm text-light-on-error-container"
              role="alert"
            >
              {evaluationError}
              <Button onClick={retryEvaluation} size="sm" variant="secondary">Retry</Button>
            </div>
          )}

          <RecordControls
            hasTranscript={Boolean(transcript.trim())}
            isEvaluating={isEvaluating}
            isListening={isListening}
            isSettingsReady={settingsQuery.isSuccess}
            isSupported={isSupported}
            onEvaluate={handleEvaluate}
            onRecordToggle={toggleRecording}
          />
        </section>

        <aside aria-label="Speaking evaluation" className="lg:col-span-5">
          <EvaluationPanel evaluation={evaluation} isEvaluating={isEvaluating} />
        </aside>
      </div>
    </div>
  )
}
