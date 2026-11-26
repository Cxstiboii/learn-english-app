create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  current_level text not null default 'B1',
  target_level text not null default 'B2',
  daily_goal_minutes integer not null default 60 check (daily_goal_minutes > 0),
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  corrections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.vocab_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  term text not null,
  definition text not null,
  example text,
  deck text,
  ease_factor numeric not null default 2.5,
  interval_days integer not null default 0,
  repetitions integer not null default 0,
  due_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (ease_factor > 0),
  check (interval_days >= 0),
  check (repetitions >= 0)
);

create table public.error_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  example text not null,
  correction text not null,
  count integer not null default 1 check (count > 0),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question jsonb not null,
  created_at timestamptz not null default now()
);

create table public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid references public.exercises (id) on delete set null,
  selected_option text,
  is_correct boolean,
  created_at timestamptz not null default now()
);

create table public.speaking_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt text not null,
  transcript text,
  scores jsonb not null default '{}'::jsonb,
  feedback jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.writing_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_mode text not null,
  prompt text not null,
  response text not null,
  word_count integer not null default 0 check (word_count >= 0),
  scores jsonb not null default '{}'::jsonb,
  feedback jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  track text not null,
  questions jsonb not null default '[]'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  evaluation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.study_units (
  id text primary key,
  unit_number integer not null unique,
  level text not null,
  filter_levels text[] not null default '{}',
  title text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table public.study_activities (
  id text primary key,
  unit_id text not null references public.study_units (id) on delete cascade,
  position integer not null,
  title text not null,
  activity_type text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  phrase text not null,
  practice_key text not null,
  created_at timestamptz not null default now(),
  unique (unit_id, position)
);

create table public.user_activity_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_id text not null references public.study_activities (id) on delete cascade,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, activity_id)
);

create table public.daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  minutes integer not null default 0 check (minutes >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create index vocab_cards_user_due_at_idx
  on public.vocab_cards (user_id, due_at);
create index error_patterns_user_count_idx
  on public.error_patterns (user_id, count);
create index messages_conversation_created_at_idx
  on public.messages (conversation_id, created_at);
create index study_activities_unit_position_idx
  on public.study_activities (unit_id, position);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'display_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.vocab_cards enable row level security;
alter table public.error_patterns enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_attempts enable row level security;
alter table public.speaking_sessions enable row level security;
alter table public.writing_submissions enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.study_units enable row level security;
alter table public.study_activities enable row level security;
alter table public.user_activity_progress enable row level security;
alter table public.daily_activity enable row level security;

create policy "Users can manage their own profile"
  on public.profiles for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can manage their own conversations"
  on public.conversations for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage their own messages"
  on public.messages for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = (select auth.uid())
    )
  );

create policy "Users can manage their own vocabulary cards"
  on public.vocab_cards for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage their own error patterns"
  on public.error_patterns for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage their own exercises"
  on public.exercises for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage their own exercise attempts"
  on public.exercise_attempts for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      exercise_id is null
      or exists (
        select 1
        from public.exercises
        where exercises.id = exercise_attempts.exercise_id
          and exercises.user_id = (select auth.uid())
      )
    )
  );

create policy "Users can manage their own speaking sessions"
  on public.speaking_sessions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage their own writing submissions"
  on public.writing_submissions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage their own interview sessions"
  on public.interview_sessions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Authenticated users can read study units"
  on public.study_units for select to authenticated
  using (true);

create policy "Authenticated users can read study activities"
  on public.study_activities for select to authenticated
  using (true);

create policy "Users can manage their own activity progress"
  on public.user_activity_progress for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage their own daily activity"
  on public.daily_activity for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.conversations,
  public.messages,
  public.vocab_cards,
  public.error_patterns,
  public.exercises,
  public.exercise_attempts,
  public.speaking_sessions,
  public.writing_submissions,
  public.interview_sessions,
  public.user_activity_progress,
  public.daily_activity
to authenticated;
grant select on public.study_units, public.study_activities to authenticated;
