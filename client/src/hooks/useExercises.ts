import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { answerExercise, generateExercises, getWeakSpots } from '../services/exercises'

export const exerciseKeys = {
  weakSpots: ['exercises', 'weak-spots'] as const,
}

export function useWeakSpots() {
  return useQuery({ queryKey: exerciseKeys.weakSpots, queryFn: getWeakSpots })
}

export function useGenerateExercises() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: generateExercises,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exerciseKeys.weakSpots }),
  })
}

export function useAnswerExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, selectedOption }: { id: string; selectedOption: string }) =>
      answerExercise(id, selectedOption),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exerciseKeys.weakSpots }),
  })
}
