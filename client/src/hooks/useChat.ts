import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getConversationMessages,
  getConversations,
  sendTutorMessage,
} from '../services/chat'
import { progressKeys } from './useProgressSummary'

export const chatKeys = {
  conversations: ['chat', 'conversations'] as const,
  messages: (id: string) => ['chat', 'messages', id] as const,
}

export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations,
    queryFn: getConversations,
  })
}

export function useConversationMessages(id: string | null) {
  return useQuery({
    queryKey: chatKeys.messages(id ?? ''),
    queryFn: () => getConversationMessages(id!),
    enabled: Boolean(id),
  })
}

export function useSendTutorMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sendTutorMessage,
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: chatKeys.conversations }),
        queryClient.invalidateQueries({ queryKey: chatKeys.messages(result.conversationId) }),
        queryClient.invalidateQueries({ queryKey: progressKeys.summary }),
      ])
    },
  })
}
