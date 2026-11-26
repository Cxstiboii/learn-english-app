import { useMutation, useQueryClient } from '@tanstack/react-query'
import { evaluateSpeaking } from '../services/speaking'
import { progressKeys } from './useProgressSummary'

export function useEvaluateSpeaking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: evaluateSpeaking,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: progressKeys.summary }),
  })
}
