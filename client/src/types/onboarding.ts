export const onboardingLevels = ['A2', 'B1', 'B1+', 'B2', 'C1'] as const
export type OnboardingLevel = (typeof onboardingLevels)[number]

export const learningGoals = [
  'remote_job',
  'interviews',
  'toefl',
  'ielts',
  'daily_fluency',
  'read_docs',
] as const
export type LearningGoal = (typeof learningGoals)[number]

export const focusSkills = ['speaking', 'listening', 'writing', 'vocab_grammar'] as const
export type FocusSkill = (typeof focusSkills)[number]

export const softwareAreas = [
  'frontend',
  'backend',
  'fullstack',
  'data',
  'devops',
  'mobile',
  'qa',
  'other',
  'none',
] as const
export type SoftwareArea = (typeof softwareAreas)[number]

export type ExamTarget = 'toefl' | 'ielts' | 'none'
export type LevelSource = 'self' | 'placement' | 'ai_estimate'
export type CorrectionStyle = 'every_error' | 'major_errors' | 'end_of_session'
export type ExplanationLanguage = 'english_only' | 'spanish_support' | 'mixed'
export type TutorTone = 'friendly' | 'professional' | 'challenging'
export type ReplyLength = 'short' | 'medium' | 'detailed'
export type Accent = 'us' | 'uk'

export interface OnboardingStatus {
  completed: boolean
}

export interface LearnerPreferencesInput {
  goals: LearningGoal[]
  examTarget: ExamTarget
  examTargetScore: number | null
  examDate: string | null
  levelSource: LevelSource
  focusSkills: FocusSkill[]
  softwareArea: SoftwareArea
  interests: string[]
  aboutMe: string | null
  studyDays: number[]
  correctionStyle: CorrectionStyle
  explanationLanguage: ExplanationLanguage
  tone: TutorTone
  replyLength: ReplyLength
  accent: Accent
  saveTranscripts: boolean
}

export interface OnboardingDraft extends Omit<LearnerPreferencesInput, 'softwareArea'> {
  currentLevel: OnboardingLevel | ''
  targetLevel: OnboardingLevel | ''
  dailyGoalMinutes: number
  softwareArea: SoftwareArea | ''
}

export interface CompleteOnboardingInput {
  currentLevel: OnboardingLevel
  targetLevel: OnboardingLevel
  dailyGoalMinutes: number
  preferences: LearnerPreferencesInput
}

export interface PlacementQuestionOption {
  id: string
  text: string
}

export interface PlacementQuestion {
  id: string
  level: string
  skill: string
  prompt: string
  options: PlacementQuestionOption[]
}

export interface PlacementAnswer {
  questionId: string
  selectedOption: string
}

export interface PlacementResult {
  attemptId: string
  score: number
  estimatedLevel: OnboardingLevel
}
