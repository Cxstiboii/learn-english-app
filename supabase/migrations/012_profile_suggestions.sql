alter table public.profile_suggestions
  add column evidence text not null default '';

update public.profile_suggestions
set evidence = rationale
where evidence = ''
  and rationale <> '';

create table public.profile_suggestion_runs (
  user_id uuid not null references auth.users (id) on delete cascade,
  generation_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, generation_date)
);

create index profile_suggestions_pending_user_created_at_idx
  on public.profile_suggestions (user_id, created_at desc)
  where status = 'pending';

create unique index profile_suggestions_pending_user_kind_idx
  on public.profile_suggestions (user_id, kind)
  where status = 'pending';

create or replace function public.is_valid_focus_skill_order(
  p_focus_skills jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(p_focus_skills) is distinct from 'array' then
    return false;
  end if;
  if jsonb_array_length(p_focus_skills) <> 4 then
    return false;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_focus_skills) as skills(skill)
    where jsonb_typeof(skills.skill) is distinct from 'string'
      or skills.skill #>> '{}' not in ('speaking', 'listening', 'writing', 'vocab_grammar')
  ) then
    return false;
  end if;

  return (
    select count(distinct skills.skill #>> '{}') = 4
    from jsonb_array_elements(p_focus_skills) as skills(skill)
  );
end;
$$;

create or replace function public.save_profile_suggestions(
  p_user_id uuid,
  p_suggestions jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  suggestion jsonb;
  suggestion_kind text;
  changes jsonb;
  pending_count integer;
begin
  if p_user_id is null
    or jsonb_typeof(p_suggestions) is distinct from 'array'
  then
    raise exception 'Invalid profile suggestions';
  end if;
  if jsonb_array_length(p_suggestions) > 3 then
    raise exception 'A maximum of three suggestions can be saved';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 731));
  select count(*)::integer
  into pending_count
  from public.profile_suggestions
  where user_id = p_user_id
    and status = 'pending';

  for suggestion in select value from jsonb_array_elements(p_suggestions)
  loop
    exit when pending_count >= 3;

    if jsonb_typeof(suggestion) is distinct from 'object'
      or suggestion - 'kind' - 'title' - 'rationale' - 'evidence' - 'proposedChanges'
        <> '{}'::jsonb
      or not (suggestion ? 'kind')
      or not (suggestion ? 'title')
      or not (suggestion ? 'rationale')
      or not (suggestion ? 'evidence')
      or not (suggestion ? 'proposedChanges')
      or jsonb_typeof(suggestion -> 'kind') is distinct from 'string'
      or jsonb_typeof(suggestion -> 'title') is distinct from 'string'
      or jsonb_typeof(suggestion -> 'rationale') is distinct from 'string'
      or jsonb_typeof(suggestion -> 'evidence') is distinct from 'string'
      or jsonb_typeof(suggestion -> 'proposedChanges') is distinct from 'object'
      or char_length(btrim(suggestion ->> 'title')) not between 1 and 120
      or char_length(btrim(suggestion ->> 'rationale')) not between 1 and 500
      or char_length(btrim(suggestion ->> 'evidence')) not between 1 and 500
    then
      raise exception 'Invalid profile suggestion';
    end if;

    suggestion_kind := suggestion ->> 'kind';
    if suggestion_kind not in (
      'lower_daily_goal',
      'raise_target_level',
      'adjust_skill_plan',
      'targeted_error_practice'
    ) then
      raise exception 'Unsupported profile suggestion';
    end if;

    changes := suggestion -> 'proposedChanges';
    if exists (
      select 1
      from jsonb_object_keys(changes) as change_keys(key)
      where change_keys.key not in (
        'dailyGoalMinutes',
        'expectedDailyGoalMinutes',
        'targetLevel',
        'expectedTargetLevel',
        'focusSkills',
        'expectedFocusSkills',
        'exerciseFocusCategory'
      )
    ) then
      raise exception 'Invalid profile suggestion changes';
    end if;

    if (suggestion_kind = 'lower_daily_goal'
        and changes - 'dailyGoalMinutes' - 'expectedDailyGoalMinutes' <> '{}'::jsonb)
      or (suggestion_kind = 'raise_target_level'
        and changes - 'targetLevel' - 'expectedTargetLevel' <> '{}'::jsonb)
      or (suggestion_kind = 'adjust_skill_plan'
        and changes - 'focusSkills' - 'expectedFocusSkills' <> '{}'::jsonb)
      or (suggestion_kind = 'targeted_error_practice'
        and changes - 'focusSkills' - 'expectedFocusSkills' - 'exerciseFocusCategory'
          <> '{}'::jsonb)
    then
      raise exception 'Suggestion fields do not match its kind';
    end if;
    if suggestion_kind = 'adjust_skill_plan'
      and (
        not public.is_valid_focus_skill_order(changes -> 'focusSkills')
        or not public.is_valid_focus_skill_order(changes -> 'expectedFocusSkills')
      )
    then
      raise exception 'Invalid focus skill suggestion';
    end if;
    if suggestion_kind = 'targeted_error_practice'
      and (
        not public.is_valid_focus_skill_order(changes -> 'focusSkills')
        or not public.is_valid_focus_skill_order(changes -> 'expectedFocusSkills')
        or jsonb_typeof(changes -> 'exerciseFocusCategory') is distinct from 'string'
        or char_length(btrim(changes ->> 'exerciseFocusCategory')) not between 1 and 80
      )
    then
      raise exception 'Invalid focused practice suggestion';
    end if;
    if suggestion_kind = 'lower_daily_goal' then
      if jsonb_typeof(changes -> 'dailyGoalMinutes') is distinct from 'number'
        or jsonb_typeof(changes -> 'expectedDailyGoalMinutes') is distinct from 'number'
      then
        raise exception 'Invalid daily goal suggestion';
      end if;
      if (changes ->> 'dailyGoalMinutes')::numeric < 1
        or (changes ->> 'dailyGoalMinutes')::numeric > 1440
        or trunc((changes ->> 'dailyGoalMinutes')::numeric)
          <> (changes ->> 'dailyGoalMinutes')::numeric
      then
        raise exception 'Invalid daily goal suggestion';
      end if;
    end if;
    if suggestion_kind = 'raise_target_level'
      and (
        jsonb_typeof(changes -> 'targetLevel') is distinct from 'string'
        or jsonb_typeof(changes -> 'expectedTargetLevel') is distinct from 'string'
        or changes ->> 'targetLevel' not in ('A2', 'B1', 'B1+', 'B2', 'C1')
        or changes ->> 'expectedTargetLevel' not in ('A2', 'B1', 'B1+', 'B2', 'C1')
      )
    then
      raise exception 'Invalid target level suggestion';
    end if;

    if not exists (
      select 1
      from public.profile_suggestions
      where user_id = p_user_id
        and kind = suggestion_kind
        and status = 'pending'
    ) then
      insert into public.profile_suggestions (
        user_id,
        kind,
        title,
        rationale,
        evidence,
        proposed_changes,
        status
      )
      values (
        p_user_id,
        suggestion_kind,
        suggestion ->> 'title',
        suggestion ->> 'rationale',
        suggestion ->> 'evidence',
        suggestion -> 'proposedChanges',
        'pending'
      );
      pending_count := pending_count + 1;
    end if;
  end loop;
