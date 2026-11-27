import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FocusLayout from '../components/layout/FocusLayout'
import { InterviewSummary } from '../components/interview/InterviewSummary'
import { InterviewTabs } from '../components/interview/InterviewTabs'
import { QuestionCard } from '../components/interview/QuestionCard'
import { StarGuide } from '../components/interview/StarGuide'
import { useCountdown, formatDuration } from '../hooks/useCountdown'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { interviewQuestions, interviewTrackLabels } from '../content/interviewQuestions'
import { useEvaluateInterview } from '../hooks/useInterview'
import { createIdempotencyKey } from '../lib/idempotency'
import type {
  InterviewAnswer,
  InterviewEvaluation,
  InterviewTrack,
  StarAssessment,
  StarItemStatus,
} from '../types/interview'

const QUESTION_SECONDS = 2 * 60

interface TrackProgress {
  step: number
  answers: Record<string, string>
  finalized: Record<string, boolean>
}

type InterviewProgress = Record<InterviewTrack, TrackProgress>

const initialProgress: InterviewProgress = {
  behavioral: { step: 0, answers: {}, finalized: {} },
  'system-design': { step: 0, answers: {}, finalized: {} },
  'role-salary': { step: 0, answers: {}, finalized: {} },
}

const ACTION_VERBS =
  'analy[sz]ed|built|created|designed|developed|deployed|fixed|implemented|improved|investigated|led|migrated|optimized|reduced|resolved|tested|updated'

function getRoundQuestions(track: InterviewTrack) {
  const questions = interviewQuestions[track]
  return [...questions.slice(1), questions[0]]
}

function itemStatus(isPresent: boolean, isFinalized: boolean): StarItemStatus {
  if (isPresent) return 'completed'
  return isFinalized ? 'missing' : 'pending'
}

function assessStarAnswer(answer: string, isFinalized: boolean): StarAssessment {
  // TODO: Replace provisional keyword checks with an AI evaluation.
  const hasSituationOrTask =
    /\b(situation|task|context|background|incident|project|challenge|responsible|assigned)\b/i.test(
      answer,
    )
  const hasAction = new RegExp(`\\bI\\s+(?:${ACTION_VERBS})\\b`, 'i').test(answer)
  const hasResult =
    /\b\d+(?:[.,]\d+)?\s*%?\b/.test(answer) ||
    /\b(reduced|improved|increased|decreased|saved|delivered|achieved|grew)\b/i.test(answer)

  return {
    situationTask: itemStatus(hasSituationOrTask, isFinalized),
    action: itemStatus(hasAction, isFinalized),
    result: itemStatus(hasResult, isFinalized),
  }
}

