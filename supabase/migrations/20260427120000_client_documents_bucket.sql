-- Run in Supabase SQL Editor (Dashboard → SQL → New query → paste → Run)
-- Creates the public `client-documents` storage bucket used by Client Communications
-- for agreement uploads and custom-email attachments.

insert into storage.buckets (id, name, public)
values ('client-documents', 'client-documents', true)
on conflict (id) do update set public = excluded.public;

-- Permissive RLS — public read, anyone authenticated can upload/update/delete inside this bucket.
-- Tighten later if you add real auth.
drop policy if exists "client_documents_read"   on storage.objects;
drop policy if exists "client_documents_insert" on storage.objects;
drop policy if exists "client_documents_update" on storage.objects;
drop policy if exists "client_documents_delete" on storage.objects;

create policy "client_documents_read"
  on storage.objects for select
  using (bucket_id = 'client-documents');

create policy "client_documents_insert"
  on storage.objects for insert
  with check (bucket_id = 'client-documents');

create policy "client_documents_update"
  on storage.objects for update
  using (bucket_id = 'client-documents');

create policy "client_documents_delete"
  on storage.objects for delete
  using (bucket_id = 'client-documents');
