import { useState, type FormEvent } from 'react'
import type { SoftwareArea } from '../../types/onboarding'
import type { LearnerSettings } from '../../types/preferences'
import { Button } from '../ui'
import { SettingsSelect, settingsInputClass } from './SettingsControls'

interface InterestsSettingsProps {
  settings: LearnerSettings
  onChange: (changes: Partial<LearnerSettings>) => void
}

const areaOptions: Array<{ value: SoftwareArea; label: string }> = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'fullstack', label: 'Full stack' },
  { value: 'data', label: 'Data' },
  { value: 'devops', label: 'DevOps' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'qa', label: 'QA' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'Not specified' },
]

export function InterestsSettings({ settings, onChange }: InterestsSettingsProps) {
  const [newInterest, setNewInterest] = useState('')
  const preferences = settings.preferences

  function updatePreferences(changes: Partial<typeof preferences>) {
    onChange({ preferences: { ...preferences, ...changes } })
  }

  function addInterest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const interest = newInterest.trim()
    if (
      !interest
      || interest.length > 80
      || preferences.interests.length >= 5
      || preferences.interests.some((item) => item.toLowerCase() === interest.toLowerCase())
    ) return
    updatePreferences({ interests: [...preferences.interests, interest] })
    setNewInterest('')
  }

  return (
    <section aria-labelledby="interests-heading" className="flex flex-col gap-gutter-md">
      <div>
        <h2 className="font-headline text-headline-md" id="interests-heading">Interests</h2>
        <p className="mt-1 text-body-md text-light-on-surface-variant">
          Help your tutor make examples relevant to your work and interests.
        </p>
      </div>
      <SettingsSelect
        label="Area of software"
        onChange={(softwareArea) => updatePreferences({ softwareArea })}
        options={areaOptions}
        value={preferences.softwareArea}
      />
      <div className="flex flex-col gap-gutter-xs">
        <span className="font-label text-label-md" id="interests-label">Interests (up to 5)</span>
        <form className="flex flex-col gap-gutter-xs sm:flex-row" onSubmit={addInterest}>
          <input
            aria-describedby="interests-label"
            aria-label="Add an interest"
            className={settingsInputClass}
            maxLength={80}
            onChange={(event) => setNewInterest(event.target.value)}
            placeholder="e.g. open source, AI"
            value={newInterest}
          />
          <Button disabled={!newInterest.trim() || preferences.interests.length >= 5} type="submit" variant="secondary">
            Add
          </Button>
        </form>
        {preferences.interests.length > 0 && (
          <ul aria-label="Your interests" className="flex flex-wrap gap-gutter-xs">
            {preferences.interests.map((interest) => (
              <li className="inline-flex items-center gap-2 rounded-sm border border-light-outline-variant bg-light-surface-container-low px-2.5 py-1 text-body-sm" key={interest}>
                {interest}
                <button
                  aria-label={`Remove ${interest}`}
                  className="rounded-sm font-label text-label-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary"
                  onClick={() => updatePreferences({
                    interests: preferences.interests.filter((item) => item !== interest),
                  })}
                  type="button"
                >×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <label className="flex flex-col gap-1 font-label text-label-md">
        About me
        <textarea
          className="min-h-28 resize-y rounded-md border border-light-outline-variant bg-light-surface-container-lowest px-3 py-2 font-body text-body-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary"
          maxLength={200}
          onChange={(event) => updatePreferences({ aboutMe: event.target.value || null })}
          value={preferences.aboutMe ?? ''}
        />
        <span aria-live="polite" className="text-right font-mono text-label-sm text-light-on-surface-variant">
          {(preferences.aboutMe ?? '').length}/200
        </span>
      </label>
    </section>
  )
}
