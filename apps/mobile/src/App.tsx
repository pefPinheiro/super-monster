import {
  DEFAULT_CATALOG,
  chooseAiDraft,
  confirmDraft,
  createMatch,
  type CampaignDefinition,
  type CampaignStageDefinition,
  type MatchState,
} from '@super-monster/game-engine';
import { useEffect, useState } from 'react';
import { BattleArena } from './components/BattleArena';
import { CampaignScreen } from './components/CampaignScreen';
import { DeckManagerScreen } from './components/DeckManagerScreen';
import { DraftScreen } from './components/DraftScreen';
import { FullscreenButton } from './components/FullscreenButton';
import { HeroConfigScreen } from './components/HeroConfigScreen';
import { TitleScreen } from './components/TitleScreen';
import {
  DECK_SIZE,
  getBattleDeckIds,
  loadDeckLibrary,
  saveDeckLibrary,
  sanitizeCardIds,
  type DeckLibraryState,
} from './utils/decks';
import {
  consumeEquippedDurability,
  loadHeroProfile,
  saveHeroProfile,
  type HeroProfileState,
} from './utils/heroProfile';
import { setMusicTrack, type MusicTrack } from './utils/music';
import {
  loadProfileFromSupabase,
  recordMatchResultToSupabase,
  saveProfileToSupabase,
} from './utils/supabase';

const CAMPAIGN_STORAGE_KEY = 'sm_campaign_progress';

function loadCampaignProgress(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore
  }
  return [];
}

