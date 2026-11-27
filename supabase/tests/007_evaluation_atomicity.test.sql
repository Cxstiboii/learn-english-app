begin;

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data
)
values (
  '00000000-0000-4000-8000-000000000701',
  'authenticated',
  'authenticated',
  'evaluation-atomicity-test@example.test',
  '',
  now(),
  '{}'::jsonb,
  '{}'::jsonb
);

do $$
declare
  test_user_id constant uuid := '00000000-0000-4000-8000-000000000701';
  request_id constant uuid := '00000000-0000-4000-8000-000000000711';
  failed_request_id constant uuid := '00000000-0000-4000-8000-000000000712';
  first_result jsonb;
  retry_result jsonb;
  activity_minutes integer;
begin
  if has_function_privilege(
    'anon',
    'public.save_evaluation_atomically(uuid,uuid,text,jsonb,jsonb)',
    'execute'
  ) then
    raise exception 'anon must not execute the evaluation RPC';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.save_evaluation_atomically(uuid,uuid,text,jsonb,jsonb)',
    'execute'
  ) then
    raise exception 'authenticated must not execute the evaluation RPC';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.save_evaluation_atomically(uuid,uuid,text,jsonb,jsonb)',
    'execute'
  ) then
    raise exception 'service_role must execute the evaluation RPC';
  end if;

  first_result := public.save_evaluation_atomically(
    test_user_id,
    request_id,
    'speaking',
    '{
      "prompt":"Describe a recent deployment.",
      "transcript":"We fixed the deployment.",
      "scores":{
        "fluency":7,
        "grammar":7,
        "vocabulary":7,
        "estimatedBand":7,
        "estimatedCEFR":"B2",
        "durationSeconds":60
      },
      "feedback":{
        "b2UpgradeSuggestion":"Add a concise result.",
        "corrections":[],
        "disclaimer":"Estimated score, not an official result."
      }
    }'::jsonb,
    '[{"category":"grammar","example":"we goes","correction":"we go"}]'::jsonb
  );

  if first_result ->> 'sessionId' is null then
    raise exception 'successful RPC must return its persisted evaluation';
  end if;

  retry_result := public.save_evaluation_atomically(
    test_user_id,
    request_id,
    'speaking',
    '{
      "prompt":"This payload must be ignored on replay.",
      "transcript":"This payload must be ignored on replay.",
      "scores":{},
      "feedback":{}
    }'::jsonb,
    '[]'::jsonb
  );

  if retry_result is distinct from first_result then
    raise exception 'retry must return the original evaluation result';
  end if;

  if (
    select count(*)
    from public.speaking_sessions
    where user_id = test_user_id
  ) <> 1 then
    raise exception 'retry duplicated the speaking evaluation';
  end if;

  if (
    select count(*)
    from public.error_patterns
    where user_id = test_user_id
      and category = 'grammar'
      and correction = 'we go'
      and count = 1
  ) <> 1 then
    raise exception 'retry duplicated the error-pattern increment';
  end if;

  select activity.minutes
    into activity_minutes
  from public.daily_activity as activity
  where activity.user_id = test_user_id
    and activity.date = (now() at time zone 'America/Bogota')::date;

  if activity_minutes <> 1 then
    raise exception 'retry duplicated the daily-activity increment';
  end if;

  begin
    perform public.save_evaluation_atomically(
      test_user_id,
      failed_request_id,
      'writing',
      '{
        "exam_mode":"ielts",
        "prompt":"Describe a change.",
        "response":"A short response.",
        "word_count":3,
        "scores":{"criteria":{},"estimatedBand":6},
        "feedback":{}
      }'::jsonb,
      '[
        {"category":"grammar","example":"we goes","correction":"we go"},
        {"category":"","example":"invalid","correction":"invalid"}
      ]'::jsonb
    );
    raise exception 'expected invalid patterns to abort the RPC';
  exception
    when others then
      if sqlerrm <> 'Each error pattern requires category, example, and correction' then
        raise;
      end if;
  end;

  if exists (
    select 1
    from public.writing_submissions
    where user_id = test_user_id
  ) then
    raise exception 'mid-transaction failure left a writing evaluation';
  end if;

  if (
    select count(*)
    from public.error_patterns
    where user_id = test_user_id
  ) <> 1 then
    raise exception 'mid-transaction failure left error-pattern changes';
  end if;

  if (
    select count(*)
    from public.evaluation_request_keys
    where user_id = test_user_id
  ) <> 1 then
    raise exception 'mid-transaction failure left an idempotency reservation';
  end if;

  select activity.minutes
    into activity_minutes
  from public.daily_activity as activity
  where activity.user_id = test_user_id
    and activity.date = (now() at time zone 'America/Bogota')::date;

  if activity_minutes <> 1 then
    raise exception 'mid-transaction failure changed daily activity';
  end if;
end
$$;

rollback;
