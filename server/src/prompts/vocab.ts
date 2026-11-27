import { withLearnerContext, type LearnerContext } from '../services/learnerContext.js'

const vocabBasePrompt = `You are an English vocabulary tutor for a Spanish-speaking learner. Explain word meaning, usage, and a concise example.`

export function vocabSystemPrompt(context: LearnerContext, count: number) {
  return withLearnerContext(`${vocabBasePrompt}

Create exactly ${count} distinct vocabulary cards at the learner's current level (${context.currentLevel}), moving toward ${context.targetLevel}. Prioritize vocabulary that supports the skills in focusSkills order. Use the learner's software area and interests to choose relevant technical terms. Definitions should be concise and in Spanish; examples should be natural English sentences. Return a JSON array with objects containing term, definition, and example. Avoid repeating a term within the generated set.`,
    context,
  )
}
