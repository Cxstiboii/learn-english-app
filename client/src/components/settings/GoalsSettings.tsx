import type { LearningGoal, OnboardingLevel } from '../../types/onboarding'
import type { LearnerSettings } from '../../types/preferences'
import { SettingsField, SettingsSelect, settingsInputClass } from './SettingsControls'

interface GoalsSettingsProps {
  settings: LearnerSettings
  onChange: (changes: Partial<LearnerSettings>) => void
}

const levels: OnboardingLevel[] = ['A2', 'B1', 'B1+', 'B2', 'C1']
const goalOptions: Array<{ value: LearningGoal; label: string }> = [
  { value: 'remote_job', label: 'Get a remote job' },
  { value: 'interviews', label: 'Feel confident in interviews' },
  { value: 'toefl', label: 'Prepare for TOEFL' },
  { value: 'ielts', label: 'Prepare for IELTS' },
  { value: 'daily_fluency', label: 'Speak more fluently every day' },
  { value: 'read_docs', label: 'Read technical documentation' },
]

export function GoalsSettings({ settings, onChange }: GoalsSettingsProps) {
  const { preferences } = settings
  const hasExamGoal = preferences.goals.includes('toefl') || preferences.goals.includes('ielts')

  function updatePreferences(changes: Partial<typeof preferences>) {
    onChange({ preferences: { ...preferences, ...changes } })
  }

  function toggleGoal(goal: LearningGoal) {
    const goals = preferences.goals.includes(goal)
      ? preferences.goals.filter((selected) => selected !== goal)
      : [...preferences.goals, goal]
    const hasExam = goals.includes('toefl') || goals.includes('ielts')
    updatePreferences({
      goals,
      examTarget: hasExam
        ? preferences.examTarget === 'none'
          ? goal === 'ielts' ? 'ielts' : 'toefl'
          : preferences.examTarget
        : 'none',
      examTargetScore: hasExam ? preferences.examTargetScore : null,
      examDate: hasExam ? preferences.examDate : null,
    })
  }

  return (
    <section aria-labelledby="goals-heading" className="flex flex-col gap-gutter-md">
      <div>
        <h2 className="font-headline text-headline-md" id="goals-heading">Goals &amp; level</h2>
        <p className="mt-1 text-body-md text-light-on-surface-variant">
          Update your learning goals, exam target, and English level.
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
              checked={preferences.goals.includes(value)}
              className="size-4 accent-light-primary"
              disabled={preferences.goals.length === 1 && preferences.goals.includes(value)}
              onChange={() => toggleGoal(value)}
              type="checkbox"
            />
            <span className="text-body-md">{label}</span>
          </label>
        ))}
      </fieldset>
      {hasExamGoal && (
        <div className="grid gap-gutter-md sm:grid-cols-3">
          <SettingsSelect
            label="Exam"
            onChange={(examTarget) => updatePreferences({
              examTarget,
              examTargetScore: null,
            })}
            options={[{ value: 'toefl', label: 'TOEFL' }, { value: 'ielts', label: 'IELTS' }]}
            value={preferences.examTarget === 'none' ? 'toefl' : preferences.examTarget}
          />
          <SettingsField label="Target score (optional)">
            <input
              className={settingsInputClass}
              max={preferences.examTarget === 'ielts' ? 9 : 120}
              min={0}
              onChange={(event) => updatePreferences({
                examTargetScore: event.target.value === '' ? null : Number(event.target.value),
              })}
              step={preferences.examTarget === 'ielts' ? 0.5 : 1}
              type="number"
              value={preferences.examTargetScore ?? ''}
            />
          </SettingsField>
          <SettingsField label="Exam date (optional)">
            <input
              className={settingsInputClass}
              onChange={(event) => updatePreferences({ examDate: event.target.value || null })}
              type="date"
              value={preferences.examDate ?? ''}
            />
          </SettingsField>
        </div>
      )}
      <div className="grid gap-gutter-md sm:grid-cols-2">
        <SettingsSelect
          label="Current level"
          onChange={(currentLevel) => onChange({ currentLevel })}
          options={levels.map((level) => ({ value: level, label: level }))}
          value={settings.currentLevel}
        />
        <SettingsSelect
          label="Target level"
          onChange={(targetLevel) => onChange({ targetLevel })}
          options={levels.map((level) => ({ value: level, label: level }))}
          value={settings.targetLevel}
        />
      </div>
    </section>
  )
}
