-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- Ele cria as tabelas para salvar o Deck, o Progresso da Campanha e o Histórico de Partidas.

create table if not exists public.player_profiles (
  player_id text primary key,
  player_name text not null default 'Herói Rúnico',
  deck_ids jsonb not null default '[]'::jsonb,
  saved_decks jsonb not null default '[]'::jsonb,
  active_deck_id text,
  completed_stages jsonb not null default '[]'::jsonb,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Caso a tabela já exista de uma versão anterior, adiciona as colunas de múltiplos decks
alter table public.player_profiles
  add column if not exists saved_decks jsonb not null default '[]'::jsonb;
alter table public.player_profiles
  add column if not exists active_deck_id text;
alter table public.player_profiles
  add column if not exists hero_profile jsonb;

create table if not exists public.match_history (
  id bigint generated always as identity primary key,
  player_id text not null references public.player_profiles(player_id) on delete cascade,
  mode text not null, -- 'skirmish' | 'campaign'
  stage_id text,
  terrain_id text,
  result text not null, -- 'player' | 'enemy' | 'draw'
  rounds integer not null,
  created_at timestamptz not null default now()
);

-- Habilita Row Level Security (RLS) com política aberta para fase de testes
alter table public.player_profiles enable row level security;
alter table public.match_history enable row level security;

drop policy if exists "Allow anon all on player_profiles" on public.player_profiles;
create policy "Allow anon all on player_profiles"
  on public.player_profiles
  for all
  using (true)
  with check (true);

drop policy if exists "Allow anon all on match_history" on public.match_history;
create policy "Allow anon all on match_history"
  on public.match_history
  for all
  using (true)
  with check (true);
