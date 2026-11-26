import { z } from 'zod'
import { supabaseAdmin } from '../config/supabase.js'
import { vocabSystemPrompt } from '../prompts/vocab.js'
import { AIServiceError, generateJSON } from './ai/aiClient.js'
import { calculateSM2, type ReviewRating } from './srs.js'

const profileLevelSchema = z.enum(['A1', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'C1', 'C2'])

const generatedCardSchema = z.object({
  term: z.string().trim().min(1).max(120),
  definition: z.string().trim().min(1).max(1000),
  example: z.string().trim().min(1).max(1000),
}).strict()

export class VocabServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'VocabServiceError'
  }
}

function isDuplicateError(error: { code?: string }) {
  return error.code === '23505'
}

function normalizeTerm(term: string) {
  return term.trim().toLocaleLowerCase('en-US')
}

export async function getDueCards(userId: string) {
  const { data: cards, error } = await supabaseAdmin
    .from('vocab_cards')
    .select('*')
    .eq('user_id', userId)
    .lte('due_at', new Date().toISOString())
    .order('due_at', { ascending: true })

  if (error) {
    throw new VocabServiceError(500, 'VOCAB_DUE_LOOKUP_FAILED', 'Unable to load due vocabulary cards.')
  }
  return cards
}

export async function reviewCard(userId: string, cardId: string, rating: ReviewRating) {
  const { data: card, error: cardError } = await supabaseAdmin
    .from('vocab_cards')
    .select('id, term, definition, example, deck, ease_factor, interval_days, repetitions, due_at, created_at')
    .eq('id', cardId)
    .eq('user_id', userId)
    .maybeSingle()

  if (cardError) {
    throw new VocabServiceError(500, 'VOCAB_CARD_LOOKUP_FAILED', 'Unable to load this vocabulary card.')
  }
  if (!card) {
    throw new VocabServiceError(404, 'VOCAB_CARD_NOT_FOUND', 'Vocabulary card not found.')
  }

  const nextReview = calculateSM2(
    Number(card.ease_factor),
    card.interval_days,
    card.repetitions,
    rating,
    new Date(),
  )

  const { error: saveError } = await supabaseAdmin.rpc('record_vocab_review', {
    p_user_id: userId,
    p_card_id: cardId,
    p_rating: rating,
    p_ease_factor: nextReview.ease_factor,
    p_interval_days: nextReview.interval_days,
    p_repetitions: nextReview.repetitions,
    p_due_at: nextReview.due_at,
  })

  if (saveError) {
    throw new VocabServiceError(500, 'VOCAB_REVIEW_SAVE_FAILED', 'Unable to save this vocabulary review.')
  }

  return { ...card, ...nextReview }
}

export async function createVocabCard(
  userId: string,
  input: { term: string; definition: string; example?: string; deck?: string },
) {
  const { data: card, error } = await supabaseAdmin
    .from('vocab_cards')
    .insert({
      user_id: userId,
      term: input.term.trim(),
      definition: input.definition.trim(),
      example: input.example?.trim() || null,
      deck: input.deck?.trim() || null,
    })
    .select('*')
    .single()

  if (error) {
    if (isDuplicateError(error)) {
      throw new VocabServiceError(409, 'VOCAB_TERM_EXISTS', 'You already have a card for this term.')
    }
    throw new VocabServiceError(500, 'VOCAB_CARD_CREATE_FAILED', 'Unable to create the vocabulary card.')
  }
  return card
}

