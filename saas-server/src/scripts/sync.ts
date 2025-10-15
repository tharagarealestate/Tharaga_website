import { query } from '../db'

async function main(){
  await query(`
  create extension if not exists "uuid-ossp";

  create table if not exists orgs (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    tier text not null default 'free',
    trial_ends_at timestamp with time zone,
    grace_until timestamp with time zone,
    billing_status text default 'inactive',
    raz_sub_id text,
    raz_customer_id text,
    created_at timestamp with time zone default now()
  );

  create table if not exists properties (
    id uuid primary key default uuid_generate_v4(),
    org_id uuid not null references orgs(id) on delete cascade,
    title text not null,
    description text not null,
    seo_summary text,
    city text,
    locality text,
    property_type text,
    bedrooms int,
    bathrooms int,
    price_inr numeric,
    sqft int,
    images jsonb not null default '[]'::jsonb,
    listing_status text not null default 'draft',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
  );

  -- Ensure extras column exists for flexible optional fields
  alter table properties add column if not exists extras jsonb not null default '{}'::jsonb;

  create table if not exists leads (
    id uuid primary key default uuid_generate_v4(),
    org_id uuid not null references orgs(id) on delete cascade,
    property_id uuid references properties(id) on delete set null,
    name text,
    email text,
    phone text,
    message text,
    intent_score numeric,
    intent_label text,
    intent_summary text,
    created_at timestamp with time zone default now()
  );

  create table if not exists usage_counters (
    org_id uuid not null references orgs(id) on delete cascade,
    period_month date not null,
    leads_count int not null default 0,
    listings_count int not null default 0,
    updated_at timestamp with time zone default now(),
    primary key (org_id, period_month)
  );

  create table if not exists webhook_events (
    id bigserial primary key,
    source text not null,
    payload jsonb not null,
    created_at timestamp with time zone default now()
  );
  `)

  // Seed demo orgs for tiers
  await query(`
    insert into orgs(id, name, tier, billing_status, trial_ends_at)
    values
      ('00000000-0000-0000-0000-000000000001','Demo Free','free','active', null),
      ('00000000-0000-0000-0000-000000000002','Demo Growth','growth','active', now() + interval '7 days'),
      ('00000000-0000-0000-0000-000000000003','Demo Pro','pro','active', null)
    on conflict (id) do nothing;
  `)

  console.log('DB sync complete')
}

main().catch(err=>{ console.error(err); process.exit(1) })
