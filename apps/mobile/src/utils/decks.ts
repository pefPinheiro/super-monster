import { DEFAULT_CARDS } from '@super-monster/game-engine';

export const DECK_SIZE = 9;
export const MAX_SAVED_DECKS = 6;

const LEGACY_DECK_STORAGE_KEY = 'sm_player_deck_ids';
const DECK_LIBRARY_STORAGE_KEY = 'sm_deck_library_v1';

export const DEFAULT_9_IDS = DEFAULT_CARDS.slice(0, DECK_SIZE).map((c) => c.id);
const VALID_CARD_IDS = new Set(DEFAULT_CARDS.map((c) => c.id));

export interface SavedDeck {
  id: string;
  name: string;
  cardIds: string[];
  updatedAt: string;
}

export interface DeckLibraryState {
  decks: SavedDeck[];
  activeDeckId: string;
}

export function sanitizeCardIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const seen = new Set<string>();
  const valid: string[] = [];
  for (const id of ids) {
    if (
      typeof id === 'string' &&
      VALID_CARD_IDS.has(id) &&
      !seen.has(id) &&
      valid.length < DECK_SIZE
    ) {
      seen.add(id);
      valid.push(id);
    }
  }
  return valid;
}

export function createDeckId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `deck-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `deck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function loadDeckLibrary(): DeckLibraryState {
  const fallback: DeckLibraryState = {
    decks: [
      {
        id: 'deck-principal',
        name: 'Deck Principal',
        cardIds: DEFAULT_9_IDS,
        updatedAt: new Date().toISOString(),
      },
    ],
    activeDeckId: 'deck-principal',
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const rawLib = window.localStorage.getItem(DECK_LIBRARY_STORAGE_KEY);
    if (rawLib) {
      const parsed = JSON.parse(rawLib) as Partial<DeckLibraryState>;
      if (Array.isArray(parsed.decks) && parsed.decks.length > 0) {
        const sanitizedDecks: SavedDeck[] = parsed.decks
          .slice(0, MAX_SAVED_DECKS)
          .map((d, idx) => ({
            id: typeof d.id === 'string' && d.id ? d.id : `deck-${idx + 1}`,
            name:
              typeof d.name === 'string' && d.name.trim()
                ? d.name.trim().slice(0, 24)
                : `Deck ${idx + 1}`,
            cardIds: sanitizeCardIds(d.cardIds),
            updatedAt:
              typeof d.updatedAt === 'string'
                ? d.updatedAt
                : new Date().toISOString(),
          }));

        const hasActive = sanitizedDecks.some(
          (d) => d.id === parsed.activeDeckId
        );
        return {
          decks: sanitizedDecks,
          activeDeckId: hasActive
            ? (parsed.activeDeckId as string)
            : sanitizedDecks[0].id,
        };
      }
    }

    // Migrate legacy single deck if present
    const rawLegacy = window.localStorage.getItem(LEGACY_DECK_STORAGE_KEY);
    if (rawLegacy) {
      const legacyIds = sanitizeCardIds(JSON.parse(rawLegacy));
      if (legacyIds.length === DECK_SIZE) {
        return {
          decks: [
            {
              id: 'deck-principal',
              name: 'Deck Principal',
              cardIds: legacyIds,
              updatedAt: new Date().toISOString(),
            },
          ],
          activeDeckId: 'deck-principal',
        };
      }
    }
  } catch {
    // Ignore invalid storage and return fallback
  }

  return fallback;
}

export function saveDeckLibrary(lib: DeckLibraryState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DECK_LIBRARY_STORAGE_KEY, JSON.stringify(lib));
    const battleIds = getBattleDeckIds(lib);
    window.localStorage.setItem(
      LEGACY_DECK_STORAGE_KEY,
      JSON.stringify(battleIds)
    );
  } catch {
    // Ignore quota errors
  }
}

export function getActiveDeck(lib: DeckLibraryState): SavedDeck {
  return (
    lib.decks.find((d) => d.id === lib.activeDeckId) ?? lib.decks[0]
  );
}

export function getBattleDeckIds(lib: DeckLibraryState): string[] {
  const active = getActiveDeck(lib);
  if (active && active.cardIds.length === DECK_SIZE) {
    return active.cardIds;
  }
  const firstComplete = lib.decks.find((d) => d.cardIds.length === DECK_SIZE);
  return firstComplete ? firstComplete.cardIds : DEFAULT_9_IDS;
}
