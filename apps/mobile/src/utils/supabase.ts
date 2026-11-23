/**
 * Lightweight Supabase REST client for Super Monster.
 * Syncs player deck, campaign progress, and match history when
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.
 * Falls back gracefully to localStorage when offline or unconfigured.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

const PLAYER_ID_KEY = 'sm_player_id';

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return 'local-player';
  let id = window.localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `player-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

function getHeaders(): HeadersInit {
  return {
    apikey: SUPABASE_ANON_KEY ?? '',
    Authorization: `Bearer ${SUPABASE_ANON_KEY ?? ''}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates',
  };
}

import type { SavedDeck } from './decks';
import type { HeroProfileState } from './heroProfile';

export interface RemotePlayerProfile {
  player_id: string;
  deck_ids: string[];
  saved_decks?: SavedDeck[];
  active_deck_id?: string | null;
  hero_profile?: HeroProfileState | null;
  completed_stages: string[];
  wins: number;
  losses: number;
  draws: number;
}

export async function loadProfileFromSupabase(): Promise<RemotePlayerProfile | null> {
  if (!isSupabaseConfigured()) return null;
  const playerId = getOrCreatePlayerId();
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/player_profiles?player_id=eq.${encodeURIComponent(playerId)}&select=*`,
      { headers: getHeaders() }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as RemotePlayerProfile[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function saveProfileToSupabase(data: {
  deckIds: string[];
  savedDecks?: SavedDeck[];
  activeDeckId?: string;
  heroProfile?: HeroProfileState;
  completedStages: string[];
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const playerId = getOrCreatePlayerId();
  try {
    const payload: Record<string, unknown> = {
      player_id: playerId,
      deck_ids: data.deckIds,
      completed_stages: data.completedStages,
      updated_at: new Date().toISOString(),
    };
    if (data.savedDecks) {
      payload.saved_decks = data.savedDecks;
    }
    if (data.activeDeckId) {
      payload.active_deck_id = data.activeDeckId;
    }
    if (data.heroProfile) {
      payload.hero_profile = data.heroProfile;
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/player_profiles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    // If remote schema hasn't been migrated with saved_decks yet, retry with base fields
    if (!res.ok && (data.savedDecks || data.activeDeckId)) {
      await fetch(`${SUPABASE_URL}/rest/v1/player_profiles`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          player_id: playerId,
          deck_ids: data.deckIds,
          completed_stages: data.completedStages,
          updated_at: new Date().toISOString(),
        }),
      });
    }
  } catch {
    // Silent fallback when offline
  }
}

export async function recordMatchResultToSupabase(params: {
  mode: 'skirmish' | 'campaign';
  stageId?: string;
  terrainId: string;
  result: 'player' | 'enemy' | 'draw';
  rounds: number;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const playerId = getOrCreatePlayerId();
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/match_history`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        player_id: playerId,
        mode: params.mode,
        stage_id: params.stageId ?? null,
        terrain_id: params.terrainId,
        result: params.result,
        rounds: params.rounds,
      }),
    });
  } catch {
    // Silent fallback when offline
  }
}
