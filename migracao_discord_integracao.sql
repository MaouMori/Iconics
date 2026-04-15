alter table public.profiles
  add column if not exists discord_user_id bigint unique,
  add column if not exists discord_link_code text,
  add column if not exists discord_link_code_expires_at timestamptz;

create index if not exists idx_profiles_discord_link_code
  on public.profiles(discord_link_code);

create table if not exists public.discord_logs (
  id bigserial primary key,
  guild_id text null,
  channel_id text null,
  event_title text not null,
  event_description text null,
  level text not null default 'info',
  created_at timestamptz not null default now()
);

create index if not exists idx_discord_logs_created_at
  on public.discord_logs(created_at desc);

