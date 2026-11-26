import type { WritingMode, WritingPrompt } from '../types/writing'

export const writingPrompts: Record<WritingMode, WritingPrompt> = {
  toefl: {
    mode: 'toefl',
    examName: 'TOEFL Writing',
    taskName: 'Academic Discussion',
    durationSeconds: 10 * 60,
    minimumWords: 100,
    prompt:
      'Your professor asks: “With remote work becoming standard in software engineering, some companies no longer require new hires to relocate. Do you think fully remote teams are more effective than in-person teams? Support your view with specific reasons.”',
    timingNote:
      'This simulates one Academic Discussion task. The complete TOEFL Writing section includes three task types and takes about 23 minutes.',
    checklist: [
      'State a clear position in your opening sentence.',
      'Build on the discussion with a relevant reason or example.',
      'Use clear transitions and an appropriate academic tone.',
    ],
  },
  ielts: {
    mode: 'ielts',
    examName: 'IELTS Writing',
    taskName: 'Task 2 · Essay',
    durationSeconds: 40 * 60,
    minimumWords: 250,
    prompt:
      'Some people believe that working remotely makes employees more productive, while others think people work better in an office. Discuss both views and give your own opinion.',
    timingNote:
      'IELTS Academic Writing Task 2 takes about 40 minutes within the 60-minute Writing section.',
    checklist: [
      'Address both views and make your own position clear.',
      'Organize your argument into coherent paragraphs.',
      'Support your ideas with relevant examples and precise vocabulary.',
    ],
  },
}
