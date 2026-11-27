import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '../components/ui'
import { FocusStep } from '../components/onboarding/FocusStep'
import { GoalsStep } from '../components/onboarding/GoalsStep'
import { LevelStep } from '../components/onboarding/LevelStep'
import { SummaryStep } from '../components/onboarding/SummaryStep'
import { TimeTutorStep } from '../components/onboarding/TimeTutorStep'
import { useCompleteOnboarding } from '../hooks/useOnboarding'
import type { OnboardingDraft } from '../types/onboarding'

const steps = ['Goals', 'Level', 'Focus', 'Time & tutor', 'Summary']
const initialDraft: OnboardingDraft = {
  goals: [],
  examTarget: 'none',
  examTargetScore: null,
  examDate: null,
  levelSource: 'self',
  focusSkills: ['speaking', 'listening', 'writing', 'vocab_grammar'],
  softwareArea: '',
  interests: [],
  aboutMe: null,
  studyDays: [1, 2, 3, 4, 5],
  correctionStyle: 'major_errors',
  explanationLanguage: 'english_only',
  tone: 'friendly',
  replyLength: 'medium',
  accent: 'us',
  saveTranscripts: true,
  currentLevel: '',
  targetLevel: 'B2',
  dailyGoalMinutes: 30,
}

export default function Onboarding() {
  const navigate = useNavigate()
  const completeMutation = useCompleteOnboarding()
  const [draft, setDraft] = useState(initialDraft)
  const [activeStep, setActiveStep] = useState(0)
  const [validationError, setValidationError] = useState('')

  function updateDraft(changes: Partial<OnboardingDraft>) {
    setDraft((currentDraft) => ({ ...currentDraft, ...changes }))
    setValidationError('')
  }

  function getStepError() {
    if (activeStep === 0) {
      if (draft.goals.length === 0) return 'Choose at least one goal to continue.'
      if ((draft.goals.includes('toefl') || draft.goals.includes('ielts')) && draft.examTarget === 'none') {
        return 'Choose TOEFL or IELTS as your exam target.'
      }
    }
    if (activeStep === 1 && !draft.currentLevel) {
      return 'Choose your current level or take the placement test before continuing.'
    }
    if (activeStep === 2 && !draft.softwareArea) {
      return 'Choose a software area to continue.'
    }
    if (activeStep === 3) {
      if (!Number.isInteger(draft.dailyGoalMinutes) || draft.dailyGoalMinutes < 5) {
        return 'Choose at least 5 study minutes per day.'
      }
      if (draft.studyDays.length === 0) return 'Choose at least one study day.'
    }
    return ''
  }

  function moveNext() {
    const error = getStepError()
    if (error) {
      setValidationError(error)
      return
    }
    setValidationError('')
    setActiveStep((step) => Math.min(step + 1, steps.length - 1))
  }

  function moveBack() {
    setValidationError('')
    setActiveStep((step) => Math.max(step - 1, 0))
  }

  function handleStartLearning() {
    if (!draft.currentLevel || !draft.targetLevel || !draft.softwareArea) return
    completeMutation.mutate({
      currentLevel: draft.currentLevel,
      targetLevel: draft.targetLevel,
      dailyGoalMinutes: draft.dailyGoalMinutes,
      preferences: {
        goals: draft.goals,
        examTarget: draft.examTarget,
        examTargetScore: draft.examTargetScore,
        examDate: draft.examDate,
        levelSource: draft.levelSource,
        focusSkills: draft.focusSkills,
        softwareArea: draft.softwareArea,
        interests: draft.interests,
        aboutMe: draft.aboutMe,
        studyDays: draft.studyDays,
        correctionStyle: draft.correctionStyle,
        explanationLanguage: draft.explanationLanguage,
        tone: draft.tone,
        replyLength: draft.replyLength,
        accent: draft.accent,
        saveTranscripts: draft.saveTranscripts,
      },
    }, {
      onSuccess: () => navigate('/path', { replace: true }),
    })
  }

  return (
    <div className="min-h-screen bg-light-surface text-light-on-surface">
      <header className="border-b border-light-outline-variant bg-light-surface-container-lowest">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-gutter-md sm:px-page-margin">
          <span className="font-title text-title-lg">Your English learning plan</span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-gutter-lg px-gutter-md py-gutter-lg sm:px-page-margin sm:py-gutter-xl">
        <div className="flex flex-col gap-gutter-sm">
          <div className="flex items-center justify-between gap-gutter-sm text-body-sm">
            <p aria-live="polite">Step {activeStep + 1} of {steps.length}: {steps[activeStep]}</p>
            <p>{Math.round(((activeStep + 1) / steps.length) * 100)}% complete</p>
          </div>
          <div
            aria-label={`Step ${activeStep + 1} of ${steps.length}`}
            aria-valuemax={steps.length}
            aria-valuemin={1}
            aria-valuenow={activeStep + 1}
            className="h-2 overflow-hidden rounded-full bg-light-surface-container-high"
            role="progressbar"
          >
            <div
              className="h-full bg-light-primary transition-[width]"
              style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <Card className="flex flex-col gap-gutter-lg" padding="lg">
          {activeStep === 0 && <GoalsStep draft={draft} onChange={updateDraft} />}
          {activeStep === 1 && <LevelStep draft={draft} onChange={updateDraft} />}
          {activeStep === 2 && <FocusStep draft={draft} onChange={updateDraft} />}
          {activeStep === 3 && <TimeTutorStep draft={draft} onChange={updateDraft} />}
          {activeStep === 4 && (
            <SummaryStep
              draft={draft}
              onEdit={(stepIndex) => {
                setValidationError('')
                setActiveStep(stepIndex)
              }}
            />
          )}

          {validationError && <p className="text-body-sm text-light-error" role="alert">{validationError}</p>}
          {completeMutation.isError && (
            <div className="flex flex-wrap items-center justify-between gap-gutter-sm rounded-md border border-light-error bg-light-error-container p-gutter-sm text-light-on-error-container" role="alert">
              <span>{completeMutation.error.message}</span>
              <Button
                disabled={completeMutation.isPending}
                onClick={handleStartLearning}
                variant="secondary"
              >
                Retry
              </Button>
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-gutter-sm border-t border-light-outline-variant pt-gutter-md">
            <Button
              disabled={activeStep === 0 || completeMutation.isPending}
              onClick={moveBack}
              variant="secondary"
            >
              Back
            </Button>
            {activeStep < steps.length - 1 ? (
              <Button onClick={moveNext}>Next</Button>
            ) : (
              <Button disabled={completeMutation.isPending} onClick={handleStartLearning}>
                {completeMutation.isPending ? 'Saving your plan…' : 'Start learning'}
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