export async function generateVocabCards(
  userId: string,
  topic: string | undefined,
  count: number,
) {
  const [profileResult, patternsResult] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('current_level')
      .eq('id', userId)
      .maybeSingle(),
    supabaseAdmin
      .from('error_patterns')
      .select('category, example, correction, count')
      .eq('user_id', userId)
      .order('last_seen_at', { ascending: false })
      .limit(10),
  ])

  if (profileResult.error || patternsResult.error) {
    throw new VocabServiceError(500, 'VOCAB_CONTEXT_FAILED', 'Unable to load your learning context.')
  }
  if (!profileResult.data) {
    throw new VocabServiceError(404, 'PROFILE_NOT_FOUND', 'Your study profile was not found.')
  }

  const parsedLevel = profileLevelSchema.safeParse(profileResult.data.current_level)
  const level = parsedLevel.success ? parsedLevel.data : 'B1'
  const recentErrors = patternsResult.data ?? []
  const errorContext = recentErrors.length
    ? recentErrors
        .map(({ category, example, correction, count: occurrences }) =>
          `Category: ${category}; learner example: ${example}; corrected form: ${correction}; occurrences: ${occurrences}.`,
        )
        .join('\n')
    : 'No recent error patterns are available.'
  const system = `${vocabSystemPrompt}

The learner's current English level is ${level}. Create exactly ${count} distinct vocabulary cards. Return only a JSON array with objects containing term, definition, and example. Definitions should be concise and in Spanish; examples should be natural English sentences in software engineering contexts. Avoid repeating a term within the generated set.`
  const schema = z.array(generatedCardSchema).length(count).superRefine((cards, context) => {
    const terms = new Set<string>()
    cards.forEach((card, index) => {
      const normalized = normalizeTerm(card.term)
      if (terms.has(normalized)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'term'],
          message: 'Generated terms must be unique.',
        })
      }
      terms.add(normalized)
    })
  })
  const cards = await generateJSON({
    system,
    messages: [{
      role: 'user',
      content: `Topic: ${topic ?? 'use the learner errors to choose useful engineering vocabulary'}\nRecent error patterns:\n${errorContext}`,
    }],
    schema,
    maxTokens: Math.min(count * 180, 3600),
  })

  const created = []
  const seenTerms = new Set<string>()
  let duplicatesSkipped = 0
  for (const card of cards) {
    const normalized = normalizeTerm(card.term)
    if (seenTerms.has(normalized)) {
      duplicatesSkipped += 1
      continue
    }
    seenTerms.add(normalized)

    const { data: savedCard, error } = await supabaseAdmin
      .from('vocab_cards')
      .insert({
        user_id: userId,
        term: card.term,
        definition: card.definition,
        example: card.example,
        deck: (topic?.trim() || 'Engineering English').slice(0, 80),
      })
      .select('*')
      .single()

    if (error) {
      if (isDuplicateError(error)) {
        duplicatesSkipped += 1
        continue
      }
      throw new VocabServiceError(500, 'VOCAB_GENERATED_SAVE_FAILED', 'Unable to save generated vocabulary cards.')
    }
    created.push(savedCard)
  }

  return { cards: created, requested: count, duplicatesSkipped }
}

export async function getVocabStats(userId: string) {
  const [total, dueToday, mastered, reviews, successfulReviews] = await Promise.all([
    supabaseAdmin
      .from('vocab_cards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabaseAdmin
      .from('vocab_cards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('due_at', new Date().toISOString()),
    supabaseAdmin
      .from('vocab_cards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('repetitions', 5)
      .gte('interval_days', 21),
    supabaseAdmin
      .from('vocab_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabaseAdmin
      .from('vocab_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('rating', 'again'),
  ])

  if (total.error || dueToday.error || mastered.error || reviews.error || successfulReviews.error) {
    throw new VocabServiceError(500, 'VOCAB_STATS_FAILED', 'Unable to load vocabulary statistics.')
  }

  const reviewCount = reviews.count ?? 0
  const successfulCount = successfulReviews.count ?? 0

  return {
    dueToday: dueToday.count ?? 0,
    total: total.count ?? 0,
    mastered: mastered.count ?? 0,
    retentionPercent: reviewCount === 0
      ? 0
      : Math.round((successfulCount / reviewCount) * 1000) / 10,
    reviewCount,
  }
}

export function toVocabError(error: unknown): AIServiceError | VocabServiceError | undefined {
  return error instanceof AIServiceError || error instanceof VocabServiceError
    ? error
    : undefined
}
