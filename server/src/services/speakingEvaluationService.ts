import { z } from 'zod'
import { supabaseAdmin } from '../config/supabase.js'
import { speakingSystemPrompt } from '../prompts/speaking.js'
import { generateJSON } from './ai/aiClient.js'
import {
  cefrSchema,
  evaluationDisclaimer,
  EvaluationServiceError,
  languageErrorSchema,
  saveEvaluationErrors,
  scoreSchema,
} from './evaluationService.js'

const speakingEvaluationSchema = z.object({
  fluency: scoreSchema,
  grammar: scoreSchema,
  vocabulary: scoreSchema,
  estimatedBand: scoreSchema,
  estimatedCEFR: cefrSchema,
  b2UpgradeSuggestion: z.string().trim().min(1).max(1500),
  corrections: z.array(languageErrorSchema).max(15),
  disclaimer: z.literal(evaluationDisclaimer),
}).strict()

export type SpeakingEvaluationInput = {
  prompt: string
  transcript: string
  durationSeconds: number
}

export async function evaluateSpeaking(userId: string, input: SpeakingEvaluationInput) {
  const evaluation = await generateJSON({
    system: speakingSystemPrompt,
    messages: [{
      role: 'user',
      content: JSON.stringify(input),
    }],
    schema: speakingEvaluationSchema,
    maxTokens: 1400,
  })

  const { data: session, error } = await supabaseAdmin
    .from('speaking_sessions')
    .insert({
      user_id: userId,
      prompt: input.prompt,
      transcript: input.transcript,
      scores: {
        fluency: evaluation.fluency,
        grammar: evaluation.grammar,
        vocabulary: evaluation.vocabulary,
        estimatedBand: evaluation.estimatedBand,
        estimatedCEFR: evaluation.estimatedCEFR,
        durationSeconds: input.durationSeconds,
      },
      feedback: {
        b2UpgradeSuggestion: evaluation.b2UpgradeSuggestion,
        corrections: evaluation.corrections,
        disclaimer: evaluation.disclaimer,
      },
    })
    .select('id')
    .single()

  if (error || !session) {
    throw new EvaluationServiceError(500, 'SPEAKING_SAVE_FAILED', 'Unable to save the speaking evaluation.')
  }

  await saveEvaluationErrors(userId, evaluation.corrections)
  return { sessionId: session.id, ...evaluation }
}
