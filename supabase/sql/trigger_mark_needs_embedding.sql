-- supabase/sql/trigger_mark_needs_embedding.sql
create or replace function mark_needs_embedding_fn()
returns trigger
language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    new.needs_embedding := true;
    return new;
  elsif TG_OP = 'UPDATE' then
    if new.title is distinct from old.title
       or new.description is distinct from old.description
       or new.property_type is distinct from old.property_type
       or new.city is distinct from old.city
       or new.locality is distinct from old.locality then
      new.needs_embedding := true;
      new.embedding := null;
      new.embedded_at := null;
    end if;
    return new;
  end if;
  return new;
end$$;

drop trigger if exists trg_mark_needs_embedding on properties;
create trigger trg_mark_needs_embedding
before insert or update on properties
for each row execute function mark_needs_embedding_fn();
