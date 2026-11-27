import { supabaseAdmin } from '../config/supabase.js'

function throwOnQueryError(error: { message: string } | null, operation: string): void {
  if (error) {
    console.error('[database] onboarding query failed', { operation })
    throw new Error('Unable to complete this onboarding request.')
  }
}

export async function getOnboardingStatus(userId: string) {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('id', userId)
    .maybeSingle()

  throwOnQueryError(error, 'read onboarding status')
  if (!profile) {
    throw new Error('Unable to complete this onboarding request.')
  }

  return { completed: profile.onboarding_completed_at !== null }
}

interface SaveOnboardingInput {
  currentLevel: string
  targetLevel: string
  dailyGoalMinutes: number
  preferences: {
    goals: string[]
    examTarget: string
    examTargetScore: number | null
    examDate: string | null
    levelSource: string
    focusSkills: string[]
    softwareArea: string
    interests: string[]
    aboutMe: string | null
    studyDays: number[]
    correctionStyle: string
    explanationLanguage: string
    tone: string
    replyLength: string
    accent: string
    saveTranscripts: boolean
  }
}

export async function completeOnboarding(userId: string, input: SaveOnboardingInput) {
  const { error } = await supabaseAdmin.rpc('save_onboarding_atomically', {
    p_user_id: userId,
    p_current_level: input.currentLevel,
    p_target_level: input.targetLevel,
    p_daily_goal_minutes: input.dailyGoalMinutes,
    p_preferences: {
      goals: input.preferences.goals,
      exam_target: input.preferences.examTarget,
      exam_target_score: input.preferences.examTargetScore,
      exam_date: input.preferences.examDate,
      level_source: input.preferences.levelSource,
      focus_skills: input.preferences.focusSkills,
      software_area: input.preferences.softwareArea,
      interests: input.preferences.interests,
      about_me: input.preferences.aboutMe,
      study_days: input.preferences.studyDays,
      correction_style: input.preferences.correctionStyle,
      explanation_language: input.preferences.explanationLanguage,
      tone: input.preferences.tone,
      reply_length: input.preferences.replyLength,
      accent: input.preferences.accent,
      save_transcripts: input.preferences.saveTranscripts,
    },
  })

  throwOnQueryError(error, 'save onboarding')
  return { completed: true }
}
