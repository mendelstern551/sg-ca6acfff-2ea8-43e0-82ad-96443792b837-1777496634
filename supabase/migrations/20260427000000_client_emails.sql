-- Run in Supabase SQL Editor (Dashboard → SQL → New query → paste → Run)
-- Creates the client_emails table that powers Client Communications + the scheduled-email runner.

create table if not exists public.client_emails (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid references public.bookings(id) on delete cascade,
  client_name   text not null,
  client_email  text not null,
  email_type    text not null check (email_type in ('parking_regulations','website_info','rental_agreement','custom')),
  subject       text not null,
  body          text not null,
  attachment_url  text,
  attachment_name text,
  status        text not null check (status in ('scheduled','sent','failed')) default 'sent',
  scheduled_date timestamptz,
  sent_date     timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists client_emails_booking_id_idx on public.client_emails (booking_id);
create index if not exists client_emails_status_scheduled_idx on public.client_emails (status, scheduled_date);

alter table public.client_emails enable row level security;

-- Permissive policies (matches the rest of the schema). Tighten later if you add auth.
drop policy if exists "client_emails_select" on public.client_emails;
drop policy if exists "client_emails_insert" on public.client_emails;
drop policy if exists "client_emails_update" on public.client_emails;
drop policy if exists "client_emails_delete" on public.client_emails;

create policy "client_emails_select" on public.client_emails for select using (true);
create policy "client_emails_insert" on public.client_emails for insert with check (true);
create policy "client_emails_update" on public.client_emails for update using (true);
create policy "client_emails_delete" on public.client_emails for delete using (true);
