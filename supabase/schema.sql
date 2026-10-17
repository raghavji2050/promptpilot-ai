-- =====================================================================
-- PromptPilot AI: Supabase Postgres schema with Row Level Security
-- Target: Supabase (Postgres 15+). Run in the SQL editor or as a migration.
-- Conventions:
--   * Every table in `public` has RLS enabled. Default is deny.
--   * Content tables (library, agent templates, trends) are written only by
--     admins or the service role. They are publicly readable when published.
--   * Pro-only bodies are kept in separate tables so RLS can gate them
--     without exposing teaser metadata.
--   * Billing and plan columns are written only by the service role
--     (payment webhooks). Users cannot change their own plan.
--   * SECURITY DEFINER functions pin search_path = '' and use fully
--     qualified names.
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists pgcrypto;   -- gen_random_uuid(), gen_random_bytes()

-- ---------- Enums ----------
do $$ begin
  create type public.plan_tier       as enum ('free','pro');
  create type public.user_role       as enum ('user','admin');
  create type public.content_status  as enum ('draft','published','archived');
  create type public.library_kind    as enum ('social','developer','general','image','video');
  create type public.trend_status    as enum ('current','seasonal','evergreen','retired');
  create type public.agent_file_kind as enum ('agents_md','claude_md','cursor_mdc','subagent','slash_command','skill_md','other');
  create type public.visibility      as enum ('private','unlisted','public');
  create type public.purchase_status as enum ('pending','paid','refunded','failed');
  create type public.pay_provider    as enum ('razorpay','lemonsqueezy','paddle','manual');
  create type public.quota_action    as enum ('enhance_hosted','enhance_byok','share_create','report');
exception when duplicate_object then null; end $$;

-- ---------- Utility: updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- =====================================================================
-- 1. Profiles (1:1 with auth.users)
-- =====================================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text check (char_length(display_name) <= 60),
  avatar_url    text check (char_length(avatar_url) <= 500),
  locale        text not null default 'en' check (locale in ('en','hi')),
  role          public.user_role not null default 'user',
  plan          public.plan_tier not null default 'free',
  pro_since     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), 60))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role/plan helpers (SECURITY DEFINER so they can be used inside policies
-- without recursive RLS on profiles)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create or replace function public.is_pro()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and (p.plan = 'pro' or p.role = 'admin'));
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_pro()   from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_pro()   to anon, authenticated;

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

-- Users may update only safe columns. Enforced with column privileges below.
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Column-level privileges: role/plan/pro_since are never user-writable
revoke update on public.profiles from authenticated, anon;
grant  update (display_name, avatar_url, locale) on public.profiles to authenticated;
-- No insert/delete policies: inserts come from the trigger, deletes cascade from auth.users.

-- =====================================================================
-- 2. Target models / platforms (ChatGPT, Claude, Grok, Gemini, Perplexity,
--    Cursor, Claude Code, Midjourney, FLUX, Veo, Kling ...)
-- =====================================================================
create table if not exists public.targets (
  id            text primary key,                 -- 'claude', 'chatgpt', 'cursor', 'midjourney'
  name          text not null,
  family        text not null check (family in ('chat','coding_agent','image','video','search')),
  format_notes  text,                             -- e.g. 'Prefers XML tags'
  docs_url      text,
  last_verified date,
  sort_order    int not null default 100,
  is_active     boolean not null default true
);
alter table public.targets enable row level security;
create policy targets_read_all  on public.targets for select to anon, authenticated using (is_active or public.is_admin());
create policy targets_admin_all on public.targets for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- 3. Categories / tags
-- =====================================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  name        text not null,
  kind        public.library_kind not null,
  description text,
  sort_order  int not null default 100
);
alter table public.categories enable row level security;
create policy categories_read_all  on public.categories for select to anon, authenticated using (true);
create policy categories_admin_all on public.categories for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- 4. Trends (social prompt trends, dated and sourced)
-- =====================================================================
create table if not exists public.trends (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9-]{2,100}$'),
  name           text not null,
  status         public.trend_status not null default 'current',
  summary        text,
  source_urls    text[] not null default '{}',     -- evidence links (required by editorial policy)
  first_seen     date,
  last_verified  date,
  published      public.content_status not null default 'draft',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_trends_updated before update on public.trends
  for each row execute function public.set_updated_at();
