-- Ensure documents bucket exists and is private
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update
set public = excluded.public;

-- Remove existing policies so migration stays idempotent
drop policy if exists "documents_storage_read_company" on storage.objects;
drop policy if exists "documents_storage_admin_insert" on storage.objects;
drop policy if exists "documents_storage_admin_update" on storage.objects;
drop policy if exists "documents_storage_admin_delete" on storage.objects;

-- Employees can read files from their own company folder
create policy "documents_storage_read_company"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = get_my_company_id()::text
);

-- Admin-only write access in own company folder
create policy "documents_storage_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and is_admin()
  and (storage.foldername(name))[1] = get_my_company_id()::text
);

create policy "documents_storage_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and is_admin()
  and (storage.foldername(name))[1] = get_my_company_id()::text
)
with check (
  bucket_id = 'documents'
  and is_admin()
  and (storage.foldername(name))[1] = get_my_company_id()::text
);

create policy "documents_storage_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and is_admin()
  and (storage.foldername(name))[1] = get_my_company_id()::text
);
