import { PlacementTest } from './PlacementTest'
import type { OnboardingDraft, OnboardingLevel } from '../../types/onboarding'

interface LevelStepProps {
  draft: OnboardingDraft
  onChange: (changes: Partial<OnboardingDraft>) => void
}

const selectableLevels: Array<{
  value: Exclude<OnboardingLevel, 'B1+'>
  description: string
}> = [
  { value: 'A2', description: 'I can talk about familiar topics and write short messages.' },
  { value: 'B1', description: 'I can handle everyday conversations and explain plans or experiences.' },
  { value: 'B2', description: 'I can discuss complex topics and work confidently in English.' },
  { value: 'C1', description: 'I can express myself fluently in demanding academic or professional settings.' },
]

export function LevelStep({ draft, onChange }: LevelStepProps) {
  function chooseManualLevel(level: OnboardingLevel) {
    onChange({ currentLevel: level, levelSource: 'self' })
  }

  return (
    <section aria-labelledby="level-heading" className="flex flex-col gap-gutter-md">
      <div>
        <h2 className="font-headline text-headline-md" id="level-heading">Choose your level</h2>
        <p className="mt-1 text-body-md text-light-on-surface-variant">
          Pick the level that feels right now, or take a short placement test.
        </p>
      </div>

      <fieldset>
        <legend className="mb-gutter-sm font-title text-title-md">My current level</legend>
        <div className="grid gap-gutter-sm sm:grid-cols-2">
          {selectableLevels.map(({ value, description }) => (
            <label
              className="flex cursor-pointer gap-gutter-sm rounded-default border border-light-outline-variant p-gutter-md focus-within:ring-2 focus-within:ring-light-primary"
              key={value}
            >
              <input
                aria-label={`${value}. ${description}`}
                checked={draft.currentLevel === value}
                className="mt-1 size-4 accent-light-primary"
                name="current-level"
                onChange={() => chooseManualLevel(value)}
                type="radio"
                value={value}
              />
              <span>
                <span className="block font-title text-title-md">{value}</span>
                <span className="text-body-sm text-light-on-surface-variant">{description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex max-w-sm flex-col gap-1 font-title text-title-sm">
        My target level
        <select
          className="min-h-11 rounded-md border border-light-outline-variant bg-light-surface-container-lowest px-3 font-body text-body-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary"
          onChange={(event) => {
            const level = selectableLevels.find(({ value }) => value === event.target.value)?.value
            if (level) onChange({ targetLevel: level })
          }}
          value={draft.targetLevel}
        >
          {selectableLevels.map(({ value }) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>

      {draft.currentLevel === 'B1+' && (
        <p aria-live="polite" className="text-body-sm text-light-on-surface-variant">
          Current level selected from your placement test: B1+
        </p>
      )}
      <PlacementTest
        onChooseAnother={() => onChange({ currentLevel: '', levelSource: 'self' })}
        onUseLevel={(level) => onChange({ currentLevel: level, levelSource: 'placement' })}
      />
    </section>
  )
}
