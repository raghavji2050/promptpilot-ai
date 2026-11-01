-- PromptPilot: PASTE ME — pending SQL for Raghav (generated 1 Nov 2026).
-- Open Supabase dashboard → SQL Editor → New query → paste this whole file → Run. Idempotent (safe to re-run).
-- Contains: 1) run-quota.sql (Run quota + API rate-limit daily caps for /api/enhance, /api/card)  2) pro-waitlist.sql
-- Rate limits work without this (in-memory fallback); applying it + setting SUPABASE_SERVICE_ROLE_KEY in Vercel makes daily caps shared across instances.

-- ===== 1) run-quota.sql =====
-- PromptPilot: free "Run" quota (anonymous per hashed IP + logged-in users) and llm_calls enum extension.
-- Apply once in the Supabase SQL editor (after schema.sql). Idempotent. Service role only.

create table if not exists public.run_quota (
  day      date not null,
  subject  text not null check (char_length(subject) <= 80),  -- 'ip:<sha256(daily salt + ip)>' | 'u:<user uuid>' | '__site__'
  kind     text not null,  -- 'text' | 'image' (Run) | 'enhance' | 'card' (API rate-limit daily caps)
  count    int  not null default 0 check (count >= 0),
  primary key (day, subject, kind)
);
alter table public.run_quota drop constraint if exists run_quota_kind_check;
alter table public.run_quota add constraint run_quota_kind_check check (kind in ('text','image','enhance','card'));
alter table public.run_quota enable row level security;   -- no policies: not readable by anon/authenticated
revoke all on public.run_quota from anon, authenticated;

-- Atomically consume one run: checks the per-subject limit and the site-wide cap, then increments both.
create or replace function public.consume_run_quota(p_day date, p_subject text, p_kind text, p_limit int, p_site_cap int)
returns table (allowed boolean, reason text, remaining int)
language plpgsql security definer set search_path = public as $$
declare v_used int; v_site int;
begin
  if p_kind not in ('text','image','enhance','card') or p_subject = '__site__' then raise exception 'BAD_INPUT'; end if;
  insert into run_quota(day, subject, kind) values (p_day, '__site__', p_kind), (p_day, p_subject, p_kind)
    on conflict do nothing;
  -- lock site row first, then subject row (consistent order avoids deadlocks)
  select count into v_site from run_quota where day = p_day and subject = '__site__' and kind = p_kind for update;
  select count into v_used from run_quota where day = p_day and subject = p_subject and kind = p_kind for update;
  if v_used >= p_limit then return query select false, 'QUOTA'::text, 0; return; end if;
  if v_site >= p_site_cap then return query select false, 'SITE_CAP'::text, greatest(p_limit - v_used, 0); return; end if;
  update run_quota set count = count + 1 where day = p_day and kind = p_kind and subject in ('__site__', p_subject);
  return query select true, null::text, p_limit - v_used - 1;
end $$;

-- Refund one run when every provider failed.
create or replace function public.release_run_quota(p_day date, p_subject text, p_kind text)
returns void language sql security definer set search_path = public as $$
  update run_quota set count = greatest(count - 1, 0)
  where day = p_day and kind = p_kind and subject in ('__site__', p_subject);
$$;

-- Old rows are useless after the day ends (salt rotates daily). Optional cleanup:
create or replace function public.purge_run_quota() returns void language sql security definer set search_path = public as $$
  delete from run_quota where day < current_date - 2;
$$;

revoke all on function public.consume_run_quota(date, text, text, int, int) from public, anon, authenticated;
revoke all on function public.release_run_quota(date, text, text) from public, anon, authenticated;
revoke all on function public.purge_run_quota() from public, anon, authenticated;
grant execute on function public.consume_run_quota(date, text, text, int, int) to service_role;
grant execute on function public.release_run_quota(date, text, text) to service_role;
grant execute on function public.purge_run_quota() to service_role;
grant select, insert, update, delete on public.run_quota to service_role;

-- llm_calls: allow free-run metadata (no prompts stored).
alter table public.llm_calls drop constraint if exists llm_calls_mode_check;
alter table public.llm_calls add constraint llm_calls_mode_check check (mode in ('hosted','byok','free'));
alter table public.llm_calls drop constraint if exists llm_calls_provider_check;
alter table public.llm_calls add constraint llm_calls_provider_check
  check (provider in ('openai','anthropic','xai','openai_compatible','groq','workers_ai','gemini'));

-- ===== 2) pro-waitlist.sql =====
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
