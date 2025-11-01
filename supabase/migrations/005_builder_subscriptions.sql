-- Builder trial subscriptions
create table if not exists public.builder_subscriptions (
  builder_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'trial',
  status text not null default 'active',
  trial_started_at timestamptz not null default now(),
  trial_expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_builder_subs_tier on public.builder_subscriptions(tier);

create or replace function public.set_updated_at_builder_subs()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_builder_subs_updated
before update on public.builder_subscriptions
for each row execute procedure public.set_updated_at_builder_subs();

alter table public.builder_subscriptions enable row level security;
create policy "own builder sub read" on public.builder_subscriptions for select using (
  auth.uid() = builder_id
);
create policy "service insert/update" on public.builder_subscriptions for insert with check (true);
create policy "service insert/update 2" on public.builder_subscriptions for update using (true);

