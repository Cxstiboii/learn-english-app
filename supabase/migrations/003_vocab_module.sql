create unique index if not exists vocab_cards_user_normalized_term_key
  on public.vocab_cards (user_id, lower(btrim(term)));

create table public.vocab_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vocab_card_id uuid not null references public.vocab_cards (id) on delete cascade,
  rating text not null check (rating in ('again', 'hard', 'good', 'easy')),
  created_at timestamptz not null default now()
);

create index vocab_reviews_user_created_at_idx
  on public.vocab_reviews (user_id, created_at);

alter table public.vocab_reviews enable row level security;

create policy "Users can read their own vocabulary review history"
  on public.vocab_reviews for select to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.vocab_reviews to authenticated;

create or replace function public.record_vocab_review(
  p_user_id uuid,
  p_card_id uuid,
  p_rating text,
  p_ease_factor numeric,
  p_interval_days integer,
  p_repetitions integer,
  p_due_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_rating not in ('again', 'hard', 'good', 'easy') then
    raise exception 'Invalid vocabulary review rating';
  end if;
  if p_ease_factor < 1.3 or p_interval_days < 0 or p_repetitions < 0 then
    raise exception 'Invalid spaced repetition values';
  end if;

  update public.vocab_cards
  set ease_factor = p_ease_factor,
      interval_days = p_interval_days,
      repetitions = p_repetitions,
      due_at = p_due_at
  where id = p_card_id
    and user_id = p_user_id;

  if not found then
    raise exception 'Vocabulary card not found';
  end if;

  insert into public.vocab_reviews (user_id, vocab_card_id, rating)
  values (p_user_id, p_card_id, p_rating);
end;
$$;

revoke all on function public.record_vocab_review(uuid, uuid, text, numeric, integer, integer, timestamptz)
  from public, anon, authenticated;
grant execute on function public.record_vocab_review(uuid, uuid, text, numeric, integer, integer, timestamptz)
  to service_role;
