import { useMutation, useQueryClient } from '@tanstack/react-query'
import { evaluateInterview } from '../services/interview'
import type { InterviewAnswer, InterviewTrack } from '../types/interview'
import { progressKeys } from './useProgressSummary'

export function useEvaluateInterview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      answers,
      track,
      idempotencyKey,
    }: {
      answers: InterviewAnswer[]
      track: InterviewTrack
      idempotencyKey: string
    }) => evaluateInterview(answers, track, idempotencyKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: progressKeys.summary }),
  })
}
