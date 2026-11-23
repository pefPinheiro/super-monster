import {
  HERO_FRAMES,
  HERO_SKINS,
  createDefaultHeroBuild,
  type HeroBuild,
  type HeroItem,
  type HeroSlotType,
} from '@super-monster/game-engine';

const HERO_PROFILE_STORAGE_KEY = 'sm_hero_profile_v1';

export interface HeroProfileState {
  build: HeroBuild;
  inventory: HeroItem[];
  unlockedFrameIds: string[];
  gold: number;
}

export function createInitialHeroProfile(): HeroProfileState {
  return {
    build: createDefaultHeroBuild(),
    inventory: [],
    unlockedFrameIds: ['frame_aliado'],
    gold: 1200,
  };
}

export function loadHeroProfile(): HeroProfileState {
  const fallback = createInitialHeroProfile();
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(HERO_PROFILE_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<HeroProfileState>;
    const defaultBuild = createDefaultHeroBuild();

    const build: HeroBuild = {
      heroName:
        typeof parsed.build?.heroName === 'string' &&
        parsed.build.heroName.trim()
          ? parsed.build.heroName.trim().slice(0, 22)
          : defaultBuild.heroName,
      skinId: HERO_SKINS.some((s) => s.id === parsed.build?.skinId)
        ? (parsed.build!.skinId as string)
        : defaultBuild.skinId,
      frameId: HERO_FRAMES.some((f) => f.id === parsed.build?.frameId)
        ? (parsed.build!.frameId as string)
        : defaultBuild.frameId,
      equipped: parsed.build?.equipped ?? defaultBuild.equipped,
    };

    return {
      build,
      inventory: Array.isArray(parsed.inventory)
        ? parsed.inventory.filter((i) => i && i.remainingDurability > 0)
        : [],
      unlockedFrameIds:
        Array.isArray(parsed.unlockedFrameIds) &&
        parsed.unlockedFrameIds.length > 0
          ? Array.from(new Set(['frame_aliado', ...parsed.unlockedFrameIds]))
          : ['frame_aliado'],
      gold: typeof parsed.gold === 'number' && parsed.gold >= 0 ? parsed.gold : 1200,
    };
  } catch {
    return fallback;
  }
}

export function saveHeroProfile(state: HeroProfileState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      HERO_PROFILE_STORAGE_KEY,
      JSON.stringify(state)
    );
  } catch {
    // ignore storage errors
  }
}

export function consumeEquippedDurability(state: HeroProfileState): {
  nextState: HeroProfileState;
  brokenItemNames: string[];
} {
  const nextEquipped: Partial<Record<HeroSlotType, HeroItem>> = {};
  const brokenItemNames: string[] = [];

  for (const slot of ['arma', 'elmo', 'botas', 'amuleto'] as HeroSlotType[]) {
    const item = state.build.equipped[slot];
    if (!item) continue;
    const nextDurability = item.remainingDurability - 1;
    if (nextDurability <= 0) {
      brokenItemNames.push(item.name);
    } else {
      nextEquipped[slot] = {
        ...item,
        remainingDurability: nextDurability,
      };
    }
  }

  return {
    nextState: {
      ...state,
      build: {
        ...state.build,
        equipped: nextEquipped,
      },
    },
    brokenItemNames,
  };
}
