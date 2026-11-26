import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createVocabCard,
  generateVocabCards,
  getDueCards,
  getVocabStats,
  reviewVocabCard,
} from '../services/vocab'

export const vocabKeys = {
  due: ['vocab', 'due'] as const,
  stats: ['vocab', 'stats'] as const,
}

export function useDueCards() {
  return useQuery({ queryKey: vocabKeys.due, queryFn: getDueCards })
}

export function useVocabStats() {
  return useQuery({ queryKey: vocabKeys.stats, queryFn: getVocabStats })
}

export function useReviewCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: Parameters<typeof reviewVocabCard>[1] }) =>
      reviewVocabCard(id, rating),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: vocabKeys.due }),
        queryClient.invalidateQueries({ queryKey: vocabKeys.stats }),
      ])
    },
  })
}

export function useCreateVocabCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createVocabCard,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: vocabKeys.due }),
        queryClient.invalidateQueries({ queryKey: vocabKeys.stats }),
      ])
    },
  })
}

export function useGenerateVocabCards() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: generateVocabCards,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: vocabKeys.due }),
        queryClient.invalidateQueries({ queryKey: vocabKeys.stats }),
      ])
    },
  })
}
