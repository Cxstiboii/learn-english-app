import { z } from 'zod'
import { speakingSystemPrompt } from '../prompts/speaking.js'
import { generateJSON } from './ai/aiClient.js'
import {
  cefrSchema,
  evaluationDisclaimer,
  languageErrorSchema,
  saveEvaluationAtomically,
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

const savedSpeakingEvaluationSchema = speakingEvaluationSchema.extend({
  sessionId: z.string().uuid(),
})

export type SpeakingEvaluationInput = {
  prompt: string
  transcript: string
  durationSeconds: number
}

export async function evaluateSpeaking(
  userId: string,
  idempotencyKey: string,
  input: SpeakingEvaluationInput,
) {
  const evaluation = await generateJSON({
    system: speakingSystemPrompt,
    messages: [{
      role: 'user',
      content: JSON.stringify(input),
    }],
    schema: speakingEvaluationSchema,
    maxTokens: 1400,
  })

  return saveEvaluationAtomically({
    userId,
    idempotencyKey,
    type: 'speaking',
    evaluation: {
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
    },
    patterns: evaluation.corrections,
    resultSchema: savedSpeakingEvaluationSchema,
    errorCode: 'SPEAKING_SAVE_FAILED',
    errorMessage: 'Unable to save the speaking evaluation.',
  })
}
