import { useEffect, useState } from 'react'
import type { Accent } from '../../types/onboarding'
import type { LearnerSettings } from '../../types/preferences'
import { Button } from '../ui'
import { SettingsSelect } from './SettingsControls'

interface VoiceSettingsProps {
  settings: LearnerSettings
  onChange: (changes: Partial<LearnerSettings>) => void
}

const accentOptions: Array<{ value: Accent; label: string }> = [
  { value: 'us', label: 'US English' },
  { value: 'uk', label: 'UK English' },
]
const previewSentence = 'Hi! Let’s practice a little English together.'

export function VoiceSettings({ settings, onChange }: VoiceSettingsProps) {
  const [voiceError, setVoiceError] = useState('')

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  function previewVoice() {
    setVoiceError('')
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setVoiceError('Speech preview is not supported in this browser.')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(previewSentence)
    utterance.lang = settings.preferences.accent === 'uk' ? 'en-GB' : 'en-US'
    utterance.onerror = () => setVoiceError('Could not play the voice preview. Please try again.')
    window.speechSynthesis.speak(utterance)
  }

  return (
    <section aria-labelledby="voice-heading" className="flex flex-col gap-gutter-md">
      <div>
        <h2 className="font-headline text-headline-md" id="voice-heading">Voice</h2>
        <p className="mt-1 text-body-md text-light-on-surface-variant">
          Choose the accent you want to hear during speaking practice.
        </p>
      </div>
      <div className="grid gap-gutter-md sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <SettingsSelect
          label="Preferred accent"
          onChange={(accent) => onChange({
            preferences: { ...settings.preferences, accent },
          })}
          options={accentOptions}
          value={settings.preferences.accent}
        />
        <Button onClick={previewVoice} type="button" variant="secondary">Preview</Button>
      </div>
      <p className="text-body-md italic text-light-on-surface-variant">“{previewSentence}”</p>
      {voiceError && <p className="text-body-sm text-light-error" role="alert">{voiceError}</p>}
    </section>
  )
}
