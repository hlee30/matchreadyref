-- Run once in the Supabase SQL Editor. These policies enforce paid access server-side.
create table if not exists public.account_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_checkout_session_id text unique not null,
  stripe_payment_intent_id text unique,
  purchased_at timestamptz not null default now()
);
alter table public.account_entitlements enable row level security;
create policy "Read own purchase" on public.account_entitlements for select to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.question_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  completed boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id),
  constraint valid_question_id check (question_id ~ '^law-[0-9]+-faq-[0-9]+$')
);
alter table public.question_progress enable row level security;
create policy "Paid user can read own progress" on public.question_progress for select to authenticated
  using ((select auth.uid()) = user_id and exists
    (select 1 from public.account_entitlements e where e.user_id = (select auth.uid())));
create policy "Paid user can insert own progress" on public.question_progress for insert to authenticated
  with check ((select auth.uid()) = user_id and exists
    (select 1 from public.account_entitlements e where e.user_id = (select auth.uid())));
create policy "Paid user can update own progress" on public.question_progress for update to authenticated
  using ((select auth.uid()) = user_id and exists
    (select 1 from public.account_entitlements e where e.user_id = (select auth.uid())))
  with check ((select auth.uid()) = user_id and exists
    (select 1 from public.account_entitlements e where e.user_id = (select auth.uid())));
create policy "Paid user can delete own progress" on public.question_progress for delete to authenticated
  using ((select auth.uid()) = user_id and exists
    (select 1 from public.account_entitlements e where e.user_id = (select auth.uid())));

grant select on public.account_entitlements to authenticated;
grant select, insert, update, delete on public.question_progress to authenticated;