alter table public.trends enable row level security;
create policy trends_read_published on public.trends for select to anon, authenticated
  using (published = 'published' or public.is_admin());
create policy trends_admin_all on public.trends for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- 5. Library items (social, developer, general prompts): metadata
--    is public. The body lives in library_item_bodies (gated when is_pro).
-- =====================================================================
create table if not exists public.library_items (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9-]{2,120}$'),
  kind            public.library_kind not null,
  category_id     uuid references public.categories(id) on delete set null,
  trend_id        uuid references public.trends(id) on delete set null,
  title           text not null check (char_length(title) between 3 and 140),
  summary         text check (char_length(summary) <= 400),
  preview         text check (char_length(preview) <= 600),   -- safe teaser shown to everyone
  failure_mode    text,                                         -- "what this prevents" (dev prompts)
  targets         text[] not null default '{}',                 -- target ids
  stacks          text[] not null default '{}',                 -- 'laravel','nextjs','node' (dev prompts)
  tags            text[] not null default '{}',
  locale          text not null default 'en' check (locale in ('en','hi')),
  aspect_ratio    text,                                         -- '4:5','9:16' for social
  requires_photo  boolean not null default false,
  is_pro          boolean not null default false,
  status          public.content_status not null default 'draft',
  last_verified   date,
  copy_count      bigint not null default 0,                    -- updated only via increment_copy()
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_library_kind_status on public.library_items(kind, status);
create index if not exists idx_library_tags  on public.library_items using gin (tags);
create index if not exists idx_library_stack on public.library_items using gin (stacks);
create index if not exists idx_library_trgts on public.library_items using gin (targets);
create trigger trg_library_updated before update on public.library_items
  for each row execute function public.set_updated_at();

alter table public.library_items enable row level security;
create policy library_read_published on public.library_items for select to anon, authenticated
  using (status = 'published' or public.is_admin());
create policy library_admin_all on public.library_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create table if not exists public.library_item_bodies (
  item_id     uuid primary key references public.library_items(id) on delete cascade,
  body        text not null check (char_length(body) <= 20000),
  variables   jsonb not null default '[]'::jsonb,   -- [{key,label,type,required,options}]
  notes       text,                                  -- usage tips, consent notes
  updated_at  timestamptz not null default now()
);
create trigger trg_library_bodies_updated before update on public.library_item_bodies
  for each row execute function public.set_updated_at();

alter table public.library_item_bodies enable row level security;
create policy library_body_read on public.library_item_bodies for select to anon, authenticated
  using (
    exists (
      select 1 from public.library_items li
      where li.id = item_id
        and li.status = 'published'
        and (li.is_pro = false or public.is_pro())
    ) or public.is_admin()
  );
create policy library_body_admin_all on public.library_item_bodies for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Copy counter: callable by anyone and rate-limited at the API layer. No direct UPDATE grant.
create or replace function public.increment_copy(p_item uuid)
returns void language sql security definer set search_path = '' as $$
  update public.library_items set copy_count = copy_count + 1
  where id = p_item and status = 'published';
$$;
revoke all on function public.increment_copy(uuid) from public;
grant execute on function public.increment_copy(uuid) to anon, authenticated;

-- =====================================================================
-- 6. Agent templates (coding-agent context kit)
--    agent_templates   = per-stack kit definition (public metadata)
--    agent_template_files = individual file templates (gated if is_pro)
-- =====================================================================
create table if not exists public.agent_templates (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9-]{2,120}$'),
  stack         text not null,                      -- 'laravel', 'laravel-livewire', 'nextjs', 'node-express'
  title         text not null,
  summary       text,
  questionnaire jsonb not null default '[]'::jsonb, -- stack question schema [{key,label,type,options,required,default}]
  targets       text[] not null default '{}',       -- 'cursor','claude-code','codex','copilot'
  is_pro        boolean not null default false,
  status        public.content_status not null default 'draft',
  version       int not null default 1,
  last_verified date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_agent_tpl_updated before update on public.agent_templates
  for each row execute function public.set_updated_at();
