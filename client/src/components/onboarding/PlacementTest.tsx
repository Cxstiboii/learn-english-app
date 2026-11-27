import { useState } from 'react'
import { Button } from '../ui'
import { usePlacementQuestions, useSubmitPlacementAnswers } from '../../hooks/useOnboarding'
import type { OnboardingLevel, PlacementAnswer, PlacementResult } from '../../types/onboarding'

interface PlacementTestProps {
  onUseLevel: (level: OnboardingLevel) => void
  onChooseAnother: () => void
}

export function PlacementTest({ onUseLevel, onChooseAnother }: PlacementTestProps) {
  const [isTakingTest, setIsTakingTest] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<PlacementResult | null>(null)
  const questionsQuery = usePlacementQuestions(isTakingTest)
  const submitMutation = useSubmitPlacementAnswers()
  const question = questionsQuery.data?.[questionIndex]
  const selectedAnswer = question ? answers[question.id] : undefined

  function startPlacementTest() {
    setAnswers({})
    setQuestionIndex(0)
    setResult(null)
    submitMutation.reset()
    setIsTakingTest(true)
  }

  function submitAnswers() {
    if (!questionsQuery.data) return
    const placementAnswers: PlacementAnswer[] = questionsQuery.data.map((item) => ({
      questionId: item.id,
      selectedOption: answers[item.id] ?? '',
    }))
    submitMutation.mutate(placementAnswers, {
      onSuccess: (placementResult) => setResult(placementResult),
    })
  }

  function chooseAnotherLevel() {
    onChooseAnother()
    setResult(null)
    setIsTakingTest(false)
  }

  function usePlacementLevel() {
    if (!result) return
    onUseLevel(result.estimatedLevel)
    setIsTakingTest(false)
    setResult(null)
  }

  return (
    <>
      {!isTakingTest && !result && (
        <Button className="w-fit" onClick={startPlacementTest} variant="secondary">
          Not sure? Take a short placement test
        </Button>
      )}

      {isTakingTest && (
        <div className="rounded-default border border-light-outline-variant bg-light-surface-container-low p-gutter-md">
          {questionsQuery.isLoading && <p role="status">Loading placement test…</p>}
          {questionsQuery.isError && (
            <div className="flex flex-wrap items-center gap-gutter-sm" role="alert">
              <span>{questionsQuery.error.message}</span>
              <Button onClick={() => void questionsQuery.refetch()} variant="secondary">Retry</Button>
            </div>
          )}
          {question && questionsQuery.data && (
            <div className="flex flex-col gap-gutter-md">
              <div
                aria-label={`Question ${questionIndex + 1} of ${questionsQuery.data.length}`}
                aria-valuemax={questionsQuery.data.length}
                aria-valuemin={1}
                aria-valuenow={questionIndex + 1}
                className="h-2 overflow-hidden rounded-full bg-light-surface-container-high"
                role="progressbar"
              >
                <div
                  className="h-full bg-light-primary"
                  style={{ width: `${((questionIndex + 1) / questionsQuery.data.length) * 100}%` }}
                />
              </div>
              <p className="text-body-sm text-light-on-surface-variant">
                Question {questionIndex + 1} of {questionsQuery.data.length} · {question.level} · {question.skill}
              </p>
              <fieldset>
                <legend className="font-title text-title-md">{question.prompt}</legend>
                <div className="mt-gutter-sm flex flex-col gap-gutter-xs">
                  {question.options.map((option) => (
                    <label
                      className="flex cursor-pointer items-start gap-gutter-sm rounded-md border border-light-outline-variant p-gutter-sm focus-within:ring-2 focus-within:ring-light-primary"
                      key={option.id}
                    >
                      <input
                        checked={selectedAnswer === option.id}
                        className="mt-1 size-4 accent-light-primary"
                        name={`placement-${question.id}`}
                        onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                        type="radio"
                        value={option.id}
                      />
                      <span>{option.text}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {submitMutation.isError && (
                <div className="flex flex-wrap items-center gap-gutter-sm" role="alert">
                  <span>{submitMutation.error.message}</span>
                  <Button onClick={submitAnswers} variant="secondary">Retry</Button>
                </div>
              )}
              <div className="flex flex-wrap justify-between gap-gutter-sm">
                <Button onClick={chooseAnotherLevel} variant="ghost">Choose a level manually</Button>
                {questionIndex < questionsQuery.data.length - 1 ? (
                  <Button
                    disabled={!selectedAnswer}
                    onClick={() => setQuestionIndex((index) => index + 1)}
                  >
                    Next question
                  </Button>
                ) : (
                  <Button
                    disabled={!selectedAnswer || submitMutation.isPending}
                    onClick={submitAnswers}
                  >
                    {submitMutation.isPending ? 'Checking…' : 'Get my estimated level'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {result && (
        <div aria-live="polite" className="flex flex-col gap-gutter-sm rounded-default border border-light-primary bg-light-primary-container p-gutter-md">
          <h3 className="font-title text-title-lg">Estimated level: {result.estimatedLevel}</h3>
          <p className="text-body-sm">Placement results are an estimate to help personalize your learning.</p>
          <div className="flex flex-wrap gap-gutter-sm">
            <Button onClick={usePlacementLevel}>Use this level</Button>
            <Button onClick={chooseAnotherLevel} variant="secondary">Choose another</Button>
          </div>
        </div>
      )}
    </>
  )
}
