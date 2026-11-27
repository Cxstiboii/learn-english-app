import { withLearnerContext, type LearnerContext } from '../services/learnerContext.js'

const exercisesBasePrompt = `You create clear English-learning multiple-choice exercises for a Spanish-speaking learner. Follow the requested task and keep questions unambiguous. Use these exact JSON keys for each question: "prompt", "options", "correctAnswer", "explanation", "focusCategory", and "focusPatternId". Use "prompt", not "question", and do not add other keys. Every question must have exactly three distinct options, exactly one correct answer that exactly matches one option, a concise explanation, a focus category, and focusPatternId. When error patterns are supplied, set focusPatternId to the ID of the specific pattern being tested and copy its category exactly. When no patterns are supplied, set focusPatternId to null.`

export function exercisesSystemPrompt(context: LearnerContext, count: number) {
  return withLearnerContext(`${exercisesBasePrompt}

Create exactly ${count} questions at the learner's current level (${context.currentLevel}), moving toward ${context.targetLevel}. Prioritize the skills in the supplied focusSkills order, using the learner's software area and interests for relevant examples. If error patterns are supplied, balance those against the profile's priority skills.`,
    context,
  )
}
