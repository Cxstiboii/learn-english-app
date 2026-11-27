import { Input } from '../ui'
import type { LearningGoal, OnboardingDraft } from '../../types/onboarding'

interface GoalsStepProps {
  draft: OnboardingDraft
  onChange: (changes: Partial<OnboardingDraft>) => void
}

const goalOptions: Array<{ value: LearningGoal; label: string }> = [
  { value: 'remote_job', label: 'Get a remote job' },
  { value: 'interviews', label: 'Feel confident in interviews' },
  { value: 'toefl', label: 'Prepare for TOEFL' },
  { value: 'ielts', label: 'Prepare for IELTS' },
  { value: 'daily_fluency', label: 'Speak more fluently every day' },
  { value: 'read_docs', label: 'Read technical documentation' },
]

export function GoalsStep({ draft, onChange }: GoalsStepProps) {
  const hasExamGoal = draft.goals.includes('toefl') || draft.goals.includes('ielts')

  function toggleGoal(goal: LearningGoal) {
    const goals = draft.goals.includes(goal)
      ? draft.goals.filter((selectedGoal) => selectedGoal !== goal)
      : [...draft.goals, goal]
    onChange({
      goals,
      examTarget: goals.includes('toefl') || goals.includes('ielts')
        ? draft.examTarget === 'none'
          ? goal === 'ielts' ? 'ielts' : 'toefl'
          : draft.examTarget
        : 'none',
      examTargetScore: goals.includes('toefl') || goals.includes('ielts')
        ? draft.examTargetScore
        : null,
      examDate: goals.includes('toefl') || goals.includes('ielts') ? draft.examDate : null,
    })
  }

  return (
    <section aria-labelledby="goals-heading" className="flex flex-col gap-gutter-md">
      <div>
        <h2 className="font-headline text-headline-md" id="goals-heading">What are your goals?</h2>
        <p className="mt-1 text-body-md text-light-on-surface-variant">
          Choose all the things you want English to help you do.
        </p>
      </div>

      <fieldset className="grid gap-gutter-sm sm:grid-cols-2">
        <legend className="sr-only">Learning goals</legend>
        {goalOptions.map(({ value, label }) => (
          <label
            className="flex min-h-12 cursor-pointer items-center gap-gutter-sm rounded-md border border-light-outline-variant p-gutter-sm focus-within:ring-2 focus-within:ring-light-primary"
            key={value}
          >
            <input
              checked={draft.goals.includes(value)}
              className="size-4 accent-light-primary"
              onChange={() => toggleGoal(value)}
              type="checkbox"
            />
            <span className="text-body-md">{label}</span>
          </label>
        ))}
      </fieldset>

      {hasExamGoal && (
        <fieldset className="grid gap-gutter-md rounded-default border border-light-outline-variant p-gutter-md sm:grid-cols-3">
          <legend className="px-1 font-title text-title-sm">Your exam target</legend>
          <label className="flex flex-col gap-1 text-label-md">
            Which exam?
            <select
              className="min-h-10 rounded-md border border-light-outline-variant bg-light-surface-container-lowest px-3 text-body-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary"
              onChange={(event) => {
                if (event.target.value === 'toefl' || event.target.value === 'ielts') {
                  onChange({
                    examTarget: event.target.value,
                    examTargetScore: null,
                  })
                }
              }}
              value={draft.examTarget === 'none' ? '' : draft.examTarget}
            >
              <option disabled value="">Choose an exam</option>
              <option value="toefl">TOEFL</option>
              <option value="ielts">IELTS</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-label-md">
            Target score (optional)
            <Input
              max={draft.examTarget === 'ielts' ? 9 : 120}
              min={0}
              onChange={(event) => onChange({
                examTargetScore: event.target.value === '' ? null : Number(event.target.value),
              })}
              step={draft.examTarget === 'ielts' ? 0.5 : 1}
              type="number"
              value={draft.examTargetScore ?? ''}
            />
          </label>
          <label className="flex flex-col gap-1 text-label-md">
            Exam date (optional)
            <Input
              onChange={(event) => onChange({ examDate: event.target.value || null })}
              type="date"
              value={draft.examDate ?? ''}
            />
          </label>
        </fieldset>
      )}
    </section>
  )
}
