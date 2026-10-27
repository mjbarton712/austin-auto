-- media had row-level security off and full grants for anon, so anyone holding
-- the (public) anon key could read, edit or delete every photo record.
-- Access now follows job ownership, matching the cars_new / jobs policies.

alter table public.media enable row level security;

drop policy if exists "Users manage media for their own jobs" on public.media;
create policy "Users manage media for their own jobs" on public.media
  for all to authenticated
  using (exists (select 1 from public.jobs j where j.id = media.job_id and j.user_id = auth.uid()))
  with check (exists (select 1 from public.jobs j where j.id = media.job_id and j.user_id = auth.uid()));

revoke all on public.media from anon;
