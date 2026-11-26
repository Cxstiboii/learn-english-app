create or replace function public.record_exercise_answer(
  p_user_id uuid,
  p_exercise_id uuid,
  p_selected_option text,
  p_is_correct boolean,
  p_focus_pattern_id uuid,
  p_focus_category text,
  p_example text,
  p_correction text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  pattern_updated boolean := false;
begin
  perform 1
  from public.exercises
  where id = p_exercise_id
    and user_id = p_user_id
  for update;

  if not found then
    raise exception 'Exercise not found';
  end if;

  insert into public.exercise_attempts
    (user_id, exercise_id, selected_option, is_correct)
  values
    (p_user_id, p_exercise_id, p_selected_option, p_is_correct);

  if not p_is_correct then
    if p_focus_pattern_id is not null then
      update public.error_patterns
      set count = count + 1,
          last_seen_at = now(),
          example = p_example
      where id = p_focus_pattern_id
        and user_id = p_user_id
        and category = p_focus_category;
      pattern_updated := found;
    end if;

    if not pattern_updated then
      insert into public.error_patterns
        (user_id, category, example, correction, count, last_seen_at)
      values
        (p_user_id, p_focus_category, p_example, p_correction, 1, now())
      on conflict (user_id, category, correction)
      do update set
        count = public.error_patterns.count + 1,
        example = excluded.example,
        last_seen_at = now();
    end if;
  end if;
end;
$$;

revoke all on function public.record_exercise_answer(uuid, uuid, text, boolean, uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_exercise_answer(uuid, uuid, text, boolean, uuid, text, text, text)
  to service_role;
