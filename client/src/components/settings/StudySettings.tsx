import type { FocusSkill } from '../../types/onboarding'
import type { LearnerSettings } from '../../types/preferences'
import { SettingsField, settingsInputClass } from './SettingsControls'

interface StudySettingsProps {
  settings: LearnerSettings
  onChange: (changes: Partial<LearnerSettings>) => void
}

const studyDays = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
]
const focusSkills: Array<{ value: FocusSkill; label: string }> = [
  { value: 'speaking', label: 'Speaking' },
  { value: 'listening', label: 'Listening' },
  { value: 'writing', label: 'Writing' },
  { value: 'vocab_grammar', label: 'Vocabulary & grammar' },
]

export function StudySettings({ settings, onChange }: StudySettingsProps) {
  const preferences = settings.preferences

  function updatePreferences(changes: Partial<typeof preferences>) {
    onChange({ preferences: { ...preferences, ...changes } })
  }

  function moveSkill(index: number, offset: number) {
    const newIndex = index + offset
    if (newIndex < 0 || newIndex >= preferences.focusSkills.length) return
    const priority = [...preferences.focusSkills]
    const [skill] = priority.splice(index, 1)
    if (!skill) return
    priority.splice(newIndex, 0, skill)
    updatePreferences({ focusSkills: priority })
  }

  return (
    <section aria-labelledby="study-heading" className="flex flex-col gap-gutter-lg">
      <div>
        <h2 className="font-headline text-headline-md" id="study-heading">Study plan</h2>
        <p className="mt-1 text-body-md text-light-on-surface-variant">
          Build a routine that works for you.
        </p>
      </div>
      <div className="grid gap-gutter-lg md:grid-cols-2">
        <div className="flex flex-col gap-gutter-md">
          <SettingsField label="Minutes per day">
            <input
              className={settingsInputClass}
              max={1440}
              min={1}
              onChange={(event) => onChange({ dailyGoalMinutes: Number(event.target.value) })}
              step={5}
              type="number"
              value={settings.dailyGoalMinutes}
            />
          </SettingsField>
          <fieldset>
            <legend className="mb-gutter-xs font-title text-title-sm">Study days</legend>
            <div className="flex flex-wrap gap-gutter-xs">
              {studyDays.map(({ value, label }) => (
                <label
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-light-outline-variant px-3 focus-within:ring-2 focus-within:ring-light-primary"
                  key={value}
                >
                  <input
                    checked={preferences.studyDays.includes(value)}
                    className="size-4 accent-light-primary"
                    disabled={preferences.studyDays.length === 1 && preferences.studyDays.includes(value)}
                    onChange={() => updatePreferences({
                      studyDays: preferences.studyDays.includes(value)
                        ? preferences.studyDays.filter((day) => day !== value)
                        : [...preferences.studyDays, value].sort((a, b) => a - b),
                    })}
                    type="checkbox"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <fieldset>
          <legend className="mb-gutter-xs font-title text-title-sm">Skill priority</legend>
          <ol className="flex flex-col gap-gutter-xs">
            {preferences.focusSkills.map((skill, index) => {
              const label = focusSkills.find((item) => item.value === skill)?.label ?? skill
              return (
                <li className="flex items-center justify-between gap-gutter-sm rounded-md border border-light-outline-variant px-3 py-2" key={skill}>
                  <span className="text-body-md"><span className="font-mono text-light-secondary">{index + 1}.</span> {label}</span>
                  <div className="flex gap-1">
                    <button
                      aria-label={`Move ${label} up`}
                      className="rounded-sm px-2 py-1 text-light-on-surface hover:bg-light-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary disabled:opacity-40"
                      disabled={index === 0}
                      onClick={() => moveSkill(index, -1)}
                      type="button"
                    >↑</button>
                    <button
                      aria-label={`Move ${label} down`}
                      className="rounded-sm px-2 py-1 text-light-on-surface hover:bg-light-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary disabled:opacity-40"
                      disabled={index === preferences.focusSkills.length - 1}
                      onClick={() => moveSkill(index, 1)}
                      type="button"
                    >↓</button>
                  </div>
                </li>
              )
            })}
          </ol>
          <p className="mt-2 text-body-sm text-light-on-surface-variant">
            Use the arrows to change the order of your practice focus.
          </p>
        </fieldset>
      </div>
    </section>
  )
}
