import { z } from 'zod'
import { profileSuggestionRationalePrompt } from '../prompts/profileSuggestions.js'
import { generateJSON } from './ai/aiClient.js'
import { renderStudentData } from './learnerContext.js'
import type { ProfileSuggestionCandidate } from './profileSuggestionRules.js'

const rationaleSchema = z.object({
  kind: z.string().min(1).max(50),
  rationale: z.string().trim().min(1).max(500),
}).strict()

export async function addFriendlyRationales(
  candidates: ProfileSuggestionCandidate[],
): Promise<ProfileSuggestionCandidate[]> {
  if (candidates.length === 0) return candidates

  const responseSchema = z.object({
    rationales: z.array(rationaleSchema).length(candidates.length),
  }).strict().superRefine((response, context) => {
    response.rationales.forEach(({ kind }, index) => {
      if (kind !== candidates[index]?.kind) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rationales', index, 'kind'],
          message: 'Suggestion reasons must match the supplied order.',
        })
      }
    })
  })

  try {
    const response = await generateJSON({
      system: profileSuggestionRationalePrompt,
      messages: [{
        role: 'user',
        content: renderStudentData(candidates.map(({ kind, title, evidence }) => ({
          kind,
          title,
          evidence,
        }))),
      }],
      schema: responseSchema,
      maxTokens: 600,
    })

    return candidates.map((candidate, index) => ({
      ...candidate,
      rationale: response.rationales[index]?.rationale ?? candidate.rationale,
    }))
  } catch {
    console.warn('[ai] profile suggestion wording failed; using deterministic rationale')
    return candidates
  }
}
