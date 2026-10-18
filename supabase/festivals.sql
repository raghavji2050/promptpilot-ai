-- Optional admin override table for festival dates and campaign windows.
-- The app reads it (anon, read-only) and merges rows over src/lib/festivals/data.ts.
-- Edit rows in the Supabase table editor; changes appear within ~1 hour (ISR cache).
-- Only slugs that exist in data.ts are used; invalid or inconsistent rows are ignored.
create table if not exists public.festivals (
  slug text not null,
  year int not null check (year between 2020 and 2100),
  start_date date,
  end_date date,
  primary_date date,
  status text check (status in ('verified', 'provisional')),
  note text check (char_length(note) <= 500),
  sources text[],
  last_verified date,
  campaign_start date,
  campaign_end date,
  hidden boolean default false,
  updated_at timestamptz not null default now(),
  primary key (slug, year),
  check (start_date is null or end_date is null or start_date <= end_date)
);

alter table public.festivals enable row level security;

-- Public read; no public writes (admins edit through the dashboard / service role).
drop policy if exists "festivals are readable" on public.festivals;
create policy "festivals are readable" on public.festivals for select using (true);
grant select on public.festivals to anon, authenticated;

-- Example: correct Govardhan Puja 2026 to 10 Nov and mark it verified.
-- insert into public.festivals (slug, year, primary_date, start_date, end_date, status, note, last_verified)
-- values ('govardhan-puja', 2026, '2026-11-10', '2026-11-10', '2026-11-10', 'verified', 'Corrected by admin', '2026-10-20')
-- on conflict (slug, year) do update set primary_date = excluded.primary_date, start_date = excluded.start_date,
--   end_date = excluded.end_date, status = excluded.status, note = excluded.note, last_verified = excluded.last_verified, updated_at = now();
