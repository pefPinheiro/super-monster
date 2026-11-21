import {
  DEFAULT_CATALOG,
  chooseAiDraft,
  confirmDraft,
  createMatch,
  type MatchState,
} from '@super-monster/game-engine';
import { useState } from 'react';
import { BattleArena } from './components/BattleArena';
import { DraftScreen } from './components/DraftScreen';
import { TitleScreen } from './components/TitleScreen';

export function App() {
  const [selectedTerrainId, setSelectedTerrainId] = useState<string | 'random'>(
    'random'
  );
  const [match, setMatch] = useState<MatchState | null>(null);

  const startNewMatch = () => {
    const newMatch = createMatch(DEFAULT_CATALOG, {
      terrainId: selectedTerrainId === 'random' ? undefined : selectedTerrainId,
    });
    setMatch(newMatch);
  };

  const handleConfirmDraft = (playerCards: [string, string, string]) => {
    if (!match) return;
    const enemyCards = chooseAiDraft(match, 'enemy');
    setMatch(confirmDraft(match, playerCards, enemyCards));
  };

  return (
    <div className="w-screen h-dvh bg-[#07090d] flex items-center justify-center">
      <div className="mobile-stage bg-slate-950">
        {!match ? (
          <TitleScreen
            terrains={DEFAULT_CATALOG.terrains}
            selectedTerrainId={selectedTerrainId}
            onSelectTerrain={setSelectedTerrainId}
            onStartMatch={startNewMatch}
          />
        ) : match.phase === 'draft' ? (
          <DraftScreen state={match} onConfirmDraft={handleConfirmDraft} />
        ) : (
          <BattleArena
            state={match}
            onUpdateState={setMatch}
            onRestart={startNewMatch}
            onBackToTitle={() => setMatch(null)}
          />
        )}
      </div>
    </div>
  );
}
