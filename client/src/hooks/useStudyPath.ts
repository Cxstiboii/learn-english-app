import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { completePathActivity, getStudyPath } from '../services/path'
import { progressKeys } from './useProgressSummary'

export const pathKeys = {
  units: ['path', 'units'] as const,
}

export function useStudyPath() {
  return useQuery({ queryKey: pathKeys.units, queryFn: getStudyPath })
}

export function useCompletePathActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: completePathActivity,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pathKeys.units }),
        queryClient.invalidateQueries({ queryKey: progressKeys.summary }),
      ])
    },
  })
}