export default function Interview() {
  const navigate = useNavigate()
  const [activeTrack, setActiveTrack] = useState<InterviewTrack>('behavioral')
  const [progress, setProgress] = useState<InterviewProgress>(initialProgress)
  const [isPaused, setIsPaused] = useState(false)
  const [evaluations, setEvaluations] = useState<
    Partial<Record<InterviewTrack, InterviewEvaluation>>
  >({})
  const evaluationMutation = useEvaluateInterview()
  const [listenError, setListenError] = useState<string | null>(null)
  const speechTargetRef = useRef<{ track: InterviewTrack; questionId: string } | null>(null)
  const saveRecognizedTranscript = useCallback((nextTranscript: string) => {
    const target = speechTargetRef.current
    if (!target || !nextTranscript.trim()) return

    setProgress((current) => {
      const targetProgress = current[target.track]
      return {
        ...current,
        [target.track]: {
          ...targetProgress,
          answers: {
            ...targetProgress.answers,
            [target.questionId]: nextTranscript,
          },
        },
      }
    })
  }, [])
  const {
    isListening,
    start: startRecognition,
    stop: stopRecognition,
    isSupported,
    error: recognitionError,
  } = useSpeechRecognition(saveRecognizedTranscript)
  const activeProgress = progress[activeTrack]
  const evaluatingTrack = evaluationMutation.isPending
    ? evaluationMutation.variables?.track ?? null
    : null
  const evaluationError = evaluationMutation.isError
    && evaluationMutation.variables?.track === activeTrack
    ? evaluationMutation.error.message
    : null
  const roundQuestions = getRoundQuestions(activeTrack)
  const isSummary = activeProgress.step >= roundQuestions.length
  const question = isSummary ? null : roundQuestions[activeProgress.step]
  const questionNumber = isSummary ? roundQuestions.length : (activeProgress.step + 1) % 5 + 1
  const answer = question ? activeProgress.answers[question.id] ?? '' : ''
  const questionId = question?.id
  const { remainingSeconds, isExpired, isLowTime, reset } = useCountdown(
    QUESTION_SECONDS,
    !isPaused && !isSummary,
  )
  const isQuestionFinalized = question
    ? activeProgress.finalized[question.id] === true || isExpired
    : false

  useEffect(() => {
    if (!isExpired || !isListening || !questionId) return

    stopRecognition()
  }, [isExpired, isListening, questionId, stopRecognition])

  useEffect(
    () => () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    },
    [activeTrack, question?.id],
  )

  function updateAnswer(nextAnswer: string) {
    if (!question) return

    setProgress((current) => ({
      ...current,
      [activeTrack]: {
        ...current[activeTrack],
        answers: {
          ...current[activeTrack].answers,
          [question.id]: nextAnswer,
        },
        finalized: {
          ...current[activeTrack].finalized,
          [question.id]: false,
        },
      },
    }))
  }

  function selectTrack(track: InterviewTrack) {
    if (track === activeTrack || evaluatingTrack) return
    if (isListening) {
      stopRecognition()
      if (question) {
        setProgress((current) => ({
          ...current,
          [activeTrack]: {
            ...current[activeTrack],
            finalized: {
              ...current[activeTrack].finalized,
              [question.id]: true,
            },
          },
        }))
      }
    }
    setActiveTrack(track)
    evaluationMutation.reset()
    setIsPaused(false)
    setListenError(null)
    reset()
  }

  function togglePause() {
    if (!isPaused && isListening && question) {
      stopRecognition()
      setProgress((current) => ({
        ...current,
        [activeTrack]: {
          ...current[activeTrack],
          finalized: {
            ...current[activeTrack].finalized,
            [question.id]: true,
          },
        },
      }))
    }
    setIsPaused((paused) => !paused)
  }

  function toggleRecording() {
    if (!question || isExpired) return

    if (isListening) {
      stopRecognition()
      setProgress((current) => ({
        ...current,
        [activeTrack]: {
          ...current[activeTrack],
          finalized: {
            ...current[activeTrack].finalized,
            [question.id]: true,
          },
        },
      }))
      return
    }

    speechTargetRef.current = { track: activeTrack, questionId: question.id }
    setProgress((current) => ({
      ...current,
      [activeTrack]: {
        ...current[activeTrack],
        finalized: {
          ...current[activeTrack].finalized,
          [question.id]: false,
        },
      },
    }))
    startRecognition()
  }

  function goToNextQuestion() {
    if (!question) return
    if (isListening) stopRecognition()

    setProgress((current) => ({
      ...current,
      [activeTrack]: {
        ...current[activeTrack],
        step: current[activeTrack].step + 1,
        finalized: {
          ...current[activeTrack].finalized,
          [question.id]: true,
        },
      },
    }))
    setIsPaused(false)
    setListenError(null)
    reset()
  }

  function listenToQuestion() {
    if (!question) return
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      setListenError('Audio playback is not supported in this browser.')
      return
    }

    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(question.prompt)
      utterance.lang = 'en-US'
      utterance.voice =
        window.speechSynthesis
          .getVoices()
          .find((voice) => voice.lang.toLowerCase().startsWith('en-us')) ?? null
      utterance.onerror = () => setListenError('Unable to play the question audio.')
      setListenError(null)
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      setListenError(
        error instanceof Error ? error.message : 'Unable to play the question audio.',
      )
    }
  }

  function buildInterviewAnswers(track: InterviewTrack): InterviewAnswer[] {
    return getRoundQuestions(track).map((roundQuestion) => ({
      questionNumber:
        interviewQuestions[track].findIndex(({ id }) => id === roundQuestion.id) + 1,
      questionId: roundQuestion.id,
      question: roundQuestion.prompt,
      answer: progress[track].answers[roundQuestion.id] ?? '',
    }))
  }

  function handleEvaluate() {
    if (!isSummary || evaluatingTrack) return
    const track = activeTrack
    const answers = buildInterviewAnswers(track)
    const previousRequest = evaluationMutation.variables
    const isRetry = evaluationMutation.isError
      && previousRequest?.track === track
      && JSON.stringify(previousRequest.answers) === JSON.stringify(answers)
    evaluationMutation.mutate(
      {
        answers,
        track,
        idempotencyKey: isRetry && previousRequest
          ? previousRequest.idempotencyKey
          : createIdempotencyKey(),
      },
      {
        onSuccess: (result) => {
          setEvaluations((current) => ({ ...current, [track]: result }))
        },
      },
    )
  }

  function handleExit() {
    if (isListening) stopRecognition()
    navigate('/speaking')
  }

  const answers = buildInterviewAnswers(activeTrack)

  return (
    <FocusLayout
      canPause={!isExpired && !isSummary && !evaluatingTrack}
      confirmationMessage="Return to speaking practice? Your current interview progress will be lost."
      exitLabel="Back"
      headerContent={
        <span className="inline-flex items-center rounded-sm border border-light-outline-variant bg-light-surface-container-high px-2.5 py-1 font-mono text-label-sm text-light-on-surface">
          {isSummary ? '5 of 5' : `${questionNumber} of 5`}
        </span>
      }
      isPaused={isPaused}
      isTimerWarning={!isSummary && isLowTime}
      onExit={handleExit}
      onPauseToggle={togglePause}
      timerLabel={formatDuration(isSummary ? 0 : remainingSeconds)}
      title="US Remote Engineering Interview"
    >
      <section aria-labelledby="interview-round-title" className="flex flex-col gap-gutter-md">
        <div className="flex flex-col gap-gutter-xs">
          <span className="font-mono text-label-sm uppercase tracking-wider text-light-secondary">
            Interview Simulation · B2 Fluency
          </span>
          <h1
            className="font-headline text-display-lg-mobile text-light-on-surface md:text-headline-lg"
            id="interview-round-title"
          >
            Remote USD Role Practice
          </h1>
        </div>
        <InterviewTabs
          activeTrack={activeTrack}
          disabled={Boolean(evaluatingTrack)}
          onChange={selectTrack}
        />
      </section>

      <div
        aria-labelledby={`interview-tab-${activeTrack}`}
        className="grid grid-cols-1 items-start gap-gutter-lg lg:grid-cols-12"
        id="interview-round-panel"
        role="tabpanel"
      >
        {isSummary ? (
          <div className="lg:col-span-12">
            <InterviewSummary
              answers={answers}
              error={evaluationError}
              evaluation={evaluations[activeTrack] ?? null}
              isEvaluating={evaluatingTrack === activeTrack}
              onEvaluate={handleEvaluate}
              trackLabel={interviewTrackLabels[activeTrack]}
            />
          </div>
        ) : (
          <>
            <section
              aria-label="Interview question and response"
              className="flex flex-col gap-gutter-md lg:col-span-7"
            >
              {isPaused && (
                <p
                  className="rounded-default border border-warning bg-warning-container px-gutter-md py-gutter-sm font-body text-body-sm text-on-warning-container"
                  role="status"
                >
                  Interview paused. Resume when you are ready.
                </p>
              )}
              {question && (
                <QuestionCard
                  answer={answer}
                  isLastQuestion={activeProgress.step === roundQuestions.length - 1}
                  isListening={isListening}
                  isSupported={isSupported}
                  isTimerExpired={isExpired}
                  listenError={listenError}
                  onAnswerChange={updateAnswer}
                  onListen={listenToQuestion}
                  onNext={goToNextQuestion}
                  onSpeakToggle={toggleRecording}
                  question={question.prompt}
                  recognitionError={recognitionError}
                />
              )}
            </section>

            <aside
              aria-label="Interview structure guide"
              className="flex flex-col gap-gutter-md lg:col-span-5"
            >
              {question && (
                <StarGuide
                  assessment={assessStarAnswer(answer, isQuestionFinalized)}
                  isFinalized={isQuestionFinalized}
                />
              )}
            </aside>
          </>
        )}
      </div>
    </FocusLayout>
  )
}
