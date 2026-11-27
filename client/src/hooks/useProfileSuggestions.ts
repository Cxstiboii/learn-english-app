import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acceptProfileSuggestion,
  dismissProfileSuggestion,
  getProfileSuggestions,
} from '../services/profileSuggestions'

export const profileSuggestionKeys = {
  list: ['profile-suggestions'] as const,
}

export function useProfileSuggestions() {
  return useQuery({
    queryKey: profileSuggestionKeys.list,
    queryFn: getProfileSuggestions,
  })
}

export function useAcceptProfileSuggestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: acceptProfileSuggestion,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileSuggestionKeys.list }),
        queryClient.invalidateQueries({ queryKey: ['preferences'] }),
        queryClient.invalidateQueries({ queryKey: ['progress', 'summary'] }),
      ])
    },
  })
}

export function useDismissProfileSuggestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: dismissProfileSuggestion,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: profileSuggestionKeys.list,
    }),
  })
}
