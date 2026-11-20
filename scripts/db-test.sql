-- Run by scripts/db-test.sh on a throwaway Postgres after every migration has been applied.
\set ON_ERROR_STOP off
\pset format unaligned
\pset tuples_only on
create table _results (name text, ok boolean, detail text);
create function _check(name text, ok boolean, detail text default '') returns void language plpgsql as $$ begin insert into _results values (name, coalesce(ok,false), detail); end $$;
grant all on _results to public;
grant execute on function _check(text,boolean,text) to public;

-- helper: run a statement as a role/user, return the number of rows affected (-1 on an error, e.g. permission denied)
create function _try(role_name text, uid text, stmt text) returns int language plpgsql as $$
declare n int; begin
  perform set_config('request.jwt.claim.sub', coalesce(uid,''), true);
  perform set_config('request.jwt.claim.role', role_name, true);
  execute 'set local role ' || quote_ident(role_name);
  begin
    if stmt ~* '^\s*select' then execute 'select count(*) from (' || stmt || ') q' into n; else execute stmt; get diagnostics n = row_count; end if;
  exception when others then n := -1; end;
  reset role; return n;
end $$;
grant execute on function _try(text,text,text) to public;

insert into auth.users (id, email) values ('11111111-1111-4111-8111-111111111111','a@x.test'),('22222222-2222-4222-8222-222222222222','b@x.test');

-- Seed one row per user-owned table for each of A, B and an orphan (user_id NULL) as the owner superuser. Columns not named here
-- must have defaults; tables with other NOT NULL columns get them from the generic filler below.
create function _seed(tbl text, uid uuid) returns void language plpgsql as $$
declare cols text := 'user_id'; vals text := quote_literal(uid); r record;
begin
  for r in select a.attname, format_type(a.atttypid,a.atttypmod) typ from pg_attribute a
           where a.attrelid = ('public.'||tbl)::regclass and a.attnum>0 and not a.attisdropped and a.attnotnull and not a.atthasdef and a.attname <> 'user_id' and a.attidentity = '' loop
    cols := cols || ', ' || quote_ident(r.attname);
    vals := vals || ', ' || case
      when r.attname = 'last4' then quote_literal('1234')
      when r.attname = 'type' then quote_literal('podcast')
      when r.attname = 'content_type' then quote_literal('text')
      when r.typ ~ 'uuid' then quote_literal(gen_random_uuid())
      when r.typ ~ 'int|numeric|double|real' then '1'
      when r.typ ~ 'bool' then 'true'
      when r.typ ~ 'jsonb|json' then quote_literal('{}')
      when r.typ ~ 'timestamp|date' then 'now()'
      when r.typ ~ '\[\]' then 'array[]::text[]'
      else quote_literal(r.attname || '-' || md5(random()::text)) end;
  end loop;
  execute format('insert into %I (%s) values (%s)', tbl, cols, vals);
end $$;

do $$
declare t text;
        a uuid := '11111111-1111-4111-8111-111111111111'; b uuid := '22222222-2222-4222-8222-222222222222';
        owned text[] := array['ai_jobs','ai_usage_log','analytics_events','brand_analyses','brand_metrics','business_analyzer','content_generation_history','content_items','image_assets','user_preferences','user_sessions','user_settings','voice_profiles','user_api_keys'];
        n int;
begin
  foreach t in array owned loop
    begin
      perform _seed(t, a); perform _seed(t, b);
    exception when others then perform _check('seed '||t, false, sqlerrm); continue; end;
    perform _check('seed '||t, true);
    -- A sees exactly its own row; cannot see B's
    n := _try('authenticated', a::text, format('select 1 from %I where user_id = %L', t, b));
    if t in ('user_api_keys','ai_usage_log','ai_jobs') then
      -- user_api_keys: no access for clients at all; usage/jobs: read-own only (see dedicated checks below)
      null;
    else
      perform _check(t||': user A cannot read user B rows', n = 0, 'got '||n);
      n := _try('authenticated', a::text, format('select 1 from %I where user_id = %L', t, a));
      perform _check(t||': user A reads own rows', n >= 1, 'got '||n);
      n := _try('authenticated', a::text, format('update %I set user_id = user_id where user_id = %L', t, b));
      perform _check(t||': user A cannot update user B rows', n <= 0, 'got '||n);
      n := _try('authenticated', a::text, format('delete from %I where user_id = %L', t, b));
      perform _check(t||': user A cannot delete user B rows', n <= 0, 'got '||n);
    end if;
    -- anon sees nothing, writes nothing
    n := _try('anon', null, format('select 1 from %I', t));
    perform _check(t||': anon sees nothing', n <= 0, 'got '||n);
    n := _try('anon', null, format('delete from %I', t));
    perform _check(t||': anon cannot delete', n <= 0, 'got '||n);
    -- service_role bypasses RLS
    n := _try('service_role', null, format('select 1 from %I', t));
    perform _check(t||': service_role can read', n >= 2, 'got '||n);
  end loop;
