-- Single key/value store for admin-editable configs that need to sync across devices:
--   * pricing_config            — Pricing Settings tab
--   * event_margin_config       — Event Margin tab (annual + per-event costs, buildings)
--   * manager_salary_settings   — Manager tab settings (commission %, season dates, monthly fee)
-- Manager *payments* live in their own table (manager_payment_log), not here.

create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists app_settings_key_idx on public.app_settings (key);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_select" on public.app_settings;
drop policy if exists "app_settings_insert" on public.app_settings;
drop policy if exists "app_settings_update" on public.app_settings;
drop policy if exists "app_settings_delete" on public.app_settings;

create policy "app_settings_select" on public.app_settings for select using (true);
create policy "app_settings_insert" on public.app_settings for insert with check (true);
create policy "app_settings_update" on public.app_settings for update using (true);
create policy "app_settings_delete" on public.app_settings for delete using (true);

-- Auto-bump updated_at on UPDATE
create or replace function public.tg_app_settings_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_settings_touch on public.app_settings;
create trigger app_settings_touch
  before update on public.app_settings
  for each row execute function public.tg_app_settings_touch();
