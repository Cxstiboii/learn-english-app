import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FocusLayout from '../components/layout/FocusLayout'
import { ExamModeToggle } from '../components/mock/ExamModeToggle'
import { PromptPanel } from '../components/mock/PromptPanel'
import { ResponseEditor } from '../components/mock/ResponseEditor'
import { WritingResultsPanel } from '../components/mock/WritingResultsPanel'
import { Button } from '../components/ui'
import { useAutosave } from '../hooks/useAutosave'
import { formatDuration, useCountdown } from '../hooks/useCountdown'
import { useGradeWriting } from '../hooks/useWriting'
import { writingPrompts } from '../content/writingPrompts'
import type { WritingMode } from '../types/writing'
import { createIdempotencyKey } from '../lib/idempotency'

export default function WritingMock() {
  const [mode, setMode] = useState<WritingMode>('toefl')

  return <WritingMockSession key={mode} mode={mode} onModeChange={setMode} />
}

interface WritingMockSessionProps {
  mode: WritingMode
  onModeChange: (mode: WritingMode) => void
}

function WritingMockSession({ mode, onModeChange }: WritingMockSessionProps) {
  const navigate = useNavigate()
  const prompt = writingPrompts[mode]
  const autosave = useAutosave(`devfluent:writing:${mode}`)
  const [isPaused, setIsPaused] = useState(false)
  const gradeMutation = useGradeWriting()
  const isGrading = gradeMutation.isPending
  const evaluation = gradeMutation.data ?? null
  const gradeError = gradeMutation.error?.message
  const { remainingSeconds, isExpired, isLowTime } = useCountdown(
    prompt.durationSeconds,
    !isPaused && !evaluation && !isGrading,
  )
  const wordCount = autosave.value.trim()
    ? autosave.value.trim().split(/\s+/).length
    : 0

  function changeMode(nextMode: WritingMode) {
    if (nextMode === mode) return
    if (autosave.saveNow()) onModeChange(nextMode)
  }

  function exitMock() {
    if (autosave.saveNow()) navigate('/progress')
  }

  async function submitResponse() {
    if (isGrading || evaluation || wordCount < prompt.minimumWords) return

    setIsPaused(true)
    gradeMutation.mutate({
      response: autosave.value,
      mode,
      prompt: prompt.prompt,
      idempotencyKey: createIdempotencyKey(),
    })
  }

  return (
    <FocusLayout
      canPause={!isExpired && !evaluation && !isGrading}
      headerContent={
        <span className="hidden rounded-sm bg-light-surface-container px-2 py-1 font-mono text-label-sm text-light-on-surface-variant md:inline">
          {prompt.examName}
        </span>
      }
      isPaused={isPaused}
      isTimerWarning={isLowTime}
      onExit={exitMock}
      onPauseToggle={() => setIsPaused((paused) => !paused)}
      timerLabel={formatDuration(remainingSeconds)}
      title="TOEFL iBT / IELTS Timed Mock"
    >
      <div className="flex flex-col gap-gutter-md">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-label-sm uppercase tracking-wide text-light-primary">
            Timed Simulation · B2 Target
          </p>
          <h2 className="font-title text-headline-sm text-light-on-surface">
            {prompt.taskName}
          </h2>
          <p className="max-w-3xl font-body text-body-md text-light-on-surface-variant">
            Practice a timed writing response, then get an instant estimated evaluation.
          </p>
        </div>

        <ExamModeToggle mode={mode} onChange={changeMode} />

        {isPaused && !isExpired && !evaluation && (
          <p
            className="rounded-default border border-warning bg-warning-container px-gutter-md py-gutter-sm font-body text-body-sm text-on-warning-container"
            role="status"
          >
            Mock paused. Resume when you are ready.
          </p>
        )}

        <div className="grid grid-cols-1 items-start gap-gutter-lg lg:grid-cols-2">
          <PromptPanel prompt={prompt} />

          <div className="flex flex-col gap-gutter-md">
            <ResponseEditor
              isExpired={isExpired}
              isGrading={isGrading}
              isLocked={isExpired || Boolean(evaluation) || isGrading}
              isSubmitted={Boolean(evaluation)}
              minimumWords={prompt.minimumWords}
              onChange={autosave.updateValue}
              onSubmit={submitResponse}
              saveError={autosave.error}
              saveStatus={autosave.status}
              value={autosave.value}
            />
            {gradeError && (
              <div
                className="flex flex-wrap items-center justify-between gap-gutter-sm rounded-default border border-light-error bg-light-error-container px-gutter-md py-gutter-sm font-body text-body-sm text-light-on-error-container"
                role="alert"
              >
                {gradeError}
                <Button
                  disabled={!gradeMutation.variables || isGrading}
                  onClick={() => gradeMutation.variables && gradeMutation.mutate(gradeMutation.variables)}
                  size="sm"
                  variant="secondary"
                >
                  Retry
                </Button>
              </div>
            )}
            {isGrading && (
              <div aria-label="Generating writing evaluation" className="flex flex-col gap-gutter-sm rounded-default border border-light-outline-variant bg-light-surface-container-lowest p-gutter-md">
                <div className="h-6 animate-pulse rounded bg-light-surface-container-high" />
                <div className="h-14 animate-pulse rounded bg-light-surface-container-high" />
              </div>
            )}
            {evaluation && <WritingResultsPanel evaluation={evaluation} />}
          </div>
        </div>
      </div>
    </FocusLayout>
  )
}
