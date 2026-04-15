alter table public.profiles
  add column if not exists username text,
  add column if not exists bio text,
  add column if not exists social_muted_until timestamptz;

create unique index if not exists idx_profiles_username_unique
  on public.profiles (lower(username))
  where username is not null;

create table if not exists public.social_posts (
  id bigserial primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 1200),
  image_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_social_posts_created_at
  on public.social_posts (created_at desc);

create table if not exists public.social_post_likes (
  post_id bigint not null references public.social_posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create table if not exists public.social_post_comments (
  id bigserial primary key,
  post_id bigint not null references public.social_posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 600),
  created_at timestamptz not null default now()
);

create index if not exists idx_social_comments_post
  on public.social_post_comments (post_id, created_at desc);

create table if not exists public.social_direct_messages (
  id bigserial primary key,
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 1200),
  image_url text null,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists idx_social_dm_pair
  on public.social_direct_messages (sender_profile_id, recipient_profile_id, created_at desc);

create table if not exists public.site_notifications (
  id bigserial primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text null,
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_site_notifications_profile
  on public.site_notifications (profile_id, is_read, created_at desc);

insert into storage.buckets (id, name, public)
values ('social-media', 'social-media', true)
on conflict (id) do nothing;
