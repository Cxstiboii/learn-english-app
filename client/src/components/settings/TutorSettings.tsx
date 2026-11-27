import type { LearnerSettings } from '../../types/preferences'
import type {
  CorrectionStyle,
  ExplanationLanguage,
  ReplyLength,
  TutorTone,
} from '../../types/onboarding'
import { SettingsSelect } from './SettingsControls'

interface TutorSettingsProps {
  settings: LearnerSettings
  onChange: (changes: Partial<LearnerSettings>) => void
}

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

export function TutorSettings({ settings, onChange }: TutorSettingsProps) {
  const preferences = settings.preferences

  function updatePreference<K extends keyof typeof preferences>(
    key: K,
    value: (typeof preferences)[K],
  ) {
    onChange({ preferences: { ...preferences, [key]: value } })
  }

  return (
    <section aria-labelledby="tutor-heading" className="flex flex-col gap-gutter-md">
      <div>
        <h2 className="font-headline text-headline-md" id="tutor-heading">Tutor</h2>
        <p className="mt-1 text-body-md text-light-on-surface-variant">
          Choose how your tutor should guide and correct you.
        </p>
      </div>
      <div className="grid gap-gutter-md sm:grid-cols-2">
        <SettingsSelect
          label="When should I correct you?"
          onChange={(value) => updatePreference('correctionStyle', value)}
          options={correctionOptions}
          value={preferences.correctionStyle}
        />
        <SettingsSelect
          label="Explanation language"
          onChange={(value) => updatePreference('explanationLanguage', value)}
          options={languageOptions}
          value={preferences.explanationLanguage}
        />
        <SettingsSelect
          label="Tutor tone"
          onChange={(value) => updatePreference('tone', value)}
          options={toneOptions}
          value={preferences.tone}
        />
        <SettingsSelect
          label="Reply length"
          onChange={(value) => updatePreference('replyLength', value)}
          options={replyOptions}
          value={preferences.replyLength}
        />
      </div>
    </section>
  )
}
