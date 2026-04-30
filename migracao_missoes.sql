alter table public.profiles
  add column if not exists mission_xp integer not null default 0,
  add column if not exists mission_level integer not null default 0;

create table if not exists public.guild_missions (
  id bigserial primary key,
  slug text not null unique,
  title text not null,
  summary text not null,
  details text null,
  category text not null default 'social',
  difficulty text not null default 'media',
  required_level integer not null default 1,
  visible_level integer not null default 0,
  reward_influence integer not null default 50,
  time_limit_hours integer not null default 24,
  image_url text null,
  status text not null default 'active',
  unlock_after_completed integer not null default 0,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guild_mission_claims (
  id bigserial primary key,
  mission_id bigint not null references public.guild_missions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'accepted',
  progress integer not null default 0,
  proof_text text null,
  proof_links text[] not null default '{}',
  proof_files jsonb not null default '[]'::jsonb,
  reviewed_by uuid null references public.profiles(id) on delete set null,
  review_note text null,
  proof_url text null,
  accepted_at timestamptz not null default now(),
  expires_at timestamptz null,
  submitted_at timestamptz null,
  completed_at timestamptz null,
  rejected_at timestamptz null,
  updated_at timestamptz not null default now()
);

create unique index if not exists uniq_guild_mission_claim_active
  on public.guild_mission_claims(mission_id, profile_id)
  where status in ('accepted', 'submitted');

create index if not exists idx_guild_mission_claims_profile
  on public.guild_mission_claims(profile_id, accepted_at desc);

create index if not exists idx_guild_mission_claims_status
  on public.guild_mission_claims(status, accepted_at desc);

create index if not exists idx_profiles_mission_rank
  on public.profiles(mission_level desc, mission_xp desc);

create table if not exists public.guild_mission_levels (
  level integer primary key,
  required_xp integer not null,
  label text null
);

insert into public.guild_mission_levels (level, required_xp, label)
values
  (0, 0, 'Recem-chegado'),
  (1, 500, 'Iniciado'),
  (2, 1000, 'Iniciado'),
  (3, 1500, 'Iniciado'),
  (4, 2000, 'Ascendente'),
  (5, 2600, 'Ascendente'),
  (6, 3200, 'Ascendente'),
  (7, 3900, 'Ascendente'),
  (8, 4700, 'Veterano'),
  (9, 5600, 'Veterano'),
  (10, 6600, 'Veterano'),
  (11, 7700, 'Veterano'),
  (12, 9000, 'Iconics Elite')
on conflict (level) do nothing;

create table if not exists public.guild_mission_activity (
  id bigserial primary key,
  mission_id bigint null references public.guild_missions(id) on delete set null,
  profile_id uuid null references public.profiles(id) on delete set null,
  title text not null,
  description text null,
  influence_delta integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.guild_missions
  (slug, title, summary, details, category, difficulty, required_level, visible_level, reward_influence, time_limit_hours, image_url, status, unlock_after_completed, tags)
values
  (
    'viralizacao',
    'Viralizacao',
    'Poste 1 conteudo no Instagram com a hashtag #ICONICS.',
    'Publique um conteudo com presenca visual, marque a fraternidade quando possivel e registre o link como prova para a staff.',
    'social',
    'media',
    1,
    0,
    150,
    24,
    '/images/portal_scene_main.png',
    'active',
    0,
    array['conteudo', 'social']
  ),
  (
    'enigma-de-nyx',
    'Enigma de Nyx',
    'Um simbolo foi ocultado na mansao. Encontre e decifre.',
    'Observe pistas em eventos, lore e imagens do site. A resposta precisa ser validada pela staff.',
    'misterio',
    'alta',
    4,
    0,
    200,
    48,
    '/images/olho.png',
    'active',
    0,
    array['enigma', 'misterio']
  ),
  (
    'recrutamento',
    'Recrutamento',
    'Convide 1 novo membro qualificado para a ICONICS.',
    'Ajude a pessoa a entrar, concluir o registro e se apresentar corretamente a staff.',
    'social',
    'facil',
    2,
    0,
    100,
    72,
    '/images/mansao.png',
    'active',
    0,
    array['social', 'recrutamento']
  ),
  (
    'missao-secreta',
    'Missao Secreta',
    'Desbloqueie para ver.',
    'Complete 3 missoes para acessar este contrato reservado.',
    'secreta',
    'secreta',
    8,
    6,
    400,
    96,
    '/images/rankings-space-bg.jpg',
    'secret',
    3,
    array['secreta']
  )
on conflict (slug) do nothing;
