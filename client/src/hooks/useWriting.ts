import { useMutation, useQueryClient } from '@tanstack/react-query'
import { gradeWriting } from '../services/writing'
import { progressKeys } from './useProgressSummary'

export function useGradeWriting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gradeWriting,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: progressKeys.summary }),
  })
}
