import { apiFetch } from './api'

export interface Conversation {
  id: string
  title: string | null
  created_at: string
}

export interface ChatCorrection {
  original: string
  corrected: string
  explanation: string
  category: string
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  corrections: ChatCorrection[]
  created_at: string
}

export interface NewVocabulary {
  term: string
  definition: string
  example: string
}

export interface TutorChatResponse {
  conversationId: string
  reply: string
  corrections: ChatCorrection[]
  newVocabulary: NewVocabulary[]
}

export interface ChatRequest {
  conversationId?: string
  message: string
}

export async function getConversations(): Promise<Conversation[]> {
  const result = await apiFetch<{ conversations: Conversation[] }>('/api/conversations')
  return result.conversations
}

export async function getConversationMessages(id: string): Promise<ConversationMessage[]> {
  const result = await apiFetch<{ messages: ConversationMessage[] }>(
    `/api/conversations/${encodeURIComponent(id)}/messages`,
  )
  return result.messages
}

export function sendTutorMessage(input: ChatRequest) {
  return apiFetch<TutorChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
