-- Create profiles table and a safe trigger to populate it from auth.users
-- This avoids signup failures due to strict constraints or failing triggers.

-- 1) profiles table (in public schema)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Keep email unique only if not null to avoid conflicts with social providers missing email
create unique index if not exists profiles_email_unique on public.profiles(email) where email is not null;

-- 2) updated_at maintenance trigger
create or replace function public.handle_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;$$;

drop trigger if exists on_profiles_updated_at on public.profiles;
create trigger on_profiles_updated_at
before update on public.profiles
for each row execute function public.handle_profiles_updated_at();

-- 3) Safe mirror from auth.users -> public.profiles
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_email text;
  v_name text;
  v_avatar text;
begin
  -- Extract optional values from raw_user_meta_data
  begin
    v_email := new.email;
  exception when others then
    v_email := null;
  end;

  begin
    v_name := coalesce((new.raw_user_meta_data ->> 'full_name'), (new.raw_user_meta_data ->> 'name'));
  exception when others then
    v_name := null;
  end;

  begin
    v_avatar := (new.raw_user_meta_data ->> 'avatar_url');
  exception when others then
    v_avatar := null;
  end;

  -- Insert if not exists; never raise on conflict
  insert into public.profiles(id, email, full_name, avatar_url)
  values (new.id, v_email, v_name, v_avatar)
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();

  return new;
exception when others then
  -- Swallow any unexpected error to avoid breaking auth signup
  return new;
end;$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 4) RLS: allow users to view and update their own profile
alter table public.profiles enable row level security;

do $$ begin
  perform 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Public profiles are viewable by authenticated users';
  if not found then
    create policy "Public profiles are viewable by authenticated users"
      on public.profiles for select using ( auth.uid() is not null );
  end if;
end $$;

do $$ begin
  perform 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can update own profile';
  if not found then
    create policy "Users can update own profile"
      on public.profiles for update using ( auth.uid() = id ) with check ( auth.uid() = id );
  end if;
end $$;

