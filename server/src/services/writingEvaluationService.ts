import { z } from 'zod'
import { supabaseAdmin } from '../config/supabase.js'
import { writingSystemPrompt } from '../prompts/writing.js'
import { generateJSON } from './ai/aiClient.js'
import {
  evaluationDisclaimer,
  EvaluationServiceError,
  languageErrorSchema,
  saveEvaluationErrors,
  scoreSchema,
} from './evaluationService.js'

const writingEvaluationSchema = z.object({
  scores: z.object({
    'Task Response': scoreSchema,
    Coherence: scoreSchema,
    'Lexical Resource': scoreSchema,
    Grammar: scoreSchema,
  }).strict(),
  estimatedBand: scoreSchema,
  suggestions: z.array(z.string().trim().min(1).max(1000)).length(3),
  corrections: z.array(languageErrorSchema).max(20),
  disclaimer: z.literal(evaluationDisclaimer),
}).strict()

export type WritingEvaluationInput = {
  examMode: 'toefl' | 'ielts'
  prompt: string
  response: string
}

function countWords(text: string) {
  return text.trim().split(/\s+/u).filter(Boolean).length
}

export async function evaluateWriting(userId: string, input: WritingEvaluationInput) {
  const evaluation = await generateJSON({
    system: writingSystemPrompt,
    messages: [{
      role: 'user',
      content: JSON.stringify(input),
    }],
    schema: writingEvaluationSchema,
    maxTokens: 2200,
  })
  const wordCount = countWords(input.response)

  const { data: submission, error } = await supabaseAdmin
    .from('writing_submissions')
    .insert({
      user_id: userId,
      exam_mode: input.examMode,
      prompt: input.prompt,
      response: input.response,
      word_count: wordCount,
      scores: {
        criteria: evaluation.scores,
        estimatedBand: evaluation.estimatedBand,
      },
      feedback: {
        suggestions: evaluation.suggestions,
        corrections: evaluation.corrections,
        disclaimer: evaluation.disclaimer,
      },
    })
    .select('id')
    .single()

  if (error || !submission) {
    throw new EvaluationServiceError(500, 'WRITING_SAVE_FAILED', 'Unable to save the writing evaluation.')
  }

  await saveEvaluationErrors(userId, evaluation.corrections)
  return { submissionId: submission.id, ...evaluation, wordCount }
}
