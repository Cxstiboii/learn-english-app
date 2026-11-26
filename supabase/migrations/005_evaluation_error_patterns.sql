create or replace function public.record_error_patterns(
  p_user_id uuid,
  p_patterns jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  pattern_item jsonb;
  pattern_category text;
  pattern_example text;
  pattern_correction text;
begin
  if jsonb_typeof(p_patterns) is distinct from 'array' then
    raise exception 'p_patterns must be a JSON array';
  end if;

  for pattern_item in
    select value from jsonb_array_elements(p_patterns) as pattern(value)
  loop
    pattern_category := nullif(btrim(pattern_item ->> 'category'), '');
    pattern_example := nullif(btrim(pattern_item ->> 'example'), '');
    pattern_correction := nullif(btrim(pattern_item ->> 'correction'), '');

    if pattern_category is null or pattern_example is null or pattern_correction is null then
      raise exception 'Each error pattern requires category, example, and correction';
    end if;

    insert into public.error_patterns
      (user_id, category, example, correction, count, last_seen_at)
    values
      (p_user_id, pattern_category, pattern_example, pattern_correction, 1, now())
    on conflict (user_id, category, correction)
    do update set
      example = excluded.example,
      count = public.error_patterns.count + 1,
      last_seen_at = now();
  end loop;
end;
$$;

revoke all on function public.record_error_patterns(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.record_error_patterns(uuid, jsonb)
  to service_role;
