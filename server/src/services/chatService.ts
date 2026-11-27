import { z } from 'zod'
import { supabaseAdmin } from '../config/supabase.js'
import {
  AIServiceError,
  generateJSON,
  type AIMessage,
} from './ai/aiClient.js'
import { buildLearnerContext, renderStudentText } from './learnerContext.js'
import { tutorChatSystemPrompt } from '../prompts/tutor.js'

const correctionSchema = z.object({
  original: z.string().trim().min(1).max(500),
  corrected: z.string().trim().min(1).max(500),
  explanation: z.string().trim().min(1).max(500),
  category: z.enum([
    'grammar',
    'vocabulary',
    'word_choice',
    'word_order',
    'article',
    'preposition',
    'tense',
    'spelling',
    'other',
  ]),
}).strict()

const vocabularySchema = z.object({
  term: z.string().trim().min(1).max(120),
  definition: z.string().trim().min(1).max(400),
  example: z.string().trim().min(1).max(400),
}).strict()

function hasAtMostFourSentences(reply: string) {
  const sentences = reply.match(/[.!?](?=\s|$)/g)?.length ?? 0
  return sentences <= 4
}

const tutorResponseSchema = z.object({
  reply: z.string().trim().min(1).max(1200).refine(
    hasAtMostFourSentences,
    'The tutor reply must contain no more than four sentences.',
  ),
  corrections: z.array(correctionSchema).max(8),
  newVocabulary: z.array(vocabularySchema).max(8),
}).strict()

export class ChatServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ChatServiceError'
  }
}

type ChatResult = z.infer<typeof tutorResponseSchema> & {
  conversationId: string
}

export function getChatTextForStorage(
  message: string,
  reply: string,
  saveTranscripts: boolean,
) {
  return saveTranscripts
    ? { userMessage: message, assistantReply: reply }
    : { userMessage: '', assistantReply: '' }
}

export async function chatWithTutor(
  userId: string,
  message: string,
  requestedConversationId?: string,
): Promise<ChatResult> {
  const learnerContext = await buildLearnerContext(userId)
  let conversationId = requestedConversationId
  let history: AIMessage[] = []

  if (conversationId) {
    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .maybeSingle()

    if (conversationError) {
      throw new ChatServiceError(500, 'CONVERSATION_LOOKUP_FAILED', 'Unable to load this conversation.')
    }
    if (!conversation) {
      throw new ChatServiceError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.')
    }

    if (learnerContext.saveTranscripts) {
      const { data: recentMessages, error: messagesError } = await supabaseAdmin
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (messagesError) {
        throw new ChatServiceError(500, 'MESSAGE_HISTORY_FAILED', 'Unable to load conversation history.')
      }

      history = (recentMessages ?? []).reverse().map(({ role, content }) => ({
        role: role === 'assistant' ? 'assistant' : 'user',
        content: renderStudentText(content),
      }))
    }
  }

  const generated = await generateJSON({
    system: tutorChatSystemPrompt(learnerContext),
    messages: [...history, { role: 'user', content: renderStudentText(message) }],
    schema: tutorResponseSchema,
    maxTokens: 1100,
  })

  if (!conversationId) {
    const { data: conversation, error: createError } = await supabaseAdmin
      .from('conversations')
      .insert({
        user_id: userId,
        title: learnerContext.saveTranscripts ? message.slice(0, 80) : 'Practice session',
      })
      .select('id')
      .single()

    if (createError || !conversation) {
      throw new ChatServiceError(500, 'CONVERSATION_CREATE_FAILED', 'Unable to create a conversation.')
    }
    conversationId = conversation.id
  }

  if (!conversationId) {
    throw new ChatServiceError(
      500,
      'CONVERSATION_ID_MISSING',
      'Unable to save this conversation. Please try again.',
    )
  }

  const storedText = getChatTextForStorage(
    message,
    generated.reply,
    learnerContext.saveTranscripts,
  )

  const { error: saveError } = await supabaseAdmin.rpc('save_chat_exchange', {
    p_user_id: userId,
    p_conversation_id: conversationId,
    p_user_message: storedText.userMessage,
    p_assistant_reply: storedText.assistantReply,
    p_corrections: generated.corrections,
    p_minutes: 1,
    p_save_transcripts: learnerContext.saveTranscripts,
  })

  if (saveError) {
    throw new ChatServiceError(
      500,
      'CHAT_SAVE_FAILED',
      'The tutor replied, but the conversation could not be saved. Please try again.',
    )
  }

  return { conversationId, ...generated }
}

export function toChatError(error: unknown): AIServiceError | ChatServiceError | undefined {
  return error instanceof AIServiceError || error instanceof ChatServiceError
    ? error
    : undefined
}
