import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Activity, Unit } from '../../types/path'
import { TodayPanel } from './TodayPanel'

describe('TodayPanel', () => {
  it('uses the selected UK accent for the model phrase', async () => {
    class FakeSpeechSynthesisUtterance {
      lang = ''
      text: string

      constructor(text: string) {
        this.text = text
      }
    }

    Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: FakeSpeechSynthesisUtterance,
    })
    const speak = vi.mocked(window.speechSynthesis.speak)
    const user = userEvent.setup()

    render(
      <TodayPanel
        activity={activity}
        accent="uk"
        dailyGoalMinutes={30}
        focusSkills={['speaking', 'writing']}
        onComplete={() => undefined}
        onPractice={() => undefined}
        unit={unit}
      />,
    )

    expect(screen.getByText('Daily target: 30 minutes')).toBeInTheDocument()
    expect(screen.getByText('Priority: Speaking → Writing')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Escuchar pronunciación de la frase modelo' }))

    expect(speak).toHaveBeenCalledOnce()
    expect(speak.mock.calls[0]?.[0].lang).toBe('en-GB')
  })
})

const activity: Activity = {
  id: 'activity-1',
  title: 'Practice introducing a technical project',
  type: 'Speaking',
  durationMinutes: 10,
  phrase: 'I built a service to process events.',
  practiceKey: 'Describe the service and its impact.',
  status: 'active',
  completedAt: null,
}

const unit: Unit = {
  id: 'unit-1',
  number: 1,
  level: 'B1',
  filterLevels: ['b1'],
  title: 'Technical introductions',
  description: 'Talk about your work.',
  status: 'En curso',
  progress: {
    completedActivities: 0,
    totalActivities: 1,
    percentage: 0,
  },
  activities: [activity],
}
