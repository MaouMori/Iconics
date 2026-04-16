create table if not exists public.fraternity_rankings (
  id bigserial primary key,
  nome text not null unique,
  pontos integer not null default 0,
  cor text not null default '#a855f7',
  foguete_emoji text not null default '🚀',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fraternity_rankings_points_idx
  on public.fraternity_rankings (pontos desc, id asc);

create or replace function public.set_fraternity_rankings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_fraternity_rankings_updated_at on public.fraternity_rankings;
create trigger trg_fraternity_rankings_updated_at
before update on public.fraternity_rankings
for each row
execute function public.set_fraternity_rankings_updated_at();

alter table public.fraternity_rankings enable row level security;

drop policy if exists "fraternity rankings select all" on public.fraternity_rankings;
create policy "fraternity rankings select all"
on public.fraternity_rankings
for select
using (true);

