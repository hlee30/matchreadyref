-- Run once in the Supabase SQL Editor after the existing schema.sql.
-- Saving a question is independent of marking it completed.
create table if not exists public.saved_questions (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  saved_at timestamptz not null default now(),
  primary key (user_id, question_id),
  constraint saved_question_id_valid check (question_id ~ '^law-[0-9]+-faq-[0-9]+$')
);
alter table public.saved_questions enable row level security;

create policy "Paid user can read own saved questions" on public.saved_questions for select to authenticated
  using ((select auth.uid()) = user_id and exists
    (select 1 from public.account_entitlements e where e.user_id = (select auth.uid())));
create policy "Paid user can save own questions" on public.saved_questions for insert to authenticated
  with check ((select auth.uid()) = user_id and exists
    (select 1 from public.account_entitlements e where e.user_id = (select auth.uid())));
create policy "Paid user can remove own saved questions" on public.saved_questions for delete to authenticated
  using ((select auth.uid()) = user_id and exists
    (select 1 from public.account_entitlements e where e.user_id = (select auth.uid())));

grant select, insert, delete on public.saved_questions to authenticated;
