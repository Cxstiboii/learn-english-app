import type { LearnerSettings } from '../../types/preferences'

interface PrivacySettingsProps {
  settings: LearnerSettings
  onChange: (changes: Partial<LearnerSettings>) => void
}

export function PrivacySettings({ settings, onChange }: PrivacySettingsProps) {
  const isEnabled = settings.preferences.saveTranscripts

  return (
    <section aria-labelledby="privacy-heading" className="flex flex-col gap-gutter-md">
      <div>
        <h2 className="font-headline text-headline-md" id="privacy-heading">Privacy</h2>
        <p className="mt-1 text-body-md text-light-on-surface-variant">
          Control whether your practice transcripts are saved to your account.
        </p>
      </div>
      <div className="flex items-center justify-between gap-gutter-md rounded-default border border-light-outline-variant p-gutter-md">
        <div>
          <h3 className="font-title text-title-sm">Save my transcripts</h3>
          <p className="mt-1 text-body-sm text-light-on-surface-variant">
            Saved transcripts help you review your practice later.
          </p>
        </div>
        <button
          aria-checked={isEnabled}
          aria-label="Save my transcripts"
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary ${isEnabled ? 'bg-light-primary' : 'bg-light-outline-variant'}`}
          onClick={() => onChange({
            preferences: { ...settings.preferences, saveTranscripts: !isEnabled },
          })}
          role="switch"
          type="button"
        >
          <span
            aria-hidden="true"
            className={`absolute top-1 size-5 rounded-full bg-light-surface transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>
    </section>
  )
}
