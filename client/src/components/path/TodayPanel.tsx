import { useEffect, useState } from 'react'
import type { Activity, Unit } from '../../types/path'
import type { Accent, FocusSkill } from '../../types/onboarding'
import { Badge, Button, Card } from '../ui'

interface TodayPanelProps {
  activity: Activity
  unit: Unit
  onPractice: (activity: Activity) => void
  onComplete: () => void
  isCompleting?: boolean
  accent?: Accent
  dailyGoalMinutes?: number
  focusSkills?: FocusSkill[]
}

const activityTypeLabels = {
  Vocabulario: 'Vocabulario',
  Speaking: 'Speaking',
  'Slack-Escritura': 'Slack / Escritura',
} as const

const focusSkillLabels: Record<FocusSkill, string> = {
  speaking: 'Speaking',
  listening: 'Listening',
  writing: 'Writing',
  vocab_grammar: 'Vocabulary & grammar',
}

export function TodayPanel({
  activity,
  unit,
  onPractice,
  onComplete,
  isCompleting = false,
  accent,
  dailyGoalMinutes,
  focusSkills = [],
}: TodayPanelProps) {
  const [audioNotice, setAudioNotice] = useState({ activityId: '', message: '' })
  const audioStatus = audioNotice.activityId === activity.id ? audioNotice.message : ''
  const isCompleted = activity.status === 'completed'
  const badgeLabel = isCompleted
    ? `Completada · ${activity.durationMinutes} min`
    : activity.status === 'active'
      ? `Hoy · ${activity.durationMinutes} min`
      : `Disponible · ${activity.durationMinutes} min`

  useEffect(() => {
    return () => window.speechSynthesis?.cancel()
  }, [activity.id])

  function showAudioStatus(message: string) {
    setAudioNotice({ activityId: activity.id, message })
  }

  function playPhrase() {
    if (typeof window.speechSynthesis === 'undefined' ||
        typeof SpeechSynthesisUtterance === 'undefined') {
      showAudioStatus('La reproducción de voz no está disponible en este navegador.')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(activity.phrase)
    const locale = accent === 'uk' ? 'en-GB' : 'en-US'
    utterance.lang = locale
    const voice = window.speechSynthesis
      .getVoices()
      .find((availableVoice) => availableVoice.lang.toLowerCase().startsWith(locale.toLowerCase()))
    if (voice) utterance.voice = voice

    utterance.onstart = () => showAudioStatus('Reproduciendo pronunciación en inglés…')
    utterance.onend = () => showAudioStatus('Audio finalizado.')
    utterance.onerror = () =>
      showAudioStatus('No se pudo reproducir el audio. Inténtalo de nuevo.')

    try {
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      showAudioStatus(
        error instanceof Error
          ? `No se pudo reproducir el audio: ${error.message}`
          : 'No se pudo reproducir el audio. Inténtalo de nuevo.',
      )
    }
  }

  return (
    <Card
      aria-labelledby="today-panel-title"
      className="flex flex-col gap-gutter-md"
      padding="lg"
      role="region"
    >
      <header className="flex flex-col gap-gutter-sm border-b border-light-outline-variant pb-gutter-md">
        <div className="flex items-center justify-between gap-gutter-sm">
          <Badge variant={isCompleted ? 'success' : activity.status === 'active' ? 'warning' : 'neutral'}>
            {badgeLabel}
          </Badge>
          <span className="shrink-0 font-mono text-label-sm text-light-on-surface-variant">
            {activityTypeLabels[activity.type]}
          </span>
        </div>
        <h2 className="font-headline text-headline-md text-balance text-light-on-surface" id="today-panel-title">
          {activity.title}
        </h2>
        <p className="font-body text-body-sm text-light-on-surface-variant">
          Unidad {String(unit.number).padStart(2, '0')} · Nivel {unit.level}
        </p>
      </header>

      {dailyGoalMinutes !== undefined && (
        <section aria-label="Today's study plan" className="flex flex-col gap-1 rounded-default border border-light-outline-variant bg-light-surface-container-low p-gutter-sm">
          <p className="font-label text-label-md text-light-on-surface">
            Daily target: {dailyGoalMinutes} minutes
          </p>
          {focusSkills.length > 0 && (
            <p className="font-body text-body-sm text-light-on-surface-variant">
              Priority: {focusSkills.map((skill) => focusSkillLabels[skill]).join(' → ')}
            </p>
          )}
        </section>
      )}

      <div className="flex flex-col gap-gutter-md">
        <section className="flex flex-col gap-gutter-sm rounded-default border border-light-outline-variant bg-light-surface-container-low p-gutter-md">
          <div className="flex items-center justify-between gap-gutter-sm">
            <h3 className="font-mono text-label-sm text-light-on-surface-variant">
              Frase modelo en inglés
            </h3>
            <Button
              aria-label="Escuchar pronunciación de la frase modelo"
              className="size-8 shrink-0 rounded-md border border-light-outline-variant bg-light-surface-container-lowest p-1.5 text-light-on-surface hover:bg-light-surface-container-high"
              disabled={!accent}
              onClick={playPhrase}
              size="icon"
              variant="secondary"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-body-lg">
                volume_up
              </span>
            </Button>
          </div>
          <p className="font-mono text-mono-md leading-relaxed text-light-on-surface">
            “{activity.phrase}”
          </p>
          <p aria-live="polite" className="min-h-4 font-mono text-label-sm text-light-primary">
            {audioStatus}
          </p>
        </section>

        <section className="flex flex-col gap-gutter-xs">
          <h3 className="font-label text-label-md text-light-on-surface">
            Clave práctica
          </h3>
          <p className="font-body text-body-sm text-pretty text-light-on-surface-variant">
            {activity.practiceKey}
          </p>
        </section>
      </div>

      <footer className="flex flex-wrap justify-between gap-gutter-sm border-t border-light-outline-variant pt-gutter-md">
        <Button className="flex-1" onClick={() => onPractice(activity)}>
          <span aria-hidden="true" className="material-symbols-outlined text-body-lg">
            play_arrow
          </span>
          Practicar
        </Button>
        <Button disabled={isCompleted || isCompleting} onClick={onComplete} variant="secondary">
          <span aria-hidden="true" className="material-symbols-outlined text-body-lg">
            check
          </span>
          {isCompleting ? 'Guardando…' : 'Hecho'}
        </Button>
      </footer>
    </Card>
  )
}
