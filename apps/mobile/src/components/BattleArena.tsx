import {
  canUseActiveSkill,
  executeActiveSkill,
  executeStandardAttack,
  getActiveSkill,
  getEffectiveStats,
  getPrecedenceRelation,
  getRemainingMonsters,
  getSideTotalVel,
  passTurn,
  performAiTurn,
  playReinforcement,
  type MatchState,
  type Side,
  type SlotModifierDefinition,
  type VisualEvent,
} from '@super-monster/game-engine';
import { PlusCircle, Sparkles, Swords, Trophy, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { UI_ASSETS } from '../assets/assetPaths';
import { AssetImg } from './AssetImg';
import { BottomHud } from './BottomHud';
import { MonsterCard, type CardMotionEffect } from './MonsterCard';
import { TopHud } from './TopHud';

interface BattleArenaProps {
  state: MatchState;
  onUpdateState: (next: MatchState) => void;
  onRestart: () => void;
  onBackToTitle: () => void;
}

const MOD_TEXT_COLOR: Record<SlotModifierDefinition['color'], string> = {
  red: 'text-red-400',
  blue: 'text-sky-300',
  green: 'text-emerald-300',
  cyan: 'text-cyan-300',
  orange: 'text-orange-400',
  lime: 'text-lime-300',
  rose: 'text-rose-400',
  purple: 'text-purple-300',
  amber: 'text-amber-300',
  indigo: 'text-indigo-300',
};

function getMotionEffectForSlot(
  evt: VisualEvent | null,
  side: Side,
  slotIdx: 0 | 1 | 2
): CardMotionEffect {
  if (!evt) return null;

  if (
    evt.type === 'reinforce' &&
    evt.targetSide === side &&
    evt.targetSlot === slotIdx
  ) {
    return 'enter';
  }

  if (evt.type === 'attack') {
    if (evt.sourceSide === side && evt.sourceSlot === slotIdx) {
      return side === 'player' ? 'lunge-up' : 'lunge-down';
    }
    if (evt.targetSide === side && evt.targetSlot === slotIdx) {
      return 'hit';
    }
  }

  if (evt.type === 'skill') {
    if (evt.sourceSide === side && evt.sourceSlot === slotIdx) {
      return 'skill';
    }
    if (
      evt.targetSide === side &&
      (evt.targetSlot === slotIdx || evt.targetSlot === 'all')
    ) {
      return 'hit';
    }
  }

  if (evt.type === 'heal') {
    if (evt.sourceSide === side && evt.sourceSlot === slotIdx) {
      return 'skill';
    }
    if (evt.targetSide === side) {
      return 'heal';
    }
  }

  return null;
}

export function BattleArena({
  state,
  onUpdateState,
  onRestart,
  onBackToTitle,
}: BattleArenaProps) {
  const [selectedAllySlot, setSelectedAllySlot] = useState<0 | 1 | 2 | null>(null);
  const [actionMode, setActionMode] = useState<'attack' | 'skill'>('attack');
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(null);
  const [isAuto, setIsAuto] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [activeEvent, setActiveEvent] = useState<VisualEvent | null>(null);
  const [initialEnterAnim, setInitialEnterAnim] = useState(true);

  // Trigger entry slam animation when Round 1 starts
  useEffect(() => {
    const t = setTimeout(() => setInitialEnterAnim(false), 550);
    return () => clearTimeout(t);
  }, []);

  // Trigger combat animations whenever lastEvent changes
  useEffect(() => {
    if (!state.lastEvent) return;
    setActiveEvent(state.lastEvent);
    const t = setTimeout(() => setActiveEvent(null), 600);
    return () => clearTimeout(t);
  }, [state.lastEvent]);

  const isPlayerTurn =
    state.phase === 'round_active' && state.activeSide === 'player';

  const selectedAlly =
    selectedAllySlot !== null
      ? state.players.player.slots[selectedAllySlot]
      : null;

  const selectedActiveSkill = selectedAlly ? getActiveSkill(selectedAlly) : null;
  const selectedCanUseSkill = selectedAlly ? canUseActiveSkill(selectedAlly) : false;

  const playerHasEmptySlot = state.players.player.slots.some((s) => s === null);
  const canReinforce =
    isPlayerTurn &&
    playerHasEmptySlot &&
    state.players.player.hand.length > 0 &&
    state.players.player.extrasPlayed < state.players.player.maxExtras;

  useEffect(() => {
    if (!isPlayerTurn) {
      setSelectedAllySlot(null);
      setSelectedHandIndex(null);
      setActionMode('attack');
    }
  }, [isPlayerTurn, state.round]);

  useEffect(() => {
    if (state.phase !== 'round_active' || showPause) return;

    if (state.activeSide === 'enemy') {
      const timer = setTimeout(() => {
        onUpdateState(performAiTurn(state, 'enemy'));
      }, 750);
      return () => clearTimeout(timer);
    }

    if (state.activeSide === 'player' && isAuto) {
      const timer = setTimeout(() => {
        onUpdateState(performAiTurn(state, 'player'));
      }, 680);
      return () => clearTimeout(timer);
    }
  }, [state, isAuto, showPause, onUpdateState]);

  const handleSelectAlly = (slotIdx: 0 | 1 | 2) => {
    if (!isPlayerTurn || isAuto) return;
    const mon = state.players.player.slots[slotIdx];

    if (!mon && selectedHandIndex !== null && canReinforce) {
      const next = playReinforcement(state, 'player', selectedHandIndex, slotIdx);
      setSelectedHandIndex(null);
      onUpdateState(next);
      return;
    }

    if (!mon || mon.status !== 'ready') return;
    setSelectedHandIndex(null);

    if (selectedAllySlot === slotIdx) {
      setSelectedAllySlot(null);
      setActionMode('attack');
    } else {
      setSelectedAllySlot(slotIdx);
      setActionMode('attack');
    }
  };

  const handleSelectEnemy = (enemySlot: 0 | 1 | 2) => {
    if (!isPlayerTurn || selectedAllySlot === null || !selectedAlly) return;
    if (!state.players.enemy.slots[enemySlot]) return;

    if (actionMode === 'skill' && selectedCanUseSkill) {
      onUpdateState(
        executeActiveSkill(state, 'player', selectedAllySlot, enemySlot)
      );
    } else {
      onUpdateState(
        executeStandardAttack(state, 'player', selectedAllySlot, {
          type: 'monster',
          slotIndex: enemySlot,
        })
      );
    }
    setSelectedAllySlot(null);
    setActionMode('attack');
  };

  const handleTriggerActiveSkillButton = () => {
    if (selectedAllySlot === null || !selectedActiveSkill || !selectedCanUseSkill) {
      return;
    }

    if (selectedActiveSkill.scope !== 'chosen_enemy') {
      onUpdateState(executeActiveSkill(state, 'player', selectedAllySlot));
      setSelectedAllySlot(null);
      setActionMode('attack');
      return;
    }

    setActionMode('skill');
  };

  const playerVel = getSideTotalVel(state, 'player');
  const enemyVel = getSideTotalVel(state, 'enemy');
  const enemyRem = getRemainingMonsters(state, 'enemy');
  const allyRem = getRemainingMonsters(state, 'player');

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950">
      {/* Top HUD */}
      <TopHud
        round={state.round}
        enemyName={state.players.enemy.heroName}
        enemyRemaining={enemyRem.total}
        enemyMaxTotal={enemyRem.maxTotal}
        enemyOnBoard={enemyRem.onBoard}
        playerVel={playerVel}
        enemyVel={enemyVel}
        activeSide={state.activeSide}
        isAuto={isAuto}
        onToggleAuto={() => setIsAuto((v) => !v)}
        onOpenLog={() => setShowLog(true)}
        onRestart={onRestart}
        onPause={() => setShowPause(true)}
      />

      {/* Central Arena with Interchangeable Terrain + Stone Side Borders */}
      <main className="relative flex-1 flex overflow-hidden">
        <img
          src={state.terrain.imageUrl}
          alt={state.terrain.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-transparent to-slate-950/55 pointer-events-none" />

        {/* Left Stone Border */}
        <div className="relative z-10 w-2.5 shrink-0 stone-side-border" />

        {/* 3x3 Board Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-between px-2.5 py-2.5">
          {/* Enemy Row (Top 3 Slots) */}
          <div className="grid grid-cols-3 gap-2">
            {([0, 1, 2] as const).map((slotIdx) => {
              const mon = state.players.enemy.slots[slotIdx];
              const stats = getEffectiveStats(state, 'enemy', slotIdx);
              const isTargetable =
                isPlayerTurn &&
                selectedAllySlot !== null &&
                selectedAlly !== null &&
                mon !== null;
              const precPreview =
                isTargetable && selectedAlly && mon
                  ? getPrecedenceRelation(
                      selectedAlly.card.precedence,
                      mon.card.precedence
                    )
                  : null;
              const showEvent =
                state.lastEvent?.targetSide === 'enemy' &&
                (state.lastEvent?.targetSlot === slotIdx ||
                  (state.lastEvent?.targetSlot === 'all' && slotIdx === 1));
              const motion = initialEnterAnim
                ? 'enter'
                : getMotionEffectForSlot(activeEvent, 'enemy', slotIdx);

              return (
                <div key={slotIdx} className="relative">
                  {mon ? (
                    <MonsterCard
                      monster={mon}
                      effectiveAtk={stats.atk}
                      effectiveVel={stats.vel}
                      isPlayerSide={false}
                      isTargetable={isTargetable}
                      precedencePreview={precPreview}
                      motionEffect={motion}
                      onClick={() => handleSelectEnemy(slotIdx)}
                    />
                  ) : (
                    <div className="relative w-full aspect-[3/4.2] rounded-xl border-2 border-slate-500/50 bg-slate-950/45 overflow-hidden flex items-center justify-center">
                      <AssetImg
                        src={UI_ASSETS.slotEmpty}
                        alt="Espaço vazio"
                        className="absolute inset-0 w-full h-full object-cover opacity-65"
                        fallback={null}
                      />
                      <span className="relative z-10 text-[10px] font-extrabold text-slate-300/80 text-outline-sm">
                        VAZIO
                      </span>
                    </div>
                  )}

                  {showEvent && state.lastEvent?.label && (
                    <div
                      key={state.lastEvent.id}
                      className="pointer-events-none absolute top-1/3 left-1/2 z-40 px-2 py-0.5 rounded bg-red-600/95 border border-amber-200 text-white text-xs font-black whitespace-nowrap shadow-lg animate-damage-pop text-outline-sm"
                    >
                      {state.lastEvent.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Center Strip: Floating Slot Modifiers + Turn Action Bar */}
          <div className="my-1 flex flex-col items-center gap-1.5">
            <div className="w-full grid grid-cols-3 gap-2 text-center">
              {([0, 1, 2] as const).map((slotIdx) => {
                const mod = state.players.player.slotModifiers[slotIdx];
                return (
                  <div
                    key={slotIdx}
                    title={`${mod.name}: ${mod.description}`}
                    className="flex flex-col items-center justify-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <AssetImg
                        src={mod.iconUrl}
                        alt={mod.name}
                        className="w-5 h-5 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                        fallback={null}
                      />
                      <span
                        className={[
                          'font-display font-black text-sm sm:text-base tracking-wide text-outline',
                          MOD_TEXT_COLOR[mod.color],
                        ].join(' ')}
                      >
                        {mod.label}
                      </span>
                    </div>
                    <span className="text-[8.5px] font-extrabold text-slate-100 bg-slate-950/80 border border-slate-600/70 px-1.5 rounded text-outline-sm">
                      {mod.effect === 'damage_reduction'
                        ? `-${mod.value}% Dano`
                        : `+${mod.value}`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Contextual Action Hint / Quick Choice Menu */}
            {selectedAlly ? (
              <div className="w-full rounded-xl bg-slate-950/92 border border-amber-400/75 px-2.5 py-1.5 backdrop-blur-sm shadow-xl">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10.5px] font-black text-amber-300 truncate text-outline-sm">
                      {selectedAlly.card.name}
                    </div>
                    <div className="text-[9.5px] text-slate-200 truncate">
                      {actionMode === 'skill'
                        ? 'Escolha um inimigo alvo para a habilidade'
                        : 'Escolha uma carta inimiga para atacar'}
                    </div>
                  </div>

                  {selectedActiveSkill && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActionMode('attack')}
                        className={[
                          'flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-extrabold transition cursor-pointer',
                          actionMode === 'attack'
                            ? 'bg-red-600 border-red-300 text-white'
                            : 'bg-slate-800 border-slate-600 text-slate-300',
                        ].join(' ')}
                      >
                        <Swords className="w-3 h-3" />
                        Atacar
                      </button>
                      <button
                        type="button"
                        disabled={!selectedCanUseSkill}
                        onClick={handleTriggerActiveSkillButton}
                        className={[
                          'flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-extrabold transition',
                          selectedCanUseSkill
                            ? actionMode === 'skill'
                              ? 'bg-amber-400 border-amber-100 text-slate-950 cursor-pointer'
                              : 'bg-amber-600/90 border-amber-300 text-white hover:bg-amber-500 cursor-pointer'
                            : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed',
                        ].join(' ')}
                      >
                        <Sparkles className="w-3 h-3" />
                        {selectedCanUseSkill
                          ? 'Habilidade'
                          : `Rec. ${selectedAlly.activeCooldown}`}
                      </button>
                    </div>
                  )}
                </div>

                {selectedAlly.card.skills[0] && (
                  <div className="text-[9.5px] text-amber-200/90 mt-1 border-t border-slate-800 pt-1">
                    <strong>{selectedAlly.card.skills[0].name}:</strong>{' '}
                    {selectedAlly.card.skills[0].description}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-full bg-slate-950/85 border border-slate-500/80 px-3 py-0.5 text-[10px] font-extrabold text-slate-100 text-outline-sm">
                {selectedHandIndex !== null
                  ? 'Toque em um espaço VAZIO para posicionar o reforço'
                  : isPlayerTurn && allyRem.onBoard === 0 && canReinforce
                    ? 'Campo vazio! Toque em uma carta da mão para reforçar!'
                    : isPlayerTurn
                      ? 'Sua vez: escolha 1 monstro pronto para agir'
                      : 'Turno do adversário...'}
              </div>
            )}
          </div>

          {/* Ally Row (Bottom 3 Slots) */}
          <div className="grid grid-cols-3 gap-2">
            {([0, 1, 2] as const).map((slotIdx) => {
              const mon = state.players.player.slots[slotIdx];
              const stats = getEffectiveStats(state, 'player', slotIdx);
              const isSelectable =
                isPlayerTurn && !isAuto && mon !== null && mon.status === 'ready';
              const isDeployTarget =
                !mon && selectedHandIndex !== null && canReinforce;
              const showEvent =
                state.lastEvent?.targetSide === 'player' &&
                state.lastEvent?.targetSlot === slotIdx;
              const motion = initialEnterAnim
                ? 'enter'
                : getMotionEffectForSlot(activeEvent, 'player', slotIdx);

              return (
                <div key={slotIdx} className="relative">
                  {mon ? (
                    <MonsterCard
                      monster={mon}
                      effectiveAtk={stats.atk}
                      effectiveVel={stats.vel}
                      isPlayerSide
                      isSelected={selectedAllySlot === slotIdx}
                      isSelectable={isSelectable}
                      motionEffect={motion}
                      onClick={() => handleSelectAlly(slotIdx)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectAlly(slotIdx)}
                      disabled={!isDeployTarget}
                      className={[
                        'relative w-full aspect-[3/4.2] rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-1 text-[10px] font-extrabold transition',
                        isDeployTarget
                          ? 'border-amber-400 bg-amber-500/25 text-amber-200 animate-pulse cursor-pointer'
                          : 'border-slate-500/50 bg-slate-950/45 text-slate-300/80 cursor-default',
                      ].join(' ')}
                    >
                      <AssetImg
                        src={UI_ASSETS.slotEmpty}
                        alt="Espaço vazio"
                        className="absolute inset-0 w-full h-full object-cover opacity-65"
                        fallback={null}
                      />
                      {isDeployTarget ? (
                        <div className="relative z-10 flex flex-col items-center gap-1 text-outline-sm">
                          <PlusCircle className="w-6 h-6" />
                          <span>REFORÇAR</span>
                        </div>
                      ) : (
                        <span className="relative z-10 text-outline-sm">VAZIO</span>
                      )}
                    </button>
                  )}

                  {showEvent && state.lastEvent?.label && (
                    <div
                      key={state.lastEvent.id}
                      className={[
                        'pointer-events-none absolute top-1/3 left-1/2 z-40 px-2 py-0.5 rounded border text-white text-xs font-black whitespace-nowrap shadow-lg animate-damage-pop text-outline-sm',
                        state.lastEvent.type === 'heal'
                          ? 'bg-emerald-600/95 border-emerald-200'
                          : state.lastEvent.type === 'reinforce'
                            ? 'bg-amber-500/95 border-amber-100 text-slate-950'
                            : 'bg-red-600/95 border-amber-200',
                      ].join(' ')}
                    >
                      {state.lastEvent.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Stone Border */}
        <div className="relative z-10 w-2.5 shrink-0 stone-side-border" />
      </main>

      {/* Bottom HUD */}
      <BottomHud
        heroName={state.players.player.heroName}
        allyRemaining={allyRem.total}
        allyMaxTotal={allyRem.maxTotal}
        hand={state.players.player.hand}
        deckCount={state.players.player.deck.length}
        extrasPlayed={state.players.player.extrasPlayed}
        maxExtras={state.players.player.maxExtras}
        selectedHandIndex={selectedHandIndex}
        canReinforce={canReinforce}
        canPass={isPlayerTurn && !isAuto}
        onSelectHandCard={(idx) => {
          setSelectedAllySlot(null);
          setSelectedHandIndex((curr) => (curr === idx ? null : idx));
        }}
        onPassTurn={() => onUpdateState(passTurn(state, 'player'))}
      />

      {/* Combat Log Modal */}
      {showLog && (
        <div className="absolute inset-0 z-50 bg-slate-950/88 backdrop-blur-sm flex flex-col p-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
            <h3 className="font-display font-bold text-amber-300">
              Registro de Combate
            </h3>
            <button
              type="button"
              onClick={() => setShowLog(false)}
              className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 text-xs">
            {state.log.map((entry) => (
              <div
                key={entry.id}
                className="rounded bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 text-slate-200"
              >
                <span className="text-[10px] font-bold text-amber-400 mr-1.5">
                  [R{entry.round}]
                </span>
                {entry.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pause & Rules Quick Reference Modal */}
      {showPause && (
        <div className="absolute inset-0 z-50 bg-slate-950/88 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-xs rounded-2xl bg-slate-900 border-2 border-slate-600 p-4 space-y-3 shadow-2xl">
            <h3 className="font-display font-black text-center text-lg text-amber-300">
              Pausa & Regras Rápidas
            </h3>
            <div className="text-xs text-slate-300 space-y-1.5 bg-slate-950/80 rounded-lg p-3 border border-slate-800">
              <p>
                <strong className="text-red-400">Fúria (Vermelho)</strong> vence{' '}
                <strong className="text-emerald-400">Astúcia (Verde)</strong>
              </p>
              <p>
                <strong className="text-emerald-400">Astúcia (Verde)</strong> vence{' '}
                <strong className="text-sky-400">Arcano (Azul)</strong>
              </p>
              <p>
                <strong className="text-sky-400">Arcano (Azul)</strong> vence{' '}
                <strong className="text-red-400">Fúria (Vermelho)</strong>
              </p>
              <p className="text-[11px] text-amber-200/90 pt-1 border-t border-slate-800">
                Vitória: destrua todas as cartas do adversário (3 iniciais + até 2
                reforços). Não há vida nos jogadores!
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowPause(false)}
                className="w-full py-2.5 rounded-lg bg-amber-500 text-slate-950 font-black text-sm cursor-pointer"
              >
                CONTINUAR
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPause(false);
                  onRestart();
                }}
                className="w-full py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 font-bold text-xs cursor-pointer"
              >
                Reiniciar Partida
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPause(false);
                  onBackToTitle();
                }}
                className="w-full py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-400 font-bold text-xs cursor-pointer"
              >
                Voltar ao Menu Inicial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {state.phase === 'game_over' && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-xs rounded-2xl bg-slate-900 border-2 border-amber-400 p-5 text-center space-y-4 shadow-2xl">
            <Trophy
              className={[
                'w-12 h-12 mx-auto',
                state.winner === 'player' ? 'text-amber-400' : 'text-red-500',
              ].join(' ')}
            />
            <div>
              <h2 className="font-display font-black text-2xl text-white">
                {state.winner === 'player' ? 'VITÓRIA!' : 'DERROTA'}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {state.winner === 'player'
                  ? `Todas as cartas de ${state.players.enemy.heroName} foram destruídas na Rodada ${state.round}!`
                  : `Todas as suas cartas foram destruídas na Rodada ${state.round}.`}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onRestart}
                className="w-full py-3 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 font-display font-black text-sm cursor-pointer"
              >
                JOGAR NOVAMENTE
              </button>
              <button
                type="button"
                onClick={onBackToTitle}
                className="w-full py-2 rounded-xl bg-slate-800 border border-slate-600 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Voltar ao Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
