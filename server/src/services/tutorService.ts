import { generateText } from './ai/aiClient.js'
import { tutorSystemPrompt } from '../prompts/tutor.js'
import { buildLearnerContext, renderStudentText } from './learnerContext.js'

type TutorInput = {
  userId: string
  message: string
}

export async function getTutorReply({ userId, message }: TutorInput): Promise<string> {
  const learnerContext = await buildLearnerContext(userId)
  return generateText({
    system: tutorSystemPrompt(learnerContext),
    messages: [{ role: 'user', content: renderStudentText(message) }],
    maxTokens: 700,
  })
}
