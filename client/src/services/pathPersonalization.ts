import type { LearningGoal } from '../types/onboarding'
import type { LearnerSettings } from '../types/preferences'
import type { ActivityType, Unit } from '../types/path'

const goalKeywords: Record<LearningGoal, string[]> = {
  remote_job: ['remote', 'job', 'career', 'role', 'compensation', 'usd', 'empleo', 'remoto'],
  interviews: ['interview', 'entrevista', 'star', 'system design', 'negotiat', 'negoci'],
  toefl: ['toefl', 'exam', 'academic', 'writing', 'reading', 'speaking'],
  ielts: ['ielts', 'exam', 'academic', 'writing', 'reading', 'speaking'],
  daily_fluency: ['speaking', 'standup', 'fluency', 'conversation', 'hablar', 'conversación'],
  read_docs: ['documentation', 'docs', 'technical', 'reading', 'documentación'],
}

const areaKeywords: Record<string, string[]> = {
  frontend: ['frontend', 'front-end', 'ui', 'web', 'client'],
  backend: ['backend', 'back-end', 'api', 'server', 'database'],
  fullstack: ['full stack', 'frontend', 'backend', 'web'],
  data: ['data', 'analytics', 'database', 'query'],
  devops: ['devops', 'deployment', 'deploy', 'infrastructure', 'production'],
  mobile: ['mobile', 'ios', 'android', 'app'],
  qa: ['qa', 'test', 'testing', 'quality'],
  other: [],
  none: [],
}

const skillActivityTypes: Record<string, ActivityType[]> = {
  speaking: ['Speaking'],
  listening: ['Speaking', 'Vocabulario'],
  writing: ['Slack-Escritura'],
  vocab_grammar: ['Vocabulario'],
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en-US')
}

function levelFilter(level: string): 'a2' | 'b1' | 'b2' {
  if (level.startsWith('A2')) return 'a2'
  if (level.startsWith('B1')) return 'b1'
  return 'b2'
}

function getUnitAlignmentScore(unit: Unit, settings: LearnerSettings): number {
  const content = normalizeText(`${unit.title} ${unit.description}`)
  const currentFilter = levelFilter(settings.currentLevel)
  const targetFilter = levelFilter(settings.targetLevel)
  let score = unit.filterLevels.includes(targetFilter) ? 4 : 0
  if (unit.filterLevels.includes(currentFilter)) score += 2

  for (const goal of settings.preferences.goals) {
    if (goalKeywords[goal].some((keyword) => content.includes(normalizeText(keyword)))) {
      score += 3
    }
  }

  const areaTerms = areaKeywords[settings.preferences.softwareArea] ?? []
  if (areaTerms.some((keyword) => content.includes(normalizeText(keyword)))) score += 2
  if (settings.preferences.interests.some((interest) => {
    const normalizedInterest = normalizeText(interest.trim())
    return normalizedInterest.length > 1 && content.includes(normalizedInterest)
  })) score += 2

  return score
}

export function getRecommendedUnitIds(units: Unit[], settings: LearnerSettings): Set<string> {
  return new Set(
    units
      .map((unit) => ({ id: unit.id, number: unit.number, score: getUnitAlignmentScore(unit, settings) }))
      .filter(({ score }) => score > 0)
      .sort((first, second) => second.score - first.score || first.number - second.number)
      .slice(0, 3)
      .map(({ id }) => id),
  )
}

export function getPreferredActivityId(
  units: Unit[],
  focusSkills: LearnerSettings['preferences']['focusSkills'],
): string | null {
  const availableActivities = units.flatMap((unit) => unit.activities)
    .filter((activity) => activity.status !== 'upcoming' && activity.status !== 'completed')

  for (const skill of focusSkills) {
    const preferredTypes = skillActivityTypes[skill] ?? []
    const preferredActivity = availableActivities.find((activity) =>
      preferredTypes.includes(activity.type),
    )
    if (preferredActivity) return preferredActivity.id
  }
  return availableActivities[0]?.id ?? null
}

export function getFocusSkillLabels(
  focusSkills: LearnerSettings['preferences']['focusSkills'],
): string[] {
  const labels: Record<LearnerSettings['preferences']['focusSkills'][number], string> = {
    speaking: 'Speaking',
    listening: 'Listening',
    writing: 'Writing',
    vocab_grammar: 'Vocabulary & grammar',
  }
  return focusSkills.map((skill) => labels[skill])
}