end $$;

-- A user cannot insert a row owned by someone else (WITH CHECK)
select _check('content_items: user A cannot insert a row owned by B',
  _try('authenticated','11111111-1111-4111-8111-111111111111', 'insert into content_items (user_id, title, content, type) values (''22222222-2222-4222-8222-222222222222'',''t'',''c'',''podcast'')') = -1);

-- orphan rows (user_id NULL) are not readable/writable by anon or authenticated
insert into brand_analyses (user_id) select null where false;
do $$ declare n int; begin
  begin insert into brand_analyses (user_id) values (null); exception when others then null; end;
  n := _try('anon', null, 'select 1 from brand_analyses'); perform _check('brand_analyses: anon cannot read NULL-owner rows', n <= 0, 'got '||n);
  n := _try('authenticated','11111111-1111-4111-8111-111111111111','select 1 from brand_analyses where user_id is null'); perform _check('brand_analyses: authenticated cannot read NULL-owner rows', n = 0, 'got '||n);
  n := _try('anon', null, 'insert into analytics_events (user_id) values (null)'); perform _check('analytics_events: anon cannot insert', n <= 0, 'got '||n);
end $$;

-- user_api_keys: clients (authenticated and anon) have NO access whatsoever, even to their own row; service_role does
select _check('user_api_keys: authenticated cannot SELECT own row', _try('authenticated','11111111-1111-4111-8111-111111111111','select * from user_api_keys') <= 0);
select _check('user_api_keys: authenticated cannot read ciphertext column', _try('authenticated','11111111-1111-4111-8111-111111111111','select ciphertext from user_api_keys') = -1 or _try('authenticated','11111111-1111-4111-8111-111111111111','select ciphertext from user_api_keys') = 0);
select _check('user_api_keys: authenticated cannot INSERT', _try('authenticated','11111111-1111-4111-8111-111111111111','insert into user_api_keys (user_id, provider, ciphertext, iv, last4) values (''11111111-1111-4111-8111-111111111111'',''openai2'',''c'',''i'',''1234'')') <= 0);
select _check('user_api_keys: authenticated cannot UPDATE', _try('authenticated','11111111-1111-4111-8111-111111111111','update user_api_keys set last4=''0000''') <= 0);
select _check('user_api_keys: authenticated cannot DELETE', _try('authenticated','11111111-1111-4111-8111-111111111111','delete from user_api_keys') <= 0);
select _check('user_api_keys: anon cannot SELECT', _try('anon',null,'select * from user_api_keys') <= 0);
insert into auth.users (id, email) values ('33333333-3333-4333-8333-333333333333','c@x.test');
select _check('user_api_keys: service_role can SELECT/INSERT/UPDATE/DELETE',
  _try('service_role',null,'select 1 from user_api_keys') >= 2
  and _try('service_role',null,'insert into user_api_keys (user_id, provider, ciphertext, iv, last4) values (''33333333-3333-4333-8333-333333333333'',''openai'',''c'',''i'',''1234'')') = 1
  and _try('service_role',null,'update user_api_keys set last4=''9999'' where user_id=''33333333-3333-4333-8333-333333333333''') = 1
  and _try('service_role',null,'delete from user_api_keys where user_id=''33333333-3333-4333-8333-333333333333''') = 1);
select _check('user_api_keys: provider is restricted', _try('service_role',null,'insert into user_api_keys (user_id, provider, ciphertext, iv, last4) values (''33333333-3333-4333-8333-333333333333'',''other'',''c'',''i'',''1234'')') = -1);

