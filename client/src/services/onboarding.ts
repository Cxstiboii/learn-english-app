import { apiFetch } from './api'
import type {
  CompleteOnboardingInput,
  OnboardingStatus,
  PlacementAnswer,
  PlacementQuestion,
  PlacementResult,
} from '../types/onboarding'

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  return apiFetch<OnboardingStatus>('/api/onboarding/status')
}

export async function completeOnboarding(input: CompleteOnboardingInput): Promise<void> {
  await apiFetch<{ completed: boolean }>('/api/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function getPlacementQuestions(): Promise<PlacementQuestion[]> {
  const result = await apiFetch<{ questions: PlacementQuestion[] }>('/api/placement/questions')
  return result.questions
}

export function submitPlacementAnswers(answers: PlacementAnswer[]): Promise<PlacementResult> {
  return apiFetch<PlacementResult>('/api/placement/attempts', {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
}
