import { supabaseAdmin } from '../config/supabase.js'

interface SavePreferencesInput {
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

interface ProfileRow {
  current_level: string
  target_level: string
  daily_goal_minutes: number
}

interface PreferencesRow {
  goals: string[]
  exam_target: string
  exam_target_score: number | null
  exam_date: string | null
  level_source: string
  focus_skills: string[]
  software_area: string
  interests: string[]
  about_me: string | null
  study_days: number[]
  correction_style: string
  explanation_language: string
  tone: string
  reply_length: string
  accent: string
  save_transcripts: boolean
}

function throwOnQueryError(error: { message: string } | null, operation: string): void {
  if (error) {
    console.error('[database] preferences query failed', { operation })
    throw new Error('Unable to load or save your preferences.')
  }
}

function toSettings(profile: ProfileRow, preferences: PreferencesRow) {
  return {
    currentLevel: profile.current_level,
    targetLevel: profile.target_level,
    dailyGoalMinutes: profile.daily_goal_minutes,
    preferences: {
      goals: preferences.goals,
      examTarget: preferences.exam_target,
      examTargetScore: preferences.exam_target_score,
      examDate: preferences.exam_date,
      levelSource: preferences.level_source,
      focusSkills: preferences.focus_skills,
      softwareArea: preferences.software_area,
      interests: preferences.interests,
      aboutMe: preferences.about_me,
      studyDays: preferences.study_days,
      correctionStyle: preferences.correction_style,
      explanationLanguage: preferences.explanation_language,
      tone: preferences.tone,
      replyLength: preferences.reply_length,
      accent: preferences.accent,
      saveTranscripts: preferences.save_transcripts,
    },
  }
}

export async function getPreferences(userId: string) {
  const [profileResult, preferencesResult] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('current_level, target_level, daily_goal_minutes')
      .eq('id', userId)
      .maybeSingle(),
    supabaseAdmin
      .from('learner_preferences')
      .select('goals, exam_target, exam_target_score, exam_date, level_source, focus_skills, software_area, interests, about_me, study_days, correction_style, explanation_language, tone, reply_length, accent, save_transcripts')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  throwOnQueryError(profileResult.error, 'read profile settings')
  throwOnQueryError(preferencesResult.error, 'read learner preferences')
  if (!profileResult.data || !preferencesResult.data) {
    throw new Error('Your preferences could not be found. Please complete onboarding first.')
  }

  return toSettings(
    profileResult.data as ProfileRow,
    preferencesResult.data as PreferencesRow,
  )
}

export async function savePreferences(userId: string, input: SavePreferencesInput) {
  const preferences = input.preferences
  const { error } = await supabaseAdmin.rpc('update_learner_settings_atomically', {
    p_user_id: userId,
    p_current_level: input.currentLevel,
    p_target_level: input.targetLevel,
    p_daily_goal_minutes: input.dailyGoalMinutes,
    p_preferences: {
      goals: preferences.goals,
      exam_target: preferences.examTarget,
      exam_target_score: preferences.examTargetScore,
      exam_date: preferences.examDate,
      level_source: preferences.levelSource,
      focus_skills: preferences.focusSkills,
      software_area: preferences.softwareArea,
      interests: preferences.interests,
      about_me: preferences.aboutMe,
      study_days: preferences.studyDays,
      correction_style: preferences.correctionStyle,
      explanation_language: preferences.explanationLanguage,
      tone: preferences.tone,
      reply_length: preferences.replyLength,
      accent: preferences.accent,
      save_transcripts: preferences.saveTranscripts,
    },
  })

  throwOnQueryError(error, 'save learner preferences')
  return getPreferences(userId)
}
