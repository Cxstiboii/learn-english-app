import { Router } from 'express'
import { z } from 'zod'
import { getHealth } from '../controllers/healthController.js'
import { supabaseAdmin } from '../config/supabase.js'
import { aiRateLimit } from '../middleware/aiRateLimit.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { chatWithTutor, toChatError } from '../services/chatService.js'
import { activityRouter } from './activity.js'
import { exercisesRouter } from './exercises.js'
import { interviewRouter } from './interview.js'
import { pathRouter } from './path.js'
import { progressRouter } from './progress.js'
import { speakingRouter } from './speaking.js'
import { vocabRouter } from './vocab.js'
import { writingRouter } from './writing.js'

export const apiRouter = Router()
const maxAIInputCharacters = 2000
const emptyQuerySchema = z.object({}).strict()

apiRouter.use((request, response, next) => {
  const query = emptyQuerySchema.safeParse(request.query)
  if (!query.success) {
    response.status(400).json({
      error: 'This endpoint does not accept query parameters.',
      details: query.error.flatten(),
    })
    return
  }
  next()
})

apiRouter.get('/health', getHealth)
apiRouter.use('/exercises', exercisesRouter)
apiRouter.use('/speaking', speakingRouter)
apiRouter.use('/writing', writingRouter)
apiRouter.use('/interview', interviewRouter)
apiRouter.use('/vocab', vocabRouter)
apiRouter.use('/activity', activityRouter)
apiRouter.use('/progress', progressRouter)
apiRouter.use('/path', pathRouter)

apiRouter.get('/me', requireAuth, async (request, response, next) => {
  if (!request.user) {
    response.status(401).json({ error: 'Authentication is required.' })
    return
  }

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, current_level, target_level, daily_goal_minutes, created_at')
      .eq('id', request.user.id)
      .maybeSingle()

    if (error) {
      next(error)
      return
    }

    if (!profile) {
      response.status(404).json({ error: 'Profile not found.' })
      return
    }

    response.json({ profile })
  } catch (error) {
    next(error)
  }
})

apiRouter.get('/conversations', requireAuth, async (request, response, next) => {
  const userId = request.user?.id
  if (!userId) {
    response.status(401).json({ error: 'Authentication is required.' })
    return
  }

  try {
    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      response.status(500).json({ error: 'Unable to load conversations.' })
      return
    }

    response.json({ conversations })
  } catch (error) {
    next(error)
  }
})

apiRouter.get('/conversations/:id/messages', requireAuth, async (request, response, next) => {
  const userId = request.user?.id
  const parsedId = z.string().uuid().safeParse(request.params.id)
  if (!userId) {
    response.status(401).json({ error: 'Authentication is required.' })
    return
  }
  if (!parsedId.success) {
    response.status(400).json({ error: 'A valid conversation ID is required.' })
    return
  }

  try {
    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('id', parsedId.data)
      .eq('user_id', userId)
      .maybeSingle()

    if (conversationError) {
      response.status(500).json({ error: 'Unable to load this conversation.' })
      return
    }
    if (!conversation) {
      response.status(404).json({ error: 'Conversation not found.' })
      return
    }

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('id, role, content, corrections, created_at')
      .eq('conversation_id', parsedId.data)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      response.status(500).json({ error: 'Unable to load conversation messages.' })
      return
    }

    response.json({ messages })
  } catch (error) {
    next(error)
  }
})

const chatRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(maxAIInputCharacters),
}).strict()

apiRouter.post('/chat', requireAuth, aiRateLimit, async (request, response, next) => {
  const userId = request.user?.id
  const input = chatRequestSchema.safeParse(request.body)

  if (!userId) {
    response.status(401).json({ error: 'Authentication is required.' })
    return
  }
  if (!input.success) {
    response.status(400).json({
      error: 'Invalid chat request.',
      details: input.error.flatten(),
    })
    return
  }

  try {
    const result = await chatWithTutor(
      userId,
      input.data.message,
      input.data.conversationId,
    )
    response.json(result)
  } catch (error) {
    const chatError = toChatError(error)
    if (chatError) {
      response.status(chatError.statusCode).json({
        error: chatError.message,
        code: chatError.code,
      })
      return
    }
    next(error)
  }
})