end;
$$;

alter table public.profile_suggestion_runs enable row level security;

create policy "Users can read their own suggestion generation dates"
  on public.profile_suggestion_runs for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.profile_suggestion_runs
  from public, anon, authenticated, service_role;
grant all on table public.profile_suggestion_runs to service_role;

create or replace function public.claim_profile_suggestion_generation(
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_rows integer;
begin
  if p_user_id is null then
    raise exception 'A user ID is required';
  end if;

  insert into public.profile_suggestion_runs (user_id, generation_date)
  values (
    p_user_id,
    (now() at time zone 'America/Bogota')::date
  )
  on conflict (user_id, generation_date) do nothing;

  get diagnostics inserted_rows = row_count;
  return inserted_rows = 1;
end;
$$;

create or replace function public.resolve_profile_suggestion(
  p_user_id uuid,
  p_suggestion_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  suggestion public.profile_suggestions%rowtype;
  changes jsonb;
  current_daily_goal integer;
  current_target_level text;
  current_focus_skills text[];
begin
  if p_user_id is null
    or p_suggestion_id is null
    or p_action is null
    or p_action not in ('accept', 'dismiss')
  then
    raise exception 'Invalid profile suggestion action';
  end if;

  select *
  into suggestion
  from public.profile_suggestions
  where id = p_suggestion_id
    and user_id = p_user_id
  for update;

  if not found then
    return null;
  end if;

  if suggestion.status <> 'pending' then
    return jsonb_build_object(
      'id', suggestion.id,
      'kind', suggestion.kind,
      'status', suggestion.status,
      'proposedChanges', suggestion.proposed_changes
    );
  end if;

  if p_action = 'dismiss' then
    update public.profile_suggestions
    set status = 'dismissed',
        resolved_at = now()
    where id = suggestion.id
      and user_id = p_user_id;

    return jsonb_build_object(
      'id', suggestion.id,
      'kind', suggestion.kind,
      'status', 'dismissed',
      'proposedChanges', suggestion.proposed_changes
    );
  end if;

  changes := suggestion.proposed_changes;
  if jsonb_typeof(changes) is distinct from 'object' then
    raise exception 'Invalid profile suggestion changes';
  end if;
  if exists (
    select 1
    from jsonb_object_keys(changes) as change_keys(change_key)
    where change_keys.change_key not in (
      'dailyGoalMinutes',
      'expectedDailyGoalMinutes',
      'targetLevel',
      'expectedTargetLevel',
      'focusSkills',
      'expectedFocusSkills',
      'exerciseFocusCategory'
    )
  ) then
    raise exception 'Invalid profile suggestion changes';
  end if;

  if suggestion.kind = 'lower_daily_goal' then
    if changes - 'dailyGoalMinutes' - 'expectedDailyGoalMinutes' <> '{}'::jsonb
      or not (changes ? 'dailyGoalMinutes')
      or not (changes ? 'expectedDailyGoalMinutes')
      or jsonb_typeof(changes -> 'dailyGoalMinutes') is distinct from 'number'
      or jsonb_typeof(changes -> 'expectedDailyGoalMinutes') is distinct from 'number'
    then
      raise exception 'Invalid daily goal suggestion';
    end if;
    if (changes ->> 'dailyGoalMinutes')::numeric < 1
      or (changes ->> 'dailyGoalMinutes')::numeric > 1440
      or trunc((changes ->> 'dailyGoalMinutes')::numeric)
        <> (changes ->> 'dailyGoalMinutes')::numeric
      or trunc((changes ->> 'expectedDailyGoalMinutes')::numeric)
        <> (changes ->> 'expectedDailyGoalMinutes')::numeric
      or (changes ->> 'expectedDailyGoalMinutes')::numeric < 1
      or (changes ->> 'expectedDailyGoalMinutes')::numeric > 1440
    then
      raise exception 'Invalid daily goal suggestion';
    end if;

    select daily_goal_minutes
    into current_daily_goal
    from public.profiles
    where id = p_user_id
    for update;
    if not found then
      raise exception 'Learner profile not found';
    end if;
    if current_daily_goal is distinct from (changes ->> 'expectedDailyGoalMinutes')::integer then
      return jsonb_build_object(
        'id', suggestion.id,
        'kind', suggestion.kind,
        'status', 'stale',
        'proposedChanges', suggestion.proposed_changes
      );
    end if;
    if ((changes ->> 'dailyGoalMinutes')::integer < current_daily_goal) is not true then
      raise exception 'The suggested daily goal must be lower than the current goal';
    end if;

    update public.profiles
    set daily_goal_minutes = (changes ->> 'dailyGoalMinutes')::integer
    where id = p_user_id;

    if not found then
      raise exception 'Learner profile not found';
    end if;
  elsif suggestion.kind = 'raise_target_level' then
    if changes - 'targetLevel' - 'expectedTargetLevel' <> '{}'::jsonb
      or not (changes ? 'targetLevel')
      or not (changes ? 'expectedTargetLevel')
      or jsonb_typeof(changes -> 'targetLevel') is distinct from 'string'
      or jsonb_typeof(changes -> 'expectedTargetLevel') is distinct from 'string'
      or changes ->> 'targetLevel' not in ('A2', 'B1', 'B1+', 'B2', 'C1')
      or changes ->> 'expectedTargetLevel' not in ('A2', 'B1', 'B1+', 'B2', 'C1')
    then
      raise exception 'Invalid target level suggestion';
    end if;

    select target_level
    into current_target_level
    from public.profiles
    where id = p_user_id
    for update;
    if not found then
      raise exception 'Learner profile not found';
    end if;
    if current_target_level is distinct from (changes ->> 'expectedTargetLevel') then
      return jsonb_build_object(
        'id', suggestion.id,
        'kind', suggestion.kind,
        'status', 'stale',
        'proposedChanges', suggestion.proposed_changes
      );
    end if;
    if (changes ->> 'targetLevel') is distinct from (case current_target_level
      when 'A2' then 'B1'
      when 'B1' then 'B1+'
      when 'B1+' then 'B2'
      when 'B2' then 'C1'
      else null
    end) then
      raise exception 'The suggested target level is not the next level';
    end if;

    update public.profiles
    set target_level = changes ->> 'targetLevel'
    where id = p_user_id;

    if not found then
      raise exception 'Learner profile not found';
    end if;
  elsif suggestion.kind = 'adjust_skill_plan' then
    if changes - 'focusSkills' - 'expectedFocusSkills' <> '{}'::jsonb
      or not (changes ? 'focusSkills')
      or not (changes ? 'expectedFocusSkills')
      or not public.is_valid_focus_skill_order(changes -> 'focusSkills')
      or not public.is_valid_focus_skill_order(changes -> 'expectedFocusSkills')
    then
      raise exception 'Invalid focus skill suggestion';
    end if;

    select focus_skills
    into current_focus_skills
    from public.learner_preferences
    where user_id = p_user_id
    for update;
    if not found then
      raise exception 'Learner preferences not found';
    end if;
    if current_focus_skills is distinct from array(
      select jsonb_array_elements_text(changes -> 'expectedFocusSkills')
    ) then
      return jsonb_build_object(
        'id', suggestion.id,
        'kind', suggestion.kind,
        'status', 'stale',
        'proposedChanges', suggestion.proposed_changes
      );
    end if;

    update public.learner_preferences
    set focus_skills = array(
      select jsonb_array_elements_text(changes -> 'focusSkills')
    )
    where user_id = p_user_id;

    if not found then
      raise exception 'Learner preferences not found';
    end if;
  elsif suggestion.kind = 'targeted_error_practice' then
    if changes - 'focusSkills' - 'expectedFocusSkills' - 'exerciseFocusCategory'
        <> '{}'::jsonb
      or not (changes ? 'exerciseFocusCategory')
      or not (changes ? 'focusSkills')
      or not (changes ? 'expectedFocusSkills')
      or jsonb_typeof(changes -> 'exerciseFocusCategory') is distinct from 'string'
      or char_length(btrim(changes ->> 'exerciseFocusCategory')) not between 1 and 80
      or not public.is_valid_focus_skill_order(changes -> 'focusSkills')
      or not public.is_valid_focus_skill_order(changes -> 'expectedFocusSkills')
    then
      raise exception 'Invalid focused practice suggestion';
    end if;

    select focus_skills
    into current_focus_skills
    from public.learner_preferences
    where user_id = p_user_id
    for update;
    if not found then
      raise exception 'Learner preferences not found';
    end if;
    if current_focus_skills is distinct from array(
      select jsonb_array_elements_text(changes -> 'expectedFocusSkills')
    ) then
      return jsonb_build_object(
        'id', suggestion.id,
        'kind', suggestion.kind,
        'status', 'stale',
        'proposedChanges', suggestion.proposed_changes
      );
    end if;
    if not exists (
      select 1
      from public.error_patterns
      where user_id = p_user_id
        and lower(category) = lower(changes ->> 'exerciseFocusCategory')
        and last_seen_at >= now() - interval '14 days'
    ) then
      raise exception 'The focused error pattern is no longer available';
    end if;

    update public.learner_preferences
    set focus_skills = array(
      select jsonb_array_elements_text(changes -> 'focusSkills')
    )
    where user_id = p_user_id;

    if not found then
      raise exception 'Learner preferences not found';
    end if;
  else
    raise exception 'Unsupported profile suggestion';
  end if;

  update public.profile_suggestions
  set status = 'accepted',
      resolved_at = now()
  where id = suggestion.id
    and user_id = p_user_id;

  return jsonb_build_object(
    'id', suggestion.id,
    'kind', suggestion.kind,
    'status', 'accepted',
    'proposedChanges', suggestion.proposed_changes
  );
end;
$$;

revoke all on function public.claim_profile_suggestion_generation(uuid)
  from public, anon, authenticated;
grant execute on function public.claim_profile_suggestion_generation(uuid)
  to service_role;

revoke all on function public.save_profile_suggestions(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.save_profile_suggestions(uuid, jsonb)
  to service_role;

revoke all on function public.resolve_profile_suggestion(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.resolve_profile_suggestion(uuid, uuid, text)
  to service_role;

revoke all on function public.is_valid_focus_skill_order(jsonb)
  from public, anon, authenticated;
grant execute on function public.is_valid_focus_skill_order(jsonb)
  to service_role;
