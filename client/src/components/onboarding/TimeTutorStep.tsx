import { Input } from '../ui'
import type {
  Accent,
  CorrectionStyle,
  ExplanationLanguage,
  OnboardingDraft,
  ReplyLength,
  TutorTone,
} from '../../types/onboarding'

interface TimeTutorStepProps {
  draft: OnboardingDraft
  onChange: (changes: Partial<OnboardingDraft>) => void
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

const correctionOptions: Array<{ value: CorrectionStyle; label: string }> = [
  { value: 'every_error', label: 'Correct every error' },
  { value: 'major_errors', label: 'Correct important errors' },
  { value: 'end_of_session', label: 'Give corrections at the end' },
]
const languageOptions: Array<{ value: ExplanationLanguage; label: string }> = [
  { value: 'english_only', label: 'English only' },
  { value: 'spanish_support', label: 'English with Spanish support' },
  { value: 'mixed', label: 'A mix of English and Spanish' },
]
const toneOptions: Array<{ value: TutorTone; label: string }> = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'challenging', label: 'Challenging' },
]
const replyOptions: Array<{ value: ReplyLength; label: string }> = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'detailed', label: 'Detailed' },
]
const accentOptions: Array<{ value: Accent; label: string }> = [
  { value: 'us', label: 'US English' },
  { value: 'uk', label: 'UK English' },
]

export function TimeTutorStep({ draft, onChange }: TimeTutorStepProps) {
  function toggleStudyDay(day: number) {
    const days = draft.studyDays.includes(day)
      ? draft.studyDays.filter((selectedDay) => selectedDay !== day)
      : [...draft.studyDays, day].sort((first, second) => first - second)
    onChange({ studyDays: days })
  }

  return (
    <section aria-labelledby="time-heading" className="flex flex-col gap-gutter-lg">
      <div>
        <h2 className="font-headline text-headline-md" id="time-heading">Set your routine and tutor style</h2>
        <p className="mt-1 text-body-md text-light-on-surface-variant">
          You can change these preferences any time.
        </p>
      </div>

      <div className="grid gap-gutter-lg md:grid-cols-2">
        <div className="flex flex-col gap-gutter-md">
          <label className="flex max-w-sm flex-col gap-1 font-title text-title-sm">
            Minutes per day
            <Input
              max={1440}
              min={5}
              onChange={(event) => onChange({ dailyGoalMinutes: Number(event.target.value) })}
              step={5}
              type="number"
              value={draft.dailyGoalMinutes}
            />
          </label>
          <fieldset>
            <legend className="mb-gutter-xs font-title text-title-sm">Study days</legend>
            <div className="flex flex-wrap gap-gutter-xs">
              {studyDays.map(({ value, label }) => (
                <label
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-light-outline-variant px-3 focus-within:ring-2 focus-within:ring-light-primary"
                  key={value}
                >
                  <input
                    checked={draft.studyDays.includes(value)}
                    className="size-4 accent-light-primary"
                    onChange={() => toggleStudyDay(value)}
                    type="checkbox"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-gutter-sm">
            <input
              checked={draft.saveTranscripts}
              className="size-4 accent-light-primary"
              onChange={(event) => onChange({ saveTranscripts: event.target.checked })}
              type="checkbox"
            />
            <span className="text-body-md">Save my practice transcripts</span>
          </label>
        </div>

        <div className="grid gap-gutter-md sm:grid-cols-2">
          <SelectField
            label="When should I correct you?"
            onChange={(value) => onChange({ correctionStyle: value })}
            options={correctionOptions}
            value={draft.correctionStyle}
          />
          <SelectField
            label="Explanation language"
            onChange={(value) => onChange({ explanationLanguage: value })}
            options={languageOptions}
            value={draft.explanationLanguage}
          />
          <SelectField
            label="Tutor tone"
            onChange={(value) => onChange({ tone: value })}
            options={toneOptions}
            value={draft.tone}
          />
          <SelectField
            label="Reply length"
            onChange={(value) => onChange({ replyLength: value })}
            options={replyOptions}
            value={draft.replyLength}
          />
          <SelectField
            label="Preferred accent"
            onChange={(value) => onChange({ accent: value })}
            options={accentOptions}
            value={draft.accent}
          />
        </div>
      </div>
    </section>
  )
}

interface SelectFieldProps<Value extends string> {
  label: string
  options: Array<{ value: Value; label: string }>
  value: Value
  onChange: (value: Value) => void
}

function SelectField<Value extends string>({
  label,
  options,
  value,
  onChange,
}: SelectFieldProps<Value>) {
  return (
    <label className="flex flex-col gap-1 text-label-md">
      {label}
      <select
        className="min-h-11 rounded-md border border-light-outline-variant bg-light-surface-container-lowest px-3 text-body-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary"
        onChange={(event) => {
          const option = options.find((item) => item.value === event.target.value)
          if (option) onChange(option.value)
        }}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
