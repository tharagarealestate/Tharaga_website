create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  city text not null,
  images jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,
  email text not null,
  message text,
  created_at timestamptz default now()
);