export function App() {
  const [view, setView] = useState<'title' | 'campaign' | 'deck' | 'hero'>(
    'title'
  );
  const [heroTab, setHeroTab] = useState<'equip' | 'shop'>('equip');
  const [selectedTerrainId, setSelectedTerrainId] = useState<string | 'random'>(
    'random'
  );
  const [deckLibrary, setDeckLibrary] =
    useState<DeckLibraryState>(loadDeckLibrary);
  const [heroProfile, setHeroProfile] =
    useState<HeroProfileState>(loadHeroProfile);
  const playerDeckIds = getBattleDeckIds(deckLibrary);
  const [completedStageIds, setCompletedStageIds] = useState<string[]>(
    loadCampaignProgress
  );
  const [activeCampaignCtx, setActiveCampaignCtx] = useState<{
    campaign: CampaignDefinition;
    stage: CampaignStageDefinition;
  } | null>(null);
  const [match, setMatch] = useState<MatchState | null>(null);

  // Load saved profile (decks + campaign progress) from Supabase if configured
  useEffect(() => {
    let active = true;
    loadProfileFromSupabase().then((remote) => {
      if (!active || !remote) return;
      if (Array.isArray(remote.saved_decks) && remote.saved_decks.length > 0) {
        const sanitizedDecks = remote.saved_decks.map((d, idx) => ({
          id: typeof d.id === 'string' && d.id ? d.id : `deck-${idx + 1}`,
          name:
            typeof d.name === 'string' && d.name.trim()
              ? d.name.trim()
              : `Deck ${idx + 1}`,
          cardIds: sanitizeCardIds(d.cardIds),
          updatedAt:
            typeof d.updatedAt === 'string'
              ? d.updatedAt
              : new Date().toISOString(),
        }));
        const nextLib: DeckLibraryState = {
          decks: sanitizedDecks,
          activeDeckId:
            remote.active_deck_id &&
            sanitizedDecks.some((d) => d.id === remote.active_deck_id)
              ? remote.active_deck_id
              : sanitizedDecks[0].id,
        };
        setDeckLibrary(nextLib);
        saveDeckLibrary(nextLib);
      } else if (
        Array.isArray(remote.deck_ids) &&
        remote.deck_ids.length === DECK_SIZE
      ) {
        const validIds = sanitizeCardIds(remote.deck_ids);
        if (validIds.length === DECK_SIZE) {
          setDeckLibrary((prev) => {
            const nextDecks = prev.decks.map((d, idx) =>
              idx === 0 ? { ...d, cardIds: validIds } : d
            );
            const nextLib = { ...prev, decks: nextDecks };
            saveDeckLibrary(nextLib);
            return nextLib;
          });
        }
      }
      if (Array.isArray(remote.completed_stages)) {
        setCompletedStageIds((prev) =>
          Array.from(new Set([...prev, ...remote.completed_stages]))
        );
      }
      if (remote.hero_profile && remote.hero_profile.build) {
        setHeroProfile(remote.hero_profile);
        saveHeroProfile(remote.hero_profile);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleUpdateDeckLibrary = (nextLib: DeckLibraryState) => {
    setDeckLibrary(nextLib);
    saveDeckLibrary(nextLib);
    const battleIds = getBattleDeckIds(nextLib);
    void saveProfileToSupabase({
      deckIds: battleIds,
      savedDecks: nextLib.decks,
      activeDeckId: nextLib.activeDeckId,
      heroProfile,
      completedStages: completedStageIds,
    });
  };

  const handleUpdateHeroProfile = (nextProfile: HeroProfileState) => {
    setHeroProfile(nextProfile);
    saveHeroProfile(nextProfile);
    void saveProfileToSupabase({
      deckIds: playerDeckIds,
      savedDecks: deckLibrary.decks,
      activeDeckId: deckLibrary.activeDeckId,
      heroProfile: nextProfile,
      completedStages: completedStageIds,
    });
  };

  // Unlock next campaign stage, consume item durability, award gold & record match result when a match finishes
  useEffect(() => {
    if (match?.phase !== 'game_over' || !match.winner) return;

    void recordMatchResultToSupabase({
      mode: activeCampaignCtx ? 'campaign' : 'skirmish',
      stageId: activeCampaignCtx?.stage.id,
      terrainId: match.terrain.id,
      result: match.winner,
      rounds: match.round,
    });

    const rewardGold =
      match.winner === 'player' ? 120 : match.winner === 'draw' ? 45 : 25;
    const { nextState: consumedProfile } =
      consumeEquippedDurability(heroProfile);
    const updatedProfile: HeroProfileState = {
      ...consumedProfile,
      gold: consumedProfile.gold + rewardGold,
    };
    setHeroProfile(updatedProfile);
    saveHeroProfile(updatedProfile);

    if (activeCampaignCtx && match.winner === 'player') {
      const stageId = activeCampaignCtx.stage.id;
      setCompletedStageIds((prev) => {
        if (prev.includes(stageId)) {
          void saveProfileToSupabase({
            deckIds: playerDeckIds,
            savedDecks: deckLibrary.decks,
            activeDeckId: deckLibrary.activeDeckId,
            heroProfile: updatedProfile,
            completedStages: prev,
          });
          return prev;
        }
        const next = [...prev, stageId];
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            CAMPAIGN_STORAGE_KEY,
            JSON.stringify(next)
          );
        }
        void saveProfileToSupabase({
          deckIds: playerDeckIds,
          savedDecks: deckLibrary.decks,
          activeDeckId: deckLibrary.activeDeckId,
          heroProfile: updatedProfile,
          completedStages: next,
        });
        return next;
      });
    } else {
      void saveProfileToSupabase({
        deckIds: playerDeckIds,
        savedDecks: deckLibrary.decks,
        activeDeckId: deckLibrary.activeDeckId,
        heroProfile: updatedProfile,
        completedStages: completedStageIds,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.phase, match?.winner]);

  // Switch between Menu music (/sound/musica_fundo.mp3) and Battle music (/sound/battle_dark_tactics.mp3)
  const musicTrack: MusicTrack =
    !match || match.phase === 'draft'
      ? 'menu'
      : match.phase === 'round_active'
        ? 'battle'
        : 'none';

  useEffect(() => {
    setMusicTrack(musicTrack);
  }, [musicTrack]);

  const startSkirmishMatch = () => {
    setActiveCampaignCtx(null);
    const newMatch = createMatch(DEFAULT_CATALOG, {
      terrainId: selectedTerrainId === 'random' ? undefined : selectedTerrainId,
      playerDeckIds,
      playerHeroBuild: heroProfile.build,
    });
    setMatch(newMatch);
  };

  const startCampaignStage = (
    campaign: CampaignDefinition,
    stage: CampaignStageDefinition
  ) => {
    setActiveCampaignCtx({ campaign, stage });
    const newMatch = createMatch(DEFAULT_CATALOG, {
      terrainId: campaign.terrainId,
      enemyName: stage.enemyName,
      playerDeckIds,
      enemyDeckIds: [...stage.enemyCardIds],
      slotModifierIds: stage.slotModifierIds,
      enemyStatMultiplier: stage.enemyStatMultiplier,
      playerHeroBuild: heroProfile.build,
    });
    setMatch(newMatch);
  };

  const handleRestartCurrent = () => {
    if (activeCampaignCtx) {
      startCampaignStage(activeCampaignCtx.campaign, activeCampaignCtx.stage);
    } else {
      startSkirmishMatch();
    }
  };

  const handleExitMatch = () => {
    setMatch(null);
    if (activeCampaignCtx) {
      setView('campaign');
    } else {
      setView('title');
    }
  };

  const handleConfirmDraft = (playerCards: [string, string, string]) => {
    if (!match) return;
    const enemyCards = chooseAiDraft(match, 'enemy');
    setMatch(confirmDraft(match, playerCards, enemyCards));
  };

  return (
    <div className="w-screen h-dvh bg-[#07090d] flex items-center justify-center">
      <div className="mobile-stage bg-slate-950">
        {/* Global Top Fullscreen Button for Mobile Testing */}
        <FullscreenButton />
        {!match ? (
          view === 'campaign' ? (
            <CampaignScreen
              completedStageIds={completedStageIds}
              onStartStage={startCampaignStage}
              onBack={() => setView('title')}
            />
          ) : view === 'deck' ? (
            <DeckManagerScreen
              library={deckLibrary}
              onChangeLibrary={handleUpdateDeckLibrary}
              onBack={() => setView('title')}
            />
          ) : view === 'hero' ? (
            <HeroConfigScreen
              profile={heroProfile}
              onChangeProfile={handleUpdateHeroProfile}
              initialTab={heroTab}
              onBack={() => setView('title')}
            />
          ) : (
            <TitleScreen
              terrains={DEFAULT_CATALOG.terrains}
              selectedTerrainId={selectedTerrainId}
              heroProfile={heroProfile}
              onSelectTerrain={setSelectedTerrainId}
              onStartMatch={startSkirmishMatch}
              onOpenCampaign={() => setView('campaign')}
              onOpenDeck={() => setView('deck')}
              onOpenHeroConfig={() => {
                setHeroTab('equip');
                setView('hero');
              }}
              onOpenHeroShop={() => {
                setHeroTab('shop');
                setView('hero');
              }}
            />
          )
        ) : match.phase === 'draft' ? (
          <DraftScreen state={match} onConfirmDraft={handleConfirmDraft} />
        ) : (
          <BattleArena
            state={match}
            onUpdateState={setMatch}
            onRestart={handleRestartCurrent}
            onBackToTitle={handleExitMatch}
          />
        )}
      </div>
    </div>
  );
}
