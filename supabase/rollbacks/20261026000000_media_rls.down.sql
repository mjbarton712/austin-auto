-- Restores media to its previous (open) state. Only use if the RLS policy
-- breaks the app and you need to get back to working immediately.
drop policy if exists "Users manage media for their own jobs" on public.media;
alter table public.media disable row level security;
grant select, insert, update, delete, references, trigger, truncate on public.media to anon;
