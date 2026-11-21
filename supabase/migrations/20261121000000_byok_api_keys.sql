/*
  # Bring-your-own-key (BYOK) storage

  Users add their own OpenAI API key. Keys are encrypted with AES-256-GCM by the server (KEY_ENCRYPTION_SECRET) and stored
  only as ciphertext. Browser clients get NO access to `user_api_keys`: RLS is on, there are no policies, and table
  privileges are revoked from `anon` and `authenticated`, so only the service role (server routes / edge functions) can
  read or write it. Clients learn the last four characters and status through the /api/settings/openai-key route.

  Other tables:
  - `user_settings`: per-user, non-secret settings (e.g. model overrides). Owners may read/write their own row.
  - `ai_usage_log`: key-free usage log (model, status, token counts). Owners may read their own rows; only the service role writes.
  - `ai_jobs`: ownership of OpenAI background jobs (deep research) so polling is limited to the owner.
  - `rate_limits` + `consume_rate_limit()`: per-user fixed-window rate limiting, callable only by the service role.
*/

create table if not exists public.user_api_keys (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'openai' check (provider in ('openai')),
  ciphertext text not null,
  iv text not null,
  last4 text not null check (char_length(last4) = 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

alter table public.user_api_keys enable row level security;
alter table public.user_api_keys force row level security;
-- Deliberately no policies: clients can never select or modify ciphertext.
revoke all on public.user_api_keys from anon, authenticated;

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "Users read their own settings" on public.user_settings;

create policy "Users read their own settings" on public.user_settings for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users insert their own settings" on public.user_settings;
create policy "Users insert their own settings" on public.user_settings for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users update their own settings" on public.user_settings;
create policy "Users update their own settings" on public.user_settings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users delete their own settings" on public.user_settings;
create policy "Users delete their own settings" on public.user_settings for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.ai_usage_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  endpoint text,
  model text,
  status text not null,
  attempts integer,
  duration_ms integer,
  input_tokens integer,
  output_tokens integer,
  reasoning_tokens integer,
  request_id text,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_log_user_created_idx on public.ai_usage_log (user_id, created_at desc);
alter table public.ai_usage_log enable row level security;
drop policy if exists "Users read their own usage" on public.ai_usage_log;
create policy "Users read their own usage" on public.ai_usage_log for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.ai_usage_log from anon, authenticated;

create table if not exists public.ai_jobs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now()
);

alter table public.ai_jobs enable row level security;
drop policy if exists "Users read their own jobs" on public.ai_jobs;
create policy "Users read their own jobs" on public.ai_jobs for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.ai_jobs from anon, authenticated;

create table if not exists public.rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (user_id, bucket, window_start)
);

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Atomically count a request in the current fixed window; returns true while the user is within the limit.
create or replace function public.consume_rate_limit(p_user uuid, p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  c integer;
begin
  insert into public.rate_limits as r (user_id, bucket, window_start, count)
  values (p_user, p_bucket, w, 1)
  on conflict (user_id, bucket, window_start) do update set count = r.count + 1
  returning r.count into c;

  -- opportunistic cleanup of old windows
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return c <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(uuid, text, integer, integer) to service_role;
