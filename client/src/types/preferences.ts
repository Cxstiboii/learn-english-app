import type { OnboardingLevel, LearnerPreferencesInput } from './onboarding'

export interface LearnerSettings {
  currentLevel: OnboardingLevel
  targetLevel: OnboardingLevel
  dailyGoalMinutes: number
  preferences: LearnerPreferencesInput
}
