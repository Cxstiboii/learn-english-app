import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  completeOnboarding,
  getOnboardingStatus,
  getPlacementQuestions,
  submitPlacementAnswers,
} from '../services/onboarding'
import type { CompleteOnboardingInput, PlacementAnswer } from '../types/onboarding'
import { useAuth } from './useAuth'

export const onboardingKeys = {
  status: (userId: string | null) => ['onboarding', 'status', userId] as const,
  placementQuestions: ['placement', 'questions'] as const,
}

export function useOnboardingStatus() {
  const { user } = useAuth()
  return useQuery({
    queryKey: onboardingKeys.status(user?.id ?? null),
    queryFn: getOnboardingStatus,
    enabled: Boolean(user),
  })
}

export function useCompleteOnboarding() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CompleteOnboardingInput) => completeOnboarding(input),
    onSuccess: () => {
      if (user) {
        queryClient.setQueryData(onboardingKeys.status(user.id), { completed: true })
      }
    },
  })
}

export function usePlacementQuestions(isEnabled: boolean) {
  return useQuery({
    queryKey: onboardingKeys.placementQuestions,
    queryFn: getPlacementQuestions,
    enabled: isEnabled,
  })
}

export function useSubmitPlacementAnswers() {
  return useMutation({
    mutationFn: (answers: PlacementAnswer[]) => submitPlacementAnswers(answers),
  })
}
