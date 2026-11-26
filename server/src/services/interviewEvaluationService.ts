import { z } from 'zod'
import { supabaseAdmin } from '../config/supabase.js'
import { interviewSystemPrompt } from '../prompts/interview.js'
import { generateJSON } from './ai/aiClient.js'
import {
  cefrSchema,
  evaluationDisclaimer,
  EvaluationServiceError,
  languageErrorSchema,
  saveEvaluationErrors,
} from './evaluationService.js'

const interviewAnswerEvaluationSchema = z.object({
  index: z.number().int().min(0).max(9),
  situationTaskMet: z.boolean(),
  actionMet: z.boolean(),
  resultMet: z.boolean(),
  comments: z.array(z.string().trim().min(1).max(1000)).min(1).max(4),
  improvedResponse: z.string().trim().min(1).max(5000),
  languageErrors: z.array(languageErrorSchema).max(10),
}).strict()

const interviewEvaluationFieldsSchema = z.object({
  answers: z.array(interviewAnswerEvaluationSchema),
  summary: z.string().trim().min(1).max(2000),
  estimatedCEFR: cefrSchema,
  strengths: z.array(z.string().trim().min(1).max(500)).max(8),
  suggestions: z.array(z.string().trim().min(1).max(500)).max(8),
  disclaimer: z.literal(evaluationDisclaimer),
}).strict()

export type InterviewEvaluationInput = {
  track: 'behavioral' | 'system-design' | 'role-salary'
  answers: Array<{
    question: string
    transcript: string
  }>
}

export async function evaluateInterview(userId: string, input: InterviewEvaluationInput) {
  const evaluationSchema = interviewEvaluationFieldsSchema.extend({
    answers: z.array(interviewAnswerEvaluationSchema).length(input.answers.length),
  }).strict().superRefine((evaluation, context) => {
    evaluation.answers.forEach((answer, index) => {
      if (answer.index !== index) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['answers', index, 'index'],
          message: 'Answer evaluations must match the input order.',
        })
      }
    })
  })

  const evaluation = await generateJSON({
    system: interviewSystemPrompt,
    messages: [{
      role: 'user',
      content: JSON.stringify(input),
    }],
    schema: evaluationSchema,
    maxTokens: Math.min(input.answers.length * 800 + 900, 4096),
  })

  const evaluatedAnswers = evaluation.answers.map((answer) => ({
    question: input.answers[answer.index].question,
    transcript: input.answers[answer.index].transcript,
    situationTaskMet: answer.situationTaskMet,
    actionMet: answer.actionMet,
    resultMet: answer.resultMet,
    comments: answer.comments,
    improvedResponse: answer.improvedResponse,
    languageErrors: answer.languageErrors,
  }))
  const { data: session, error } = await supabaseAdmin
    .from('interview_sessions')
    .insert({
      user_id: userId,
      track: input.track,
      questions: input.answers.map(({ question }) => question),
      answers: input.answers,
      evaluation: {
        answers: evaluatedAnswers,
        summary: evaluation.summary,
        estimatedCEFR: evaluation.estimatedCEFR,
        strengths: evaluation.strengths,
        suggestions: evaluation.suggestions,
        disclaimer: evaluation.disclaimer,
      },
    })
    .select('id')
    .single()

  if (error || !session) {
    throw new EvaluationServiceError(500, 'INTERVIEW_SAVE_FAILED', 'Unable to save the interview evaluation.')
  }

  await saveEvaluationErrors(
    userId,
    evaluation.answers.flatMap(({ languageErrors }) => languageErrors),
  )

  return {
    sessionId: session.id,
    answers: evaluatedAnswers,
    summary: evaluation.summary,
    estimatedCEFR: evaluation.estimatedCEFR,
    strengths: evaluation.strengths,
    suggestions: evaluation.suggestions,
    disclaimer: evaluation.disclaimer,
  }
}
