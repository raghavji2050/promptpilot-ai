-- PromptPilot: free "Run" quota (anonymous per hashed IP + logged-in users) and llm_calls enum extension.
-- Apply once in the Supabase SQL editor (after schema.sql). Idempotent. Service role only.

create table if not exists public.run_quota (
  day      date not null,
  subject  text not null check (char_length(subject) <= 80),  -- 'ip:<sha256(daily salt + ip)>' | 'u:<user uuid>' | '__site__'
  kind     text not null check (kind in ('text','image')),
  count    int  not null default 0 check (count >= 0),
  primary key (day, subject, kind)
);
alter table public.run_quota enable row level security;   -- no policies: not readable by anon/authenticated
revoke all on public.run_quota from anon, authenticated;

-- Atomically consume one run: checks the per-subject limit and the site-wide cap, then increments both.
create or replace function public.consume_run_quota(p_day date, p_subject text, p_kind text, p_limit int, p_site_cap int)
returns table (allowed boolean, reason text, remaining int)
language plpgsql security definer set search_path = public as $$
declare v_used int; v_site int;
begin
  if p_kind not in ('text','image') or p_subject = '__site__' then raise exception 'BAD_INPUT'; end if;
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
