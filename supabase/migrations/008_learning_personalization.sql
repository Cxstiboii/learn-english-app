alter table public.profiles
  add column onboarding_completed_at timestamptz;

create table public.learner_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  goals text[] not null default '{}',
  exam_target text not null default 'none' check (
    exam_target in ('toefl', 'ielts', 'none')
  ),
  exam_target_score numeric,
  exam_date date,
  level_source text not null check (
    level_source in ('self', 'placement', 'ai_estimate')
  ),
  focus_skills text[] not null default '{}',
  software_area text not null check (
    software_area in (
      'frontend', 'backend', 'fullstack', 'data', 'devops',
      'mobile', 'qa', 'other', 'none'
    )
  ),
  interests text[] not null default '{}',
  about_me text check (about_me is null or char_length(about_me) <= 200),
  study_days smallint[] not null default '{}',
  correction_style text not null check (
    correction_style in ('every_error', 'major_errors', 'end_of_session')
  ),
  explanation_language text not null check (
    explanation_language in ('english_only', 'spanish_support', 'mixed')
  ),
  tone text not null check (
    tone in ('friendly', 'professional', 'challenging')
  ),
  reply_length text not null check (
    reply_length in ('short', 'medium', 'detailed')
  ),
  accent text not null check (accent in ('us', 'uk')),
  save_transcripts boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint learner_preferences_goals_check check (
    array_position(goals, null) is null
    and goals <@ array[
      'remote_job', 'interviews', 'toefl', 'ielts', 'daily_fluency', 'read_docs'
    ]::text[]
  ),
  constraint learner_preferences_focus_skills_check check (
    array_position(focus_skills, null) is null
    and focus_skills <@ array[
      'speaking', 'listening', 'writing', 'vocab_grammar'
    ]::text[]
  ),
  constraint learner_preferences_interests_check check (
    cardinality(interests) <= 5
    and array_position(interests, null) is null
  ),
  constraint learner_preferences_study_days_check check (
    array_position(study_days, null) is null
    and study_days <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
  )
);

create table public.profile_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  rationale text not null,
  proposed_changes jsonb not null,
  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'dismissed')
  ),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.placement_questions (
  id uuid primary key default gen_random_uuid(),
  level text not null,
  skill text not null,
  prompt text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array'),
  correct_option text not null,
  explanation text not null
);

create table public.placement_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  score numeric not null,
  estimated_level text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_learner_preferences_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger learner_preferences_updated_at
  before update on public.learner_preferences
  for each row execute function public.set_learner_preferences_updated_at();

revoke all on function public.set_learner_preferences_updated_at()
  from public, anon, authenticated;

create index profile_suggestions_user_created_at_idx
  on public.profile_suggestions (user_id, created_at desc);
create index placement_attempts_user_created_at_idx
  on public.placement_attempts (user_id, created_at desc);
create index placement_questions_level_skill_idx
  on public.placement_questions (level, skill);

alter table public.learner_preferences enable row level security;
alter table public.profile_suggestions enable row level security;
alter table public.placement_questions enable row level security;
alter table public.placement_attempts enable row level security;

create policy "Users can manage their own learner preferences"
  on public.learner_preferences for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage their own profile suggestions"
  on public.profile_suggestions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage their own placement attempts"
  on public.placement_attempts for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on table
  public.learner_preferences,
  public.profile_suggestions,
  public.placement_attempts
  from public, anon, authenticated, service_role;
grant select, insert, update, delete on table
  public.learner_preferences,
  public.profile_suggestions,
  public.placement_attempts
  to authenticated;
grant all on table
  public.learner_preferences,
  public.profile_suggestions,
  public.placement_attempts
  to service_role;

revoke all on table public.placement_questions
  from public, anon, authenticated, service_role;
grant select on table public.placement_questions to service_role;
