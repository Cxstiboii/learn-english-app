create table public.evaluation_request_keys (
  user_id uuid not null references auth.users (id) on delete cascade,
  idempotency_key uuid not null,
  evaluation_type text not null check (
    evaluation_type in ('speaking', 'writing', 'interview')
  ),
  evaluation_id uuid,
  created_at timestamptz not null default now(),
  primary key (user_id, idempotency_key)
);

alter table public.evaluation_request_keys enable row level security;

revoke all on table public.evaluation_request_keys
  from public, anon, authenticated, service_role;
grant select, insert, update on table public.evaluation_request_keys to service_role;

create policy "Service role manages evaluation idempotency keys"
  on public.evaluation_request_keys for all to service_role
  using (true)
  with check (true);

create or replace function public.save_evaluation_atomically(
  p_user_id uuid,
  p_idempotency_key uuid,
  p_evaluation_type text,
  p_evaluation jsonb,
  p_patterns jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_evaluation_id uuid;
  existing_type text;
  affected_rows integer;
  response jsonb;
begin
  if p_user_id is null or p_idempotency_key is null then
    raise exception 'User and idempotency key are required';
  end if;

  if p_evaluation_type is null
    or p_evaluation_type not in ('speaking', 'writing', 'interview')
  then
    raise exception 'Unsupported evaluation type';
  end if;

  if jsonb_typeof(p_evaluation) is distinct from 'object' then
    raise exception 'p_evaluation must be a JSON object';
  end if;

  insert into public.evaluation_request_keys (
    user_id,
    idempotency_key,
    evaluation_type
  )
  values (
    p_user_id,
    p_idempotency_key,
    p_evaluation_type
  )
  on conflict (user_id, idempotency_key) do nothing;

  get diagnostics affected_rows = row_count;

  if affected_rows = 0 then
    select request.evaluation_type, request.evaluation_id
      into existing_type, v_evaluation_id
    from public.evaluation_request_keys as request
    where request.user_id = p_user_id
      and request.idempotency_key = p_idempotency_key
    for update;

    if not found or v_evaluation_id is null then
      raise exception 'Evaluation request is incomplete';
    end if;

    if existing_type <> p_evaluation_type then
      raise exception 'Idempotency key was already used for another evaluation';
    end if;
  else
    if p_evaluation_type = 'speaking' then
      insert into public.speaking_sessions (
        user_id,
        prompt,
        transcript,
        scores,
        feedback
      )
      values (
        p_user_id,
        p_evaluation ->> 'prompt',
        p_evaluation ->> 'transcript',
        p_evaluation -> 'scores',
        p_evaluation -> 'feedback'
      )
      returning id into v_evaluation_id;
    elsif p_evaluation_type = 'writing' then
      insert into public.writing_submissions (
        user_id,
        exam_mode,
        prompt,
        response,
        word_count,
        scores,
        feedback
      )
      values (
        p_user_id,
        p_evaluation ->> 'exam_mode',
        p_evaluation ->> 'prompt',
        p_evaluation ->> 'response',
        (p_evaluation ->> 'word_count')::integer,
        p_evaluation -> 'scores',
        p_evaluation -> 'feedback'
      )
      returning id into v_evaluation_id;
    else
      insert into public.interview_sessions (
        user_id,
        track,
        questions,
        answers,
        evaluation
      )
      values (
        p_user_id,
        p_evaluation ->> 'track',
        p_evaluation -> 'questions',
        p_evaluation -> 'answers',
        p_evaluation -> 'evaluation'
      )
      returning id into v_evaluation_id;
    end if;

    perform public.record_error_patterns(p_user_id, p_patterns);
    perform public.log_daily_activity(p_user_id, 1);

    update public.evaluation_request_keys
    set evaluation_id = v_evaluation_id
    where user_id = p_user_id
      and idempotency_key = p_idempotency_key;
  end if;

  if p_evaluation_type = 'speaking' then
    select jsonb_build_object('sessionId', session.id)
        || (session.scores - 'durationSeconds')
        || session.feedback
      into response
    from public.speaking_sessions as session
    where session.id = v_evaluation_id
      and session.user_id = p_user_id;
  elsif p_evaluation_type = 'writing' then
    select jsonb_build_object(
        'submissionId', submission.id,
        'scores', submission.scores -> 'criteria',
        'estimatedBand', submission.scores -> 'estimatedBand',
        'wordCount', submission.word_count
      ) || submission.feedback
      into response
    from public.writing_submissions as submission
    where submission.id = v_evaluation_id
      and submission.user_id = p_user_id;
  else
    select session.evaluation || jsonb_build_object('sessionId', session.id)
      into response
    from public.interview_sessions as session
    where session.id = v_evaluation_id
      and session.user_id = p_user_id;
  end if;

  if response is null then
    raise exception 'Saved evaluation could not be loaded';
  end if;

  return response;
end;
$$;

revoke all on function public.save_evaluation_atomically(uuid, uuid, text, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.save_evaluation_atomically(uuid, uuid, text, jsonb, jsonb)
  to service_role;
