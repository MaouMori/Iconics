create table if not exists public.guild_missions (
  id bigserial primary key,
  slug text not null unique,
  title text not null,
  summary text not null,
  details text null,
  category text not null default 'social',
  difficulty text not null default 'media',
  required_level integer not null default 1,
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
  proof_url text null,
  accepted_at timestamptz not null default now(),
  expires_at timestamptz null,
  submitted_at timestamptz null,
  completed_at timestamptz null,
  updated_at timestamptz not null default now()
);

create unique index if not exists uniq_guild_mission_claim_active
  on public.guild_mission_claims(mission_id, profile_id)
  where status in ('accepted', 'submitted');

create index if not exists idx_guild_mission_claims_profile
  on public.guild_mission_claims(profile_id, accepted_at desc);

create index if not exists idx_guild_mission_claims_status
  on public.guild_mission_claims(status, accepted_at desc);

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
  (slug, title, summary, details, category, difficulty, required_level, reward_influence, time_limit_hours, image_url, status, unlock_after_completed, tags)
values
  (
    'viralizacao',
    'Viralizacao',
    'Poste 1 conteudo no Instagram com a hashtag #ICONICS.',
    'Publique um conteudo com presenca visual, marque a fraternidade quando possivel e registre o link como prova para a staff.',
    'social',
    'media',
    1,
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
    400,
    96,
    '/images/rankings-space-bg.jpg',
    'secret',
    3,
    array['secreta']
  )
on conflict (slug) do nothing;
