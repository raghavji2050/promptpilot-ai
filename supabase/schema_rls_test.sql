-- RLS smoke test. Run against a scratch DB AFTER stub roles/auth (see phase2-prd.md §6.4) and schema.sql. NOT for production.
\set ON_ERROR_STOP 0
insert into auth.users(id,email) values
 ('11111111-1111-1111-1111-111111111111','free@x.com'),
 ('22222222-2222-2222-2222-222222222222','pro@x.com'),
 ('33333333-3333-3333-3333-333333333333','admin@x.com');
update public.profiles set plan='pro' where id='22222222-2222-2222-2222-222222222222';
update public.profiles set role='admin' where id='33333333-3333-3333-3333-333333333333';
insert into public.library_items(id,slug,kind,title,status,is_pro) values
 ('aaaaaaaa-0000-0000-0000-000000000001','free-one','developer','Free prompt','published',false),
 ('aaaaaaaa-0000-0000-0000-000000000002','pro-one','developer','Pro prompt','published',true),
 ('aaaaaaaa-0000-0000-0000-000000000003','draft-one','developer','Draft prompt','draft',false);
insert into public.library_item_bodies(item_id,body) values
 ('aaaaaaaa-0000-0000-0000-000000000001','FREE BODY'),('aaaaaaaa-0000-0000-0000-000000000002','PRO BODY'),('aaaaaaaa-0000-0000-0000-000000000003','DRAFT BODY');
insert into public.agent_templates(id,slug,stack,title,status,is_pro) values ('bbbbbbbb-0000-0000-0000-000000000001','laravel','laravel','Laravel kit','published',false);
insert into public.agent_template_files(template_id,file_kind,path,body,is_pro) values
 ('bbbbbbbb-0000-0000-0000-000000000001','agents_md','AGENTS.md','free file',false),
 ('bbbbbbbb-0000-0000-0000-000000000001','subagent','.claude/agents/reviewer.md','pro file',true);

\echo '--- ANON'
set role anon; set request.jwt.claim.sub = '';
select 'anon items', count(*) from public.library_items;            -- expect 2
select 'anon bodies', string_agg(body,',') from public.library_item_bodies; -- expect FREE BODY
select 'anon files', string_agg(path,',') from public.agent_template_files; -- expect AGENTS.md
select 'anon manifest', count(*) from public.agent_template_manifest('bbbbbbbb-0000-0000-0000-000000000001'); -- expect 2
select 'anon profiles', count(*) from public.profiles;               -- expect error (no grant)
reset role;

\echo '--- FREE USER'
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'free bodies', string_agg(body,',') from public.library_item_bodies; -- FREE BODY
select 'free files', string_agg(path,',') from public.agent_template_files;  -- AGENTS.md
update public.profiles set plan='pro' where id=auth.uid();                     -- expect permission denied
update public.profiles set display_name='Raghav' where id=auth.uid();          -- ok
select 'profiles visible', count(*) from public.profiles;                      -- 1
insert into public.saved_prompts(title,source,output) values ('t','builder','out') returning id \gset
select 'own saved', count(*) from public.saved_prompts;                         -- 1
update public.saved_prompts set share_slug='hack' ;                             -- expect permission denied
update public.saved_prompts set visibility='public';                            -- expect permission denied
select 'share slug len', length(public.create_share('prompt', :'id', 'unlisted')); -- 18
insert into public.purchases(user_id,provider,provider_ref,sku,amount_minor,currency) values (auth.uid(),'manual','x','pro',0,'INR'); -- denied
select 'quota', public.consume_quota('enhance_hosted'), public.consume_quota('enhance_hosted'), public.consume_quota('enhance_hosted'), public.consume_quota('enhance_hosted'); -- 2,1,0,-1
update public.library_items set title='x';                                      -- 0 rows (not admin)
select 'copy fn', public.increment_copy('aaaaaaaa-0000-0000-0000-000000000001');
select share_slug as slug from public.saved_prompts limit 1 \gset
reset role;

\echo '--- OTHER USER (pro) sees unlisted only via slug fn'
set role authenticated; set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'pro sees others saved', count(*) from public.saved_prompts;             -- 0
select 'pro via slug', count(*) from public.get_shared_prompt(:'slug');          -- 1
select 'pro bodies', string_agg(body,',' order by body) from public.library_item_bodies; -- FREE,PRO
select 'pro files', string_agg(path,',' order by path) from public.agent_template_files; -- both
reset role;

\echo '--- ADMIN'
set role authenticated; set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'admin items', count(*) from public.library_items;                       -- 3
update public.library_items set title='Edited' where slug='free-one';
select 'admin edit', title from public.library_items where slug='free-one';
reset role;
select 'copy_count', copy_count from public.library_items where slug='free-one';
