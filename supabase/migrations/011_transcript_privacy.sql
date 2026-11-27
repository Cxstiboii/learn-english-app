drop function if exists public.save_chat_exchange(uuid, uuid, text, text, jsonb, integer);

create function public.save_chat_exchange(
  p_user_id uuid,
  p_conversation_id uuid,
  p_user_message text,
  p_assistant_reply text,
  p_corrections jsonb,
  p_minutes integer,
  p_save_transcripts boolean
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

  if p_save_transcripts is null then
    raise exception 'p_save_transcripts is required';
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

  if p_save_transcripts then
    insert into public.messages (user_id, conversation_id, role, content, corrections)
    values (p_user_id, p_conversation_id, 'user', p_user_message, '[]'::jsonb);

    insert into public.messages (user_id, conversation_id, role, content, corrections)
    values (p_user_id, p_conversation_id, 'assistant', p_assistant_reply, p_corrections);
  end if;

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
  values (p_user_id, current_date, p_minutes)
  on conflict (user_id, date)
  do update set minutes = public.daily_activity.minutes + excluded.minutes;
end;
$$;

revoke all on function public.save_chat_exchange(uuid, uuid, text, text, jsonb, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.save_chat_exchange(uuid, uuid, text, text, jsonb, integer, boolean)
  to service_role;
