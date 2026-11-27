import { Button, Card } from '../ui'
import type { OnboardingDraft } from '../../types/onboarding'
import type { ReactNode } from 'react'

interface SummaryStepProps {
  draft: OnboardingDraft
  onEdit: (stepIndex: number) => void
}

const stepNames = ['Goals', 'Level', 'Focus', 'Time & tutor']
const goalNames: Record<string, string> = {
  remote_job: 'Get a remote job',
  interviews: 'Feel confident in interviews',
  toefl: 'Prepare for TOEFL',
  ielts: 'Prepare for IELTS',
  daily_fluency: 'Speak more fluently every day',
  read_docs: 'Read technical documentation',
}
const areaNames: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Full-stack',
  data: 'Data',
  devops: 'DevOps',
  mobile: 'Mobile',
  qa: 'Quality assurance',
  other: 'Other',
  none: 'Not sure yet',
}
const skillNames: Record<string, string> = {
  speaking: 'Speaking',
  listening: 'Listening',
  writing: 'Writing',
  vocab_grammar: 'Vocabulary & grammar',
}
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function SummaryStep({ draft, onEdit }: SummaryStepProps) {
  const examTarget = draft.examTarget === 'none' ? 'No exam selected' : draft.examTarget.toUpperCase()

  return (
    <section aria-labelledby="summary-heading" className="flex flex-col gap-gutter-md">
      <div>
        <h2 className="font-headline text-headline-md" id="summary-heading">Your learning plan</h2>
        <p className="mt-1 text-body-md text-light-on-surface-variant">
          Review your choices. Select Edit to change any step.
        </p>
      </div>

      <SummaryCard title="Goals" stepIndex={0} onEdit={onEdit}>
        <p>{draft.goals.map((goal) => goalNames[goal]).join(', ')}</p>
        {draft.examTarget !== 'none' && (
          <p>
            Exam: {examTarget}
            {draft.examTargetScore !== null ? ` · Target score ${draft.examTargetScore}` : ''}
            {draft.examDate ? ` · ${draft.examDate}` : ''}
          </p>
        )}
      </SummaryCard>

      <SummaryCard title="Level" stepIndex={1} onEdit={onEdit}>
        <p>Current level: {draft.currentLevel}</p>
        <p>Target level: {draft.targetLevel}</p>
      </SummaryCard>

      <SummaryCard title="Focus" stepIndex={2} onEdit={onEdit}>
        <p>Software area: {areaNames[draft.softwareArea]}</p>
        <p>Priorities: {draft.focusSkills.map((skill) => skillNames[skill]).join(' → ')}</p>
        {draft.interests.length > 0 && <p>Interests: {draft.interests.join(', ')}</p>}
      </SummaryCard>

      <SummaryCard title="Time & tutor" stepIndex={3} onEdit={onEdit}>
        <p>{draft.dailyGoalMinutes} minutes per day · {draft.studyDays.map((day) => dayNames[day - 1]).join(', ')}</p>
        <p>
          {draft.correctionStyle.replaceAll('_', ' ')} · {draft.explanationLanguage.replaceAll('_', ' ')}
          {' · '}{draft.tone} tone · {draft.replyLength} replies · {draft.accent.toUpperCase()} accent
        </p>
        <p>Practice transcripts: {draft.saveTranscripts ? 'saved' : 'not saved'}</p>
      </SummaryCard>
    </section>
  )
}

interface SummaryCardProps {
  title: string
  stepIndex: number
  onEdit: (stepIndex: number) => void
  children: ReactNode
}

function SummaryCard({ title, stepIndex, onEdit, children }: SummaryCardProps) {
  return (
    <Card className="flex flex-wrap items-start justify-between gap-gutter-md" padding="md">
      <div className="min-w-0 flex-1">
        <h3 className="font-title text-title-md">{title}</h3>
        <div className="mt-1 space-y-1 break-words text-body-sm text-light-on-surface-variant">
          {children}
        </div>
      </div>
      <Button onClick={() => onEdit(stepIndex)} size="sm" variant="secondary">
        Edit {stepNames[stepIndex]}
      </Button>
    </Card>
  )
}
