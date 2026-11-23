import {
  DEFAULT_CARDS,
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
import { DraftScreen } from './components/DraftScreen';
import { FullscreenButton } from './components/FullscreenButton';
import { TitleScreen } from './components/TitleScreen';
import { setMusicTrack, type MusicTrack } from './utils/music';
import {
  loadProfileFromSupabase,
  recordMatchResultToSupabase,
  saveProfileToSupabase,
} from './utils/supabase';

const DECK_STORAGE_KEY = 'sm_player_deck_ids';
const CAMPAIGN_STORAGE_KEY = 'sm_campaign_progress';
const DEFAULT_9_IDS = DEFAULT_CARDS.slice(0, 9).map((c) => c.id);

function loadSavedDeck(): string[] {
  if (typeof window === 'undefined') return DEFAULT_9_IDS;
  try {
    const raw = window.localStorage.getItem(DECK_STORAGE_KEY);
    if (!raw) return DEFAULT_9_IDS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 9) {
      return parsed;
    }
  } catch {
    // ignore invalid storage
  }
  return DEFAULT_9_IDS;
}

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
  const [view, setView] = useState<'title' | 'campaign'>('title');
  const [selectedTerrainId, setSelectedTerrainId] = useState<string | 'random'>(
    'random'
  );
  const [playerDeckIds, setPlayerDeckIds] = useState<string[]>(loadSavedDeck);
  const [completedStageIds, setCompletedStageIds] = useState<string[]>(
    loadCampaignProgress
  );
  const [activeCampaignCtx, setActiveCampaignCtx] = useState<{
    campaign: CampaignDefinition;
    stage: CampaignStageDefinition;
  } | null>(null);
  const [match, setMatch] = useState<MatchState | null>(null);

  // Load saved profile (deck + campaign progress) from Supabase if configured
  useEffect(() => {
    let active = true;
    loadProfileFromSupabase().then((remote) => {
      if (!active || !remote) return;
      if (Array.isArray(remote.deck_ids) && remote.deck_ids.length === 9) {
        setPlayerDeckIds(remote.deck_ids);
      }
      if (Array.isArray(remote.completed_stages)) {
        setCompletedStageIds((prev) =>
          Array.from(new Set([...prev, ...remote.completed_stages]))
        );
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleUpdateDeck = (nextIds: string[]) => {
    setPlayerDeckIds(nextIds);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(nextIds));
    }
    if (nextIds.length === 9) {
      void saveProfileToSupabase({
        deckIds: nextIds,
        completedStages: completedStageIds,
      });
    }
  };

  // Unlock next campaign stage & record match result in Supabase when a match finishes
  useEffect(() => {
    if (match?.phase !== 'game_over' || !match.winner) return;

    void recordMatchResultToSupabase({
      mode: activeCampaignCtx ? 'campaign' : 'skirmish',
      stageId: activeCampaignCtx?.stage.id,
      terrainId: match.terrain.id,
      result: match.winner,
      rounds: match.round,
    });

    if (activeCampaignCtx && match.winner === 'player') {
      const stageId = activeCampaignCtx.stage.id;
      setCompletedStageIds((prev) => {
        if (prev.includes(stageId)) return prev;
        const next = [...prev, stageId];
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            CAMPAIGN_STORAGE_KEY,
            JSON.stringify(next)
          );
        }
        void saveProfileToSupabase({
          deckIds: playerDeckIds,
          completedStages: next,
        });
        return next;
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
      playerDeckIds: playerDeckIds.length === 9 ? playerDeckIds : DEFAULT_9_IDS,
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
      playerDeckIds: playerDeckIds.length === 9 ? playerDeckIds : DEFAULT_9_IDS,
      enemyDeckIds: [...stage.enemyCardIds],
      slotModifierIds: stage.slotModifierIds,
      enemyStatMultiplier: stage.enemyStatMultiplier,
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
          ) : (
            <TitleScreen
              terrains={DEFAULT_CATALOG.terrains}
              selectedTerrainId={selectedTerrainId}
              playerDeckIds={playerDeckIds}
              onUpdateDeck={handleUpdateDeck}
              onSelectTerrain={setSelectedTerrainId}
              onStartMatch={startSkirmishMatch}
              onOpenCampaign={() => setView('campaign')}
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
