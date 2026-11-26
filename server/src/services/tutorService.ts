import { generateText } from './ai/aiClient.js'
import { tutorSystemPrompt } from '../prompts/tutor.js'

type TutorInput = {
  message: string
  level: 'B1' | 'B2'
}

export async function getTutorReply({ message, level }: TutorInput): Promise<string> {
  return generateText({
    system: tutorSystemPrompt(level),
    messages: [{ role: 'user', content: message }],
    maxTokens: 700,
  })
}
