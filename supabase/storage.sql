insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict do nothing;

alter table storage.objects enable row level security;

create policy "recordings insert own" on storage.objects
for insert
with check (
  bucket_id = 'recordings'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "recordings select for teachers" on storage.objects
for select
using (
  bucket_id = 'recordings'
  and exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'teacher'
  )
);
