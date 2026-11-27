create or replace function public.update_learner_settings_atomically(
  p_user_id uuid,
  p_current_level text,
  p_target_level text,
  p_daily_goal_minutes integer,
  p_preferences jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null
    or p_current_level is null
    or p_target_level is null
    or p_daily_goal_minutes is null
    or p_daily_goal_minutes < 1
    or jsonb_typeof(p_preferences) is distinct from 'object'
  then
    raise exception 'Invalid learner settings';
  end if;

  update public.profiles
  set
    current_level = p_current_level,
    target_level = p_target_level,
    daily_goal_minutes = p_daily_goal_minutes
  where id = p_user_id;

  if not found then
    raise exception 'Learner profile not found';
  end if;

  insert into public.learner_preferences (
    user_id,
    goals,
    exam_target,
    exam_target_score,
    exam_date,
    level_source,
    focus_skills,
    software_area,
    interests,
    about_me,
    study_days,
    correction_style,
    explanation_language,
    tone,
    reply_length,
    accent,
    save_transcripts,
    updated_at
  )
  values (
    p_user_id,
    array(select jsonb_array_elements_text(p_preferences -> 'goals')),
    p_preferences ->> 'exam_target',
    (p_preferences ->> 'exam_target_score')::numeric,
    (p_preferences ->> 'exam_date')::date,
    p_preferences ->> 'level_source',
    array(select jsonb_array_elements_text(p_preferences -> 'focus_skills')),
    p_preferences ->> 'software_area',
    array(select jsonb_array_elements_text(p_preferences -> 'interests')),
    p_preferences ->> 'about_me',
    array(
      select jsonb_array_elements_text(p_preferences -> 'study_days')::smallint
    ),
    p_preferences ->> 'correction_style',
    p_preferences ->> 'explanation_language',
    p_preferences ->> 'tone',
    p_preferences ->> 'reply_length',
    p_preferences ->> 'accent',
    (p_preferences ->> 'save_transcripts')::boolean,
    now()
  )
  on conflict (user_id) do update set
    goals = excluded.goals,
    exam_target = excluded.exam_target,
    exam_target_score = excluded.exam_target_score,
    exam_date = excluded.exam_date,
    level_source = excluded.level_source,
    focus_skills = excluded.focus_skills,
    software_area = excluded.software_area,
    interests = excluded.interests,
    about_me = excluded.about_me,
    study_days = excluded.study_days,
    correction_style = excluded.correction_style,
    explanation_language = excluded.explanation_language,
    tone = excluded.tone,
    reply_length = excluded.reply_length,
    accent = excluded.accent,
    save_transcripts = excluded.save_transcripts,
    updated_at = now();
end;
$$;

revoke all on function public.update_learner_settings_atomically(uuid, text, text, integer, jsonb)
  from public, anon, authenticated;
grant execute on function public.update_learner_settings_atomically(uuid, text, text, integer, jsonb)
  to service_role;
