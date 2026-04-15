alter table public.member_cards
  add column if not exists access_code_hash text,
  add column if not exists access_code_updated_at timestamptz,
  add column if not exists access_code_updated_by uuid;

create table if not exists public.member_card_link_requests (
  id bigserial primary key,
  member_card_id bigint not null references public.member_cards(id) on delete cascade,
  access_code_hash text not null,
  requested_by_profile_id uuid null references public.profiles(id) on delete set null,
  requested_by_discord_id bigint null,
  requested_by_name text null,
  request_source text not null default 'site',
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  approved_at timestamptz null,
  approved_by_profile_id uuid null references public.profiles(id) on delete set null,
  approved_by_discord_id bigint null,
  rejected_reason text null
);

create index if not exists idx_member_link_requests_status
  on public.member_card_link_requests(status, requested_at desc);

create index if not exists idx_member_link_requests_profile
  on public.member_card_link_requests(requested_by_profile_id, requested_at desc);

create index if not exists idx_member_link_requests_discord
  on public.member_card_link_requests(requested_by_discord_id, requested_at desc);

create table if not exists public.member_card_links (
  id bigserial primary key,
  member_card_id bigint not null references public.member_cards(id) on delete cascade,
  profile_id uuid null references public.profiles(id) on delete cascade,
  discord_user_id bigint null,
  status text not null default 'active',
  can_edit boolean not null default true,
  approved_by_profile_id uuid null references public.profiles(id) on delete set null,
  approved_by_discord_id bigint null,
  created_from_request_id bigint null references public.member_card_link_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (profile_id is not null or discord_user_id is not null)
);

create unique index if not exists uniq_member_card_links_active_member
  on public.member_card_links(member_card_id)
  where status = 'active';

create unique index if not exists uniq_member_card_links_active_profile
  on public.member_card_links(profile_id)
  where status = 'active' and profile_id is not null;

create unique index if not exists uniq_member_card_links_active_discord
  on public.member_card_links(discord_user_id)
  where status = 'active' and discord_user_id is not null;
