-- Simple manager-payments log used by the Manager Salary tab.
-- (The pre-existing manager_payments table requires a compensation_id and is
--  unused by the UI; this is a standalone log so payments sync across devices.)

create table if not exists public.manager_payment_log (
  id                  uuid primary key default gen_random_uuid(),
  date                timestamptz not null,
  amount              numeric(12, 2) not null,
  payment_method      text not null,
  reference_number    text,
  type                text not null check (type in ('maintenance', 'commission', 'other')),
  related_booking_id  uuid references public.bookings(id) on delete set null,
  notes               text,
  created_at          timestamptz not null default now()
);

create index if not exists manager_payment_log_date_idx
  on public.manager_payment_log (date desc);
create index if not exists manager_payment_log_booking_idx
  on public.manager_payment_log (related_booking_id);

alter table public.manager_payment_log enable row level security;

drop policy if exists "manager_payment_log_select" on public.manager_payment_log;
drop policy if exists "manager_payment_log_insert" on public.manager_payment_log;
drop policy if exists "manager_payment_log_update" on public.manager_payment_log;
drop policy if exists "manager_payment_log_delete" on public.manager_payment_log;

create policy "manager_payment_log_select" on public.manager_payment_log for select using (true);
create policy "manager_payment_log_insert" on public.manager_payment_log for insert with check (true);
create policy "manager_payment_log_update" on public.manager_payment_log for update using (true);
create policy "manager_payment_log_delete" on public.manager_payment_log for delete using (true);
