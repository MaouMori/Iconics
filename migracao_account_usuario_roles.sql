alter table public.profiles
  add column if not exists usuario text;

create unique index if not exists idx_profiles_usuario_unique
  on public.profiles (lower(usuario))
  where usuario is not null;

update public.profiles
set cargo = 'calouro'
where lower(coalesce(cargo, '')) = 'membro';

