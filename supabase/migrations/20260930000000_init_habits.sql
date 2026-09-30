-- Ember: habits + daily completions, scoped per user via RLS.

create table public.habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  icon        text not null default 'sparkles',
  color       text not null default 'ember',
  position    integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);

create index habits_user_id_idx on public.habits (user_id, position);

create table public.completions (
  habit_id   uuid not null references public.habits (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date       date not null,
  created_at timestamptz not null default now(),
  primary key (habit_id, date)
);

create index completions_user_date_idx on public.completions (user_id, date);

alter table public.habits enable row level security;
alter table public.completions enable row level security;

create policy "habits: owner select" on public.habits
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "habits: owner insert" on public.habits
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "habits: owner update" on public.habits
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "habits: owner delete" on public.habits
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "completions: owner select" on public.completions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "completions: owner insert" on public.completions
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid()))
  );
create policy "completions: owner delete" on public.completions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Only authenticated users get table access; anon gets nothing.
revoke all on public.habits, public.completions from anon;
grant select, insert, update, delete on public.habits to authenticated;
grant select, insert, delete on public.completions to authenticated;
