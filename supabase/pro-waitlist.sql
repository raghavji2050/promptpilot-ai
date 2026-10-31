-- Pro waitlist (item 5, audit fixes). Apply once in Supabase SQL editor.
-- anon/authenticated may INSERT only. No SELECT/UPDATE/DELETE policies, so nobody can read the list via the API.
create table if not exists public.pro_waitlist (
  id bigint generated always as identity primary key,
  email text not null check (length(email) between 5 and 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  consent boolean not null check (consent),
  source text not null default 'pricing' check (length(source) <= 40),
  created_at timestamptz not null default now()
);
create unique index if not exists pro_waitlist_email_uniq on public.pro_waitlist (lower(email));
alter table public.pro_waitlist enable row level security;
revoke all on public.pro_waitlist from anon, authenticated;
grant insert (email, consent, source) on public.pro_waitlist to anon, authenticated;
drop policy if exists "waitlist insert only" on public.pro_waitlist;
create policy "waitlist insert only" on public.pro_waitlist for insert to anon, authenticated with check (consent);
