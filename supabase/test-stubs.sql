-- Local-only stubs that mimic Supabase roles/auth so schema.sql can be tested on plain Postgres. NEVER run on Supabase.
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create schema extensions;
create extension pgcrypto schema extensions;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
grant usage on schema auth, extensions to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated;
grant execute on all functions in schema extensions to anon, authenticated, service_role;
grant select on auth.users to authenticated;
