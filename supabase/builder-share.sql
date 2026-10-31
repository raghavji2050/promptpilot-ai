-- Short builder share links: /s/q12345678 (item 4, audit fixes). Apply once in Supabase SQL editor.
-- Stores only the builder params string the user chose to share. Anon can create and read-by-id via RPC; no table access.
create table if not exists public.builder_shares (
  id text primary key check (id ~ '^q[A-Za-z0-9]{8}$'),
  params text not null check (length(params) <= 12000),
  created_at timestamptz not null default now()
);
alter table public.builder_shares enable row level security;
revoke all on public.builder_shares from anon, authenticated;

create or replace function public.create_builder_share(p_params text) returns text
language plpgsql security definer set search_path = public as $$
declare v_id text; abc text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; i int;
begin
  if p_params is null or length(p_params) > 12000 or position('goal=' in p_params) = 0 then raise exception 'INVALID'; end if;
  loop
    v_id := 'q';
    for i in 1..8 loop v_id := v_id || substr(abc, 1 + floor(random() * 62)::int, 1); end loop;
    begin insert into public.builder_shares(id, params) values (v_id, p_params); return v_id;
    exception when unique_violation then end;
  end loop;
end $$;

create or replace function public.get_builder_share(p_id text) returns text
language sql stable security definer set search_path = public as $$
  select params from public.builder_shares where id = p_id;
$$;

revoke all on function public.create_builder_share(text) from public;
revoke all on function public.get_builder_share(text) from public;
grant execute on function public.create_builder_share(text) to anon, authenticated;
grant execute on function public.get_builder_share(text) to anon, authenticated;
