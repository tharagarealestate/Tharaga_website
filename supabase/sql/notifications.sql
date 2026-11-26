-- Notifications and Web Push Subscriptions schema
-- Run in Supabase SQL editor or via Supabase CLI

-- Ensure UUID generation function is available
create extension if not exists pgcrypto;

-- 1) In-app notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('new_lead','site_visit','trial_expiry','payment')),
  title text not null,
  message text not null,
  read boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create index if not exists notifications_user_id_created_at_idx on public.notifications(user_id, created_at desc);

-- Ensure realtime publication includes notifications for postgres_changes
do $$ begin
  perform 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications';
  if not found then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
end $$;

-- Policies: users can read their own notifications
drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications
  for select
  using (auth.uid() = user_id);

-- Users can mark their own notifications read
drop policy if exists "Users can update own notifications read" on public.notifications;
create policy "Users can update own notifications read"
  on public.notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Inserts are intended from server-side (service role). No public insert policy.

-- 2) Web Push subscriptions
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);

-- Optional uniqueness by endpoint if present
create unique index if not exists push_subscriptions_endpoint_unique
  on public.push_subscriptions( (subscription->>'endpoint') )
  where (subscription ? 'endpoint');

-- Policies: users manage their own subscriptions
drop policy if exists "Users can read own push subscriptions" on public.push_subscriptions;
create policy "Users can read own push subscriptions"
  on public.push_subscriptions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own push subscriptions" on public.push_subscriptions;
create policy "Users can insert own push subscriptions"
  on public.push_subscriptions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own push subscriptions" on public.push_subscriptions;
create policy "Users can update own push subscriptions"
  on public.push_subscriptions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own push subscriptions" on public.push_subscriptions;
create policy "Users can delete own push subscriptions"
  on public.push_subscriptions
  for delete
  using (auth.uid() = user_id);


