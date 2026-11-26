import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getProgressSummary, logActivity } from '../services/progress'

export const progressKeys = {
  summary: ['progress', 'summary'] as const,
}

export function useProgressSummary() {
  return useQuery({ queryKey: progressKeys.summary, queryFn: getProgressSummary })
}

export function useLogActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logActivity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: progressKeys.summary }),
  })
}
