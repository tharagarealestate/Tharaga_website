-- Allow users to insert their own notifications (optional; useful for client-side testing)
create policy if not exists "Users can insert own notifications"
  on public.notifications
  for insert
  with check (auth.uid() = user_id);


