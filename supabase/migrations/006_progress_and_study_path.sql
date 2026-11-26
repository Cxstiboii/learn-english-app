create or replace function public.log_daily_activity(
  p_user_id uuid,
  p_minutes integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  activity_date date := (now() at time zone 'America/Bogota')::date;
  total_minutes integer;
begin
  if p_minutes is null or p_minutes < 1 or p_minutes > 1440 then
    raise exception 'p_minutes must be between 1 and 1440';
  end if;

  insert into public.daily_activity (user_id, date, minutes)
  values (
    p_user_id,
    activity_date,
    p_minutes
  )
  on conflict (user_id, date)
  do update set minutes = public.daily_activity.minutes + excluded.minutes
  returning minutes into total_minutes;

  return jsonb_build_object('date', activity_date, 'minutes', total_minutes);
end;
$$;

revoke all on function public.log_daily_activity(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.log_daily_activity(uuid, integer)
  to service_role;

create or replace function public.complete_study_activity(
  p_user_id uuid,
  p_activity_id text
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  activity_unit_number integer;
  activity_completed_at timestamptz;
begin
  select unit.unit_number
    into activity_unit_number
  from public.study_activities as activity
  join public.study_units as unit on unit.id = activity.unit_id
  where activity.id = p_activity_id;

  if not found then
    raise exception 'ACTIVITY_NOT_FOUND';
  end if;

  if exists (
    select 1
    from public.study_units as previous_unit
    where previous_unit.unit_number < activity_unit_number
      and (
        not exists (
          select 1
          from public.study_activities as previous_activity
          where previous_activity.unit_id = previous_unit.id
        )
        or exists (
          select 1
          from public.study_activities as previous_activity
          where previous_activity.unit_id = previous_unit.id
            and not exists (
              select 1
              from public.user_activity_progress as progress
              where progress.user_id = p_user_id
                and progress.activity_id = previous_activity.id
            )
        )
      )
  ) then
    raise exception 'ACTIVITY_LOCKED';
  end if;

  insert into public.user_activity_progress (user_id, activity_id)
  values (p_user_id, p_activity_id)
  on conflict (user_id, activity_id) do nothing;

  select progress.completed_at
    into activity_completed_at
  from public.user_activity_progress as progress
  where progress.user_id = p_user_id
    and progress.activity_id = p_activity_id;

  return activity_completed_at;
end;
$$;

revoke all on function public.complete_study_activity(uuid, text)
  from public, anon, authenticated;
grant execute on function public.complete_study_activity(uuid, text)
  to service_role;

create or replace function public.save_chat_exchange(
  p_user_id uuid,
  p_conversation_id uuid,
  p_user_message text,
  p_assistant_reply text,
  p_corrections jsonb,
  p_minutes integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  correction_item jsonb;
begin
  if p_minutes < 1 then
    raise exception 'p_minutes must be positive';
  end if;

  if jsonb_typeof(p_corrections) is distinct from 'array' then
    raise exception 'p_corrections must be a JSON array';
  end if;

  if not exists (
    select 1
    from public.conversations
    where id = p_conversation_id
      and user_id = p_user_id
  ) then
    raise exception 'Conversation not found';
  end if;

  insert into public.messages (user_id, conversation_id, role, content, corrections)
  values (p_user_id, p_conversation_id, 'user', p_user_message, '[]'::jsonb);

  insert into public.messages (user_id, conversation_id, role, content, corrections)
  values (p_user_id, p_conversation_id, 'assistant', p_assistant_reply, p_corrections);

  for correction_item in
    select value from jsonb_array_elements(p_corrections) as correction(value)
  loop
    insert into public.error_patterns
      (user_id, category, example, correction, count, last_seen_at)
    values (
      p_user_id,
      correction_item ->> 'category',
      correction_item ->> 'original',
      correction_item ->> 'corrected',
      1,
      now()
    )
    on conflict (user_id, category, correction)
    do update set
      example = excluded.example,
      count = public.error_patterns.count + 1,
      last_seen_at = now();
  end loop;

  insert into public.daily_activity (user_id, date, minutes)
  values (
    p_user_id,
    (now() at time zone 'America/Bogota')::date,
    p_minutes
  )
  on conflict (user_id, date)
  do update set minutes = public.daily_activity.minutes + excluded.minutes;
end;
$$;

revoke all on function public.save_chat_exchange(uuid, uuid, text, text, jsonb, integer)
  from public, anon, authenticated;
grant execute on function public.save_chat_exchange(uuid, uuid, text, text, jsonb, integer)
  to service_role;
