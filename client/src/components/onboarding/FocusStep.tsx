import { useState } from 'react'
import { Button, Input } from '../ui'
import type { FocusSkill, OnboardingDraft, SoftwareArea } from '../../types/onboarding'

interface FocusStepProps {
  draft: OnboardingDraft
  onChange: (changes: Partial<OnboardingDraft>) => void
}

const softwareOptions: Array<{ value: SoftwareArea; label: string }> = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'fullstack', label: 'Full-stack' },
  { value: 'data', label: 'Data' },
  { value: 'devops', label: 'DevOps' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'qa', label: 'Quality assurance' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'I am not sure yet' },
]

const skillLabels: Record<FocusSkill, string> = {
  speaking: 'Speaking',
  listening: 'Listening',
  writing: 'Writing',
  vocab_grammar: 'Vocabulary & grammar',
}

export function FocusStep({ draft, onChange }: FocusStepProps) {
  const [interestInput, setInterestInput] = useState('')
  const [interestError, setInterestError] = useState('')

  function addInterest() {
    const interest = interestInput.trim()
    if (!interest) return
    if (draft.interests.length >= 5) {
      setInterestError('You can add up to five interests.')
      return
    }
    if (draft.interests.some((item) => item.toLowerCase() === interest.toLowerCase())) {
      setInterestError('That interest is already on your list.')
      return
    }
    onChange({ interests: [...draft.interests, interest] })
    setInterestInput('')
    setInterestError('')
  }

  function moveSkill(skill: FocusSkill, direction: -1 | 1) {
    const index = draft.focusSkills.indexOf(skill)
    const destination = index + direction
    if (destination < 0 || destination >= draft.focusSkills.length) return

    const reordered = [...draft.focusSkills]
    const [selectedSkill] = reordered.splice(index, 1)
    reordered.splice(destination, 0, selectedSkill)
    onChange({ focusSkills: reordered })
  }

  return (
    <section aria-labelledby="focus-heading" className="flex flex-col gap-gutter-md">
      <div>
        <h2 className="font-headline text-headline-md" id="focus-heading">Make it relevant to you</h2>
        <p className="mt-1 text-body-md text-light-on-surface-variant">
          Choose your software area, then rank the skills you want to practice most.
        </p>
      </div>

      <label className="flex max-w-xl flex-col gap-1 text-label-md">
        Software area
        <select
          className="min-h-11 rounded-md border border-light-outline-variant bg-light-surface-container-lowest px-3 text-body-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary"
          onChange={(event) => {
            const option = softwareOptions.find(({ value }) => value === event.target.value)
            if (option) onChange({ softwareArea: option.value })
          }}
          value={draft.softwareArea}
        >
          <option disabled value="">Choose an area</option>
          {softwareOptions.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>

      <div className="flex max-w-xl flex-col gap-gutter-xs">
        <label className="text-label-md" htmlFor="interest-input">Interests (optional, up to 5)</label>
        <div className="flex gap-gutter-sm">
          <Input
            id="interest-input"
            maxLength={80}
            onChange={(event) => setInterestInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addInterest()
              }
            }}
            placeholder="e.g. cybersecurity, gaming"
            value={interestInput}
          />
          <Button
            disabled={!interestInput.trim() || draft.interests.length >= 5}
            onClick={addInterest}
            variant="secondary"
          >
            Add
          </Button>
        </div>
        {interestError && <p className="text-body-sm text-light-error" role="alert">{interestError}</p>}
        {draft.interests.length > 0 && (
          <ul aria-label="Your interests" className="flex flex-wrap gap-gutter-xs">
            {draft.interests.map((interest) => (
              <li key={interest}>
                <button
                  aria-label={`Remove ${interest}`}
                  className="rounded-full border border-light-outline-variant px-3 py-1 text-body-sm hover:bg-light-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary"
                  onClick={() => onChange({
                    interests: draft.interests.filter((item) => item !== interest),
                  })}
                  type="button"
                >
                  {interest} <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="font-title text-title-md">Rank your focus skills</h3>
        <p className="text-body-sm text-light-on-surface-variant">
          Use the buttons to move skills up or down. First is your top priority.
        </p>
        <ol aria-label="Skill priorities" className="mt-gutter-sm flex max-w-xl flex-col gap-gutter-xs">
          {draft.focusSkills.map((skill, index) => (
            <li
              aria-posinset={index + 1}
              aria-setsize={draft.focusSkills.length}
              className="flex items-center justify-between gap-gutter-sm rounded-md border border-light-outline-variant px-gutter-sm py-2"
              key={skill}
            >
              <span><span className="mr-2 text-light-on-surface-variant">{index + 1}.</span>{skillLabels[skill]}</span>
              <div className="flex gap-1">
                <Button
                  aria-label={`Move ${skillLabels[skill]} up`}
                  disabled={index === 0}
                  onClick={() => moveSkill(skill, -1)}
                  size="sm"
                  variant="secondary"
                >
                  Move up
                </Button>
                <Button
                  aria-label={`Move ${skillLabels[skill]} down`}
                  disabled={index === draft.focusSkills.length - 1}
                  onClick={() => moveSkill(skill, 1)}
                  size="sm"
                  variant="secondary"
                >
                  Move down
                </Button>
              </div>
            </li>
          ))}
        </ol>
        <p aria-live="polite" className="sr-only">
          Priority order: {draft.focusSkills.map((skill) => skillLabels[skill]).join(', ')}
        </p>
      </div>
    </section>
  )
}