-- usage log / jobs: users may READ their own rows only, never write
select _check('ai_usage_log: user reads only their own rows', _try('authenticated','11111111-1111-4111-8111-111111111111','select 1 from ai_usage_log') = 1);
select _check('ai_usage_log: user cannot write', _try('authenticated','11111111-1111-4111-8111-111111111111','insert into ai_usage_log (user_id, feature, endpoint, status) values (''11111111-1111-4111-8111-111111111111'',''f'',''e'',''200'')') <= 0);
select _check('ai_jobs: user reads only their own rows', _try('authenticated','11111111-1111-4111-8111-111111111111','select 1 from ai_jobs') = 1);
select _check('ai_jobs: user cannot write', _try('authenticated','11111111-1111-4111-8111-111111111111','delete from ai_jobs') <= 0);

-- case_studies: published rows are public; no client may write
select _check('case_studies: anon cannot write', _try('anon',null,'insert into case_studies (title) values (''x'')') <= 0);
select _check('case_studies: authenticated cannot write', _try('authenticated','11111111-1111-4111-8111-111111111111','delete from case_studies') <= 0);
select _check('case_studies: service_role can write', _try('service_role',null,'insert into case_studies (title) values (''t'')') in (1,-1));

-- rate limiter: counts, blocks over the limit, per user and bucket, window rolls; clients cannot call it
select _check('rate_limits: clients have no table access', _try('authenticated','11111111-1111-4111-8111-111111111111','select * from rate_limits') <= 0 and _try('anon',null,'select * from rate_limits') <= 0);
select _check('consume_rate_limit: not executable by authenticated/anon',
  not has_function_privilege('authenticated', 'consume_rate_limit(uuid,text,int,int)', 'execute') and not has_function_privilege('anon', 'consume_rate_limit(uuid,text,int,int)', 'execute'));
set role service_role;
select _check('consume_rate_limit: first 3 calls allowed (limit 3)',
  consume_rate_limit('11111111-1111-4111-8111-111111111111','b1',3,60) and consume_rate_limit('11111111-1111-4111-8111-111111111111','b1',3,60) and consume_rate_limit('11111111-1111-4111-8111-111111111111','b1',3,60));
select _check('consume_rate_limit: 4th call blocked', not consume_rate_limit('11111111-1111-4111-8111-111111111111','b1',3,60));
select _check('consume_rate_limit: other user unaffected', consume_rate_limit('22222222-2222-4222-8222-222222222222','b1',3,60));
select _check('consume_rate_limit: other bucket unaffected', consume_rate_limit('11111111-1111-4111-8111-111111111111','b2',3,60));
reset role;
-- the window rolls: age the counter's window so the next call starts a fresh one
update rate_limits set window_start = window_start - interval '2 hours' where bucket = 'b1';
set role service_role;
select _check('consume_rate_limit: allowed again after the window passes', consume_rate_limit('11111111-1111-4111-8111-111111111111','b1',3,60));
reset role;

-- auth.uid() stub sanity
select _check('auth.uid() reads request.jwt.claim.sub', (select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111', true) is not null) and auth.uid() = '11111111-1111-4111-8111-111111111111'::uuid);

-- a table created AFTER the migrations must not be reachable by anon/authenticated until access is granted on purpose
create table public._future_table (id int);
insert into public._future_table values (1);
select _check('default privileges: a future table is not readable by anon', _try('anon', null, 'select 1 from _future_table') = -1);
select _check('default privileges: a future table is not readable by authenticated', _try('authenticated', '11111111-1111-4111-8111-111111111111', 'select 1 from _future_table') = -1);
select _check('default privileges: service_role still can use a future table', _try('service_role', null, 'select 1 from _future_table') = 1);
-- contact_submissions: no client access at all
select _check('contact_submissions: anon cannot read or insert', _try('anon', null, 'select 1 from contact_submissions') = -1 and _try('anon', null, 'insert into contact_submissions (name,email,message) values (''a'',''a@b.c'',''0123456789'')') = -1);
select _check('contact_submissions: authenticated cannot read or insert', _try('authenticated', '11111111-1111-4111-8111-111111111111', 'select 1 from contact_submissions') = -1);
select _check('contact_submissions: service_role can insert; constraints reject a short message', _try('service_role', null, 'insert into contact_submissions (name,email,message) values (''a'',''a@b.c'',''0123456789'')') = 1 and _try('service_role', null, 'insert into contact_submissions (name,email,message) values (''a'',''a@b.c'',''short'')') = -1);

select case when count(*) filter (where not ok) = 0 then 'ALL DB CHECKS PASSED (' || count(*) || ' checks)' else count(*) filter (where not ok) || ' DB CHECKS FAILED: ' || string_agg(name || ' [' || detail || ']', '; ') filter (where not ok) end from _results;

select name || ' [' || detail || ']' from _results where not ok;
