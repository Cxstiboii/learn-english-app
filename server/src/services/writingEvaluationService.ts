import { z } from 'zod'
import { writingSystemPrompt } from '../prompts/writing.js'
import { generateJSON } from './ai/aiClient.js'
import {
  evaluationDisclaimer,
  languageErrorSchema,
  saveEvaluationAtomically,
  scoreSchema,
} from './evaluationService.js'
import { buildLearnerContext, renderStudentData } from './learnerContext.js'

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

const savedWritingEvaluationSchema = z.object({
  submissionId: z.string().uuid(),
  scores: writingEvaluationSchema.shape.scores,
  estimatedBand: scoreSchema,
  suggestions: z.array(z.string().trim().min(1).max(1000)).max(3),
  corrections: writingEvaluationSchema.shape.corrections,
  disclaimer: z.literal(evaluationDisclaimer),
  wordCount: z.number().int().nonnegative(),
}).strict()

export type WritingEvaluationInput = {
  examMode: 'toefl' | 'ielts'
  prompt: string
  response: string
}

function countWords(text: string) {
  return text.trim().split(/\s+/u).filter(Boolean).length
}

export async function evaluateWriting(
  userId: string,
  idempotencyKey: string,
  input: WritingEvaluationInput,
) {
  const learnerContext = await buildLearnerContext(userId)
  const examMode = learnerContext.examTarget === 'none'
    ? input.examMode
    : learnerContext.examTarget
  const evaluation = await generateJSON({
    system: writingSystemPrompt(learnerContext, examMode),
    messages: [{
      role: 'user',
      content: renderStudentData({ ...input, examMode }),
    }],
    schema: writingEvaluationSchema,
    maxTokens: 2200,
  })
  const wordCount = countWords(input.response)

  return saveEvaluationAtomically({
    userId,
    idempotencyKey,
    type: 'writing',
    saveTranscripts: learnerContext.saveTranscripts,
    evaluation: {
      exam_mode: examMode,
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
    },
    patterns: evaluation.corrections,
    resultSchema: savedWritingEvaluationSchema,
    errorCode: 'WRITING_SAVE_FAILED',
    errorMessage: 'Unable to save the writing evaluation.',
  })
}