alter table public.agent_templates enable row level security;
create policy agent_tpl_read_published on public.agent_templates for select to anon, authenticated
  using (status = 'published' or public.is_admin());
create policy agent_tpl_admin_all on public.agent_templates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create table if not exists public.agent_template_files (
  id            uuid primary key default gen_random_uuid(),
  template_id   uuid not null references public.agent_templates(id) on delete cascade,
  file_kind     public.agent_file_kind not null,
  path          text not null check (path !~ '\.\.' and char_length(path) <= 200),  -- 'AGENTS.md', '.cursor/rules/laravel.mdc'
  body          text not null check (char_length(body) <= 50000),  -- template source with {{placeholders}} / {{#if}} blocks
  is_pro        boolean not null default false,                    -- file-level gate (e.g. subagents only in Pro)
  sort_order    int not null default 100,
  updated_at    timestamptz not null default now(),
  unique (template_id, path)
);
create trigger trg_agent_files_updated before update on public.agent_template_files
  for each row execute function public.set_updated_at();
alter table public.agent_template_files enable row level security;
create policy agent_files_read on public.agent_template_files for select to anon, authenticated
  using (
    exists (
      select 1 from public.agent_templates t
      where t.id = template_id
        and t.status = 'published'
        and ((t.is_pro = false and agent_template_files.is_pro = false) or public.is_pro())
    ) or public.is_admin()
  );
create policy agent_files_admin_all on public.agent_template_files for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Public teaser list of file paths (so free users can see what Pro includes
-- without reading bodies)
create or replace function public.agent_template_manifest(p_template uuid)
returns table (path text, file_kind public.agent_file_kind, is_pro boolean)
language sql stable security definer set search_path = '' as $$
  select f.path, f.file_kind, (f.is_pro or t.is_pro)
  from public.agent_template_files f
  join public.agent_templates t on t.id = f.template_id
  where t.id = p_template and t.status = 'published'
  order by f.sort_order, f.path;
$$;
revoke all on function public.agent_template_manifest(uuid) from public;
grant execute on function public.agent_template_manifest(uuid) to anon, authenticated;

-- =====================================================================
-- 7. User-owned content
-- =====================================================================
-- 7a. Saved prompts from the Builder / Enhancer / Instagram Studio
create table if not exists public.saved_prompts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title          text not null check (char_length(title) between 1 and 140),
  source         text not null check (source in ('builder','enhancer','studio','library','developer')),
  target_id      text references public.targets(id) on delete set null,
  template_key   text,                                   -- deterministic template id + version, e.g. 'chat.general@3'
  builder_input  jsonb not null default '{}'::jsonb check (pg_column_size(builder_input) <= 32768),
  output         text not null check (char_length(output) <= 40000),
  enhanced       boolean not null default false,
  visibility     public.visibility not null default 'private',
  share_slug     text unique,                            -- random, set by create_share()
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_saved_prompts_user on public.saved_prompts(user_id, created_at desc);
create trigger trg_saved_prompts_updated before update on public.saved_prompts
  for each row execute function public.set_updated_at();
alter table public.saved_prompts enable row level security;

create policy saved_select_own_or_public on public.saved_prompts for select to anon, authenticated
  using (user_id = auth.uid() or visibility = 'public');
create policy saved_insert_own on public.saved_prompts for insert to authenticated
  with check (user_id = auth.uid());
create policy saved_update_own on public.saved_prompts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy saved_delete_own on public.saved_prompts for delete to authenticated
  using (user_id = auth.uid());
-- share_slug / visibility / user_id are not directly writable (column grants in section 12);
-- sharing goes through create_share().

-- Free-plan cap on saved prompts (Pro = unlimited). The cap value is a product assumption.
create or replace function public.enforce_saved_prompt_cap()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_count int; v_pro boolean;
begin
  select exists (select 1 from public.profiles p where p.id = new.user_id and (p.plan = 'pro' or p.role = 'admin')) into v_pro;
  if not v_pro then
    select count(*) into v_count from public.saved_prompts where user_id = new.user_id;
    if v_count >= 25 then
      raise exception 'FREE_SAVE_LIMIT' using errcode = 'P0001', hint = 'Upgrade to Pro for unlimited saves';
    end if;
  end if;
  return new;
end $$;
create trigger trg_saved_prompt_cap before insert on public.saved_prompts
  for each row execute function public.enforce_saved_prompt_cap();

-- 7b. Generated agent kits (stack answers + rendered files)
create table if not exists public.agent_kits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  template_id   uuid references public.agent_templates(id) on delete set null,
  template_ver  int,
  name          text not null check (char_length(name) between 1 and 120),
  answers       jsonb not null default '{}'::jsonb check (pg_column_size(answers) <= 32768),
  files         jsonb not null default '[]'::jsonb check (pg_column_size(files) <= 262144), -- [{path, content}]
  visibility    public.visibility not null default 'private',
  share_slug    text unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_agent_kits_user on public.agent_kits(user_id, created_at desc);
create trigger trg_agent_kits_updated before update on public.agent_kits
  for each row execute function public.set_updated_at();
alter table public.agent_kits enable row level security;
create policy kits_select_own_or_public on public.agent_kits for select to anon, authenticated
  using (user_id = auth.uid() or visibility = 'public');
create policy kits_insert_own on public.agent_kits for insert to authenticated
  with check (user_id = auth.uid());
create policy kits_update_own on public.agent_kits for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy kits_delete_own on public.agent_kits for delete to authenticated
  using (user_id = auth.uid());

-- 7c. Favorites
create table if not exists public.favorites (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_id    uuid not null references public.library_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
alter table public.favorites enable row level security;
create policy fav_select_own on public.favorites for select to authenticated using (user_id = auth.uid());
create policy fav_insert_own on public.favorites for insert to authenticated with check (user_id = auth.uid());
create policy fav_delete_own on public.favorites for delete to authenticated using (user_id = auth.uid());

-- 7d. Share helpers: create an unguessable slug, and read unlisted items by slug only
create or replace function public.create_share(p_kind text, p_id uuid, p_visibility public.visibility)
returns text language plpgsql security definer set search_path = '' as $$
declare v_slug text := encode(extensions.gen_random_bytes(9), 'hex');
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_visibility = 'private' then v_slug := null; end if;
  if p_kind = 'prompt' then
    update public.saved_prompts set visibility = p_visibility, share_slug = v_slug
      where id = p_id and user_id = auth.uid();
  elsif p_kind = 'kit' then
    update public.agent_kits set visibility = p_visibility, share_slug = v_slug
      where id = p_id and user_id = auth.uid();
  else
    raise exception 'BAD_KIND';
  end if;
  if not found then raise exception 'NOT_FOUND'; end if;
  return v_slug;
end $$;
revoke all on function public.create_share(text, uuid, public.visibility) from public;
grant execute on function public.create_share(text, uuid, public.visibility) to authenticated;
-- NOTE: on Supabase, pgcrypto lives in the `extensions` schema. If your project
-- installed it elsewhere, adjust the qualified name above.

create or replace function public.get_shared_prompt(p_slug text)
returns table (title text, target_id text, output text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select title, target_id, output, created_at from public.saved_prompts
  where share_slug = p_slug and visibility in ('unlisted','public');
$$;
create or replace function public.get_shared_kit(p_slug text)
returns table (name text, files jsonb, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select name, files, created_at from public.agent_kits
  where share_slug = p_slug and visibility in ('unlisted','public');
$$;
revoke all on function public.get_shared_prompt(text) from public;
revoke all on function public.get_shared_kit(text)    from public;
grant execute on function public.get_shared_prompt(text) to anon, authenticated;
grant execute on function public.get_shared_kit(text)    to anon, authenticated;

-- =====================================================================
-- 8. Billing (written only by the service role from payment webhooks)
-- =====================================================================
create table if not exists public.purchases (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete restrict,
  provider       public.pay_provider not null,
  provider_ref   text not null,                 -- payment / order id from the provider
  sku            text not null,                 -- 'pro_lifetime_v1', 'credits_100'
  amount_minor   bigint not null check (amount_minor >= 0),  -- paise / cents
  currency       text not null check (currency ~ '^[A-Z]{3}$'),
  status         public.purchase_status not null default 'pending',
  raw_event      jsonb,                         -- webhook payload (strip PII before storing if possible)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (provider, provider_ref)               -- idempotency for webhook retries
);
create trigger trg_purchases_updated before update on public.purchases
  for each row execute function public.set_updated_at();
alter table public.purchases enable row level security;
create policy purchases_select_own on public.purchases for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
-- No insert/update/delete policies: only the service role (which bypasses RLS) writes here.

-- Webhook helper: mark paid and grant Pro atomically (called with the service role)
create or replace function public.grant_pro_from_purchase(p_provider public.pay_provider, p_ref text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
  update public.purchases set status = 'paid'
    where provider = p_provider and provider_ref = p_ref and status in ('pending','failed')
    returning user_id into v_user;
  if v_user is not null then
    update public.profiles set plan = 'pro', pro_since = coalesce(pro_since, now()) where id = v_user;
  end if;
end $$;
revoke all on function public.grant_pro_from_purchase(public.pay_provider, text) from public, anon, authenticated;
-- (service_role keeps access; it bypasses grants via its superuser-like role in Supabase)

-- =====================================================================
-- 9. Usage quotas (daily counters; the Worker rate-limit binding handles bursts)
-- =====================================================================
create table if not exists public.usage_counters (
  user_id   uuid not null references auth.users(id) on delete cascade,
  day       date not null default (now() at time zone 'utc')::date,
  action    public.quota_action not null,
  count     int not null default 0,
  primary key (user_id, day, action)
);
alter table public.usage_counters enable row level security;
create policy usage_select_own on public.usage_counters for select to authenticated using (user_id = auth.uid());
-- Writes only through consume_quota()

-- Atomically consume one unit. Returns remaining units, or -1 if over the limit.
-- Limits are product assumptions and can be tuned without schema change.
create or replace function public.consume_quota(p_action public.quota_action)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_pro   boolean;
  v_limit int;
  v_new   int;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select exists (select 1 from public.profiles p where p.id = v_uid and (p.plan='pro' or p.role='admin')) into v_pro;
  v_limit := case p_action
    when 'enhance_hosted' then case when v_pro then 50 else 3 end
    when 'enhance_byok'   then case when v_pro then 500 else 100 end
    when 'share_create'   then case when v_pro then 200 else 20 end
    when 'report'         then 20
  end;
  insert into public.usage_counters as u (user_id, day, action, count)
    values (v_uid, (now() at time zone 'utc')::date, p_action, 1)
  on conflict (user_id, day, action) do update set count = u.count + 1
    where u.count < v_limit
  returning count into v_new;
  if v_new is null then return -1; end if;
  return v_limit - v_new;
end $$;
revoke all on function public.consume_quota(public.quota_action) from public;
grant execute on function public.consume_quota(public.quota_action) to authenticated;

-- 9b. LLM call log (metadata only; never prompts or keys). Inserted by the server.
create table if not exists public.llm_calls (
  id            bigint generated always as identity primary key,
  user_id       uuid references auth.users(id) on delete set null,
  mode          text not null check (mode in ('hosted','byok')),
  provider      text not null check (provider in ('openai','anthropic','xai','openai_compatible')),
  model         text not null,
  input_tokens  int,
  output_tokens int,
  latency_ms    int,
  ok            boolean not null,
  error_code    text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_llm_calls_user on public.llm_calls(user_id, created_at desc);
alter table public.llm_calls enable row level security;
create policy llm_calls_select_own on public.llm_calls for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
-- Inserts via service role only.

-- =====================================================================
-- 10. Content reports (abuse / broken prompt / outdated)
-- =====================================================================
create table if not exists public.reports (
  id          bigint generated always as identity primary key,
  reporter_id uuid default auth.uid() references auth.users(id) on delete set null,
  target_kind text not null check (target_kind in ('library_item','saved_prompt','agent_kit','agent_template')),
  target_id   uuid not null,
  reason      text not null check (reason in ('outdated','broken','unsafe','copyright','spam','other')),
  details     text check (char_length(details) <= 1000),
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy reports_insert_auth on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy reports_admin_all on public.reports for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- 11. Waitlist / newsletter (public insert, no public read)
-- =====================================================================
create table if not exists public.waitlist (
  id         bigint generated always as identity primary key,
  email      text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  source     text check (char_length(source) <= 60),
  created_at timestamptz not null default now()
);
alter table public.waitlist enable row level security;
-- Inserts go through the /api/waitlist route (service role + rate limit). No anon policy, to block scraping/spam.
create policy waitlist_admin_read on public.waitlist for select to authenticated using (public.is_admin());

-- =====================================================================
-- 12. Table grants (RLS still applies; these just expose tables to the API roles)
-- =====================================================================
grant usage on schema public to anon, authenticated;
grant select on public.targets, public.categories, public.trends, public.library_items,
                public.library_item_bodies, public.agent_templates, public.agent_template_files
  to anon, authenticated;
grant select, insert, delete on public.saved_prompts, public.agent_kits to authenticated;
-- Column-level UPDATE only: a table-level UPDATE grant would cover share_slug/visibility/user_id,
-- and a column REVOKE cannot narrow a table-level grant in Postgres.
revoke update on public.saved_prompts, public.agent_kits from authenticated, anon;
grant update (title, target_id, template_key, builder_input, output, enhanced) on public.saved_prompts to authenticated;
grant update (name, template_id, template_ver, answers, files) on public.agent_kits to authenticated;
grant select on public.saved_prompts, public.agent_kits to anon;   -- RLS limits to visibility='public'
grant select, insert, delete on public.favorites to authenticated;
grant select on public.profiles, public.purchases, public.usage_counters, public.llm_calls to authenticated;
grant insert on public.reports to authenticated;
-- Admin writes to content tables rely on RLS admin policies:
grant insert, update, delete on public.targets, public.categories, public.trends, public.library_items,
  public.library_item_bodies, public.agent_templates, public.agent_template_files, public.reports
  to authenticated;
-- Re-apply profile column restriction after the broad grants above
revoke update on public.profiles from authenticated;
grant  update (display_name, avatar_url, locale) on public.profiles to authenticated;

-- Supabase's default privileges grant broad table rights to anon/authenticated.
-- Remove write rights on server-only tables (RLS would deny anyway; this is defence in depth).
revoke insert, update, delete on public.purchases, public.usage_counters, public.llm_calls, public.waitlist from anon, authenticated;
revoke all on public.profiles from anon;
revoke insert, delete on public.profiles from authenticated;

-- =====================================================================
-- 13. Seed: targets (formatting notes are editorial and should be re-verified against vendor docs)
-- =====================================================================
insert into public.targets (id, name, family, format_notes, sort_order) values
  ('chatgpt',     'ChatGPT',      'chat',         'Markdown headings and bullet constraints', 10),
  ('claude',      'Claude',       'chat',         'XML-tagged sections (<context>, <task>, <format>)', 20),
  ('gemini',      'Gemini',       'chat',         'Plain sections; image edits: keep / change / look', 30),
  ('grok',        'Grok',         'chat',         'Markdown sections', 40),
  ('perplexity',  'Perplexity',   'search',       'Ask for cited sources and date range', 50),
  ('cursor',      'Cursor',       'coding_agent', '.cursor/rules/*.mdc with description/globs/alwaysApply frontmatter', 60),
  ('claude-code', 'Claude Code',  'coding_agent', 'CLAUDE.md, subagents, slash commands', 70),
  ('codex',       'Codex / AGENTS.md agents', 'coding_agent', 'AGENTS.md at repo root', 80),
  ('midjourney',  'Midjourney',   'image',        'Parameters like --ar, --v, --style', 90),
  ('flux',        'FLUX',         'image',        'Natural-language description', 100),
  ('veo',         'Veo',          'video',        'Shot, camera move, duration, audio cues', 110),
  ('kling',       'Kling',        'video',        'Shot, camera move, duration', 120)
on conflict (id) do nothing;
-- End of schema
