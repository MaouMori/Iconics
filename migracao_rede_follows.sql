create table if not exists public.social_follows (
  follower_profile_id uuid not null references public.profiles(id) on delete cascade,
  following_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_profile_id, following_profile_id),
  check (follower_profile_id <> following_profile_id)
);

create index if not exists idx_social_follows_following
  on public.social_follows (following_profile_id, created_at desc);

create index if not exists idx_social_follows_follower
  on public.social_follows (follower_profile_id, created_at desc);

