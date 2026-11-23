import {
  canUseActiveSkill,
  executeActiveSkill,
  executeStandardAttack,
  getActiveSkill,
  getEffectiveStats,
  getPrecedenceRelation,
  getReadySlots,
  getRemainingMonsters,
  getRoundTurnTimeline,
  getSideTotalVel,
  passTurn,
  performAiTurn,
  playReinforcement,
  type CardDefinition,
  type MatchState,
  type Side,
  type SlotModifierDefinition,
  type VisualEvent,
} from '@super-monster/game-engine';
import { PlusCircle, Sparkles, Swords } from 'lucide-react';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { UI_ASSETS } from '../assets/assetPaths';
import { sfx } from '../utils/sfx';
import { AssetImg } from './AssetImg';
import { BottomHud } from './BottomHud';
import { CardInspectModal } from './CardInspectModal';
import { HeroEffectsModal } from './HeroEffectsModal';
import { MonsterCard, type CardMotionEffect } from './MonsterCard';
import { RunicButton } from './RunicButton';
import { RunicDialog } from './RunicDialog';
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

const MOD_ACTIVE_GLOW: Record<
  SlotModifierDefinition['color'],
  { idle: string; firing: string }
> = {
  red: {
    idle: 'border-red-500/80 shadow-[0_0_16px_rgba(239,68,68,0.6)]',
    firing: 'border-red-300 shadow-[0_0_26px_rgba(239,68,68,0.95)] scale-105 animate-pulse',
  },
  blue: {
    idle: 'border-sky-400/80 shadow-[0_0_16px_rgba(56,189,248,0.6)]',
    firing: 'border-sky-200 shadow-[0_0_26px_rgba(56,189,248,0.95)] scale-105 animate-pulse',
  },
  green: {
    idle: 'border-emerald-400/80 shadow-[0_0_16px_rgba(34,197,94,0.6)]',
    firing: 'border-emerald-200 shadow-[0_0_26px_rgba(34,197,94,0.95)] scale-105 animate-pulse',
  },
  cyan: {
    idle: 'border-cyan-400/80 shadow-[0_0_16px_rgba(34,211,238,0.6)]',
    firing: 'border-cyan-200 shadow-[0_0_26px_rgba(34,211,238,0.95)] scale-105 animate-pulse',
  },
  orange: {
    idle: 'border-orange-400/80 shadow-[0_0_16px_rgba(249,115,22,0.65)]',
    firing: 'border-orange-200 shadow-[0_0_26px_rgba(249,115,22,0.98)] scale-105 animate-pulse',
  },
  lime: {
    idle: 'border-lime-400/80 shadow-[0_0_16px_rgba(132,204,22,0.6)]',
    firing: 'border-lime-200 shadow-[0_0_26px_rgba(132,204,22,0.95)] scale-105 animate-pulse',
  },
  rose: {
    idle: 'border-rose-400/80 shadow-[0_0_16px_rgba(244,63,94,0.6)]',
    firing: 'border-rose-200 shadow-[0_0_26px_rgba(244,63,94,0.95)] scale-105 animate-pulse',
  },
  purple: {
    idle: 'border-purple-400/80 shadow-[0_0_16px_rgba(168,85,247,0.6)]',
    firing: 'border-purple-200 shadow-[0_0_26px_rgba(168,85,247,0.95)] scale-105 animate-pulse',
  },
  amber: {
    idle: 'border-amber-400/85 shadow-[0_0_16px_rgba(245,158,11,0.65)]',
    firing: 'border-amber-200 shadow-[0_0_26px_rgba(245,158,11,0.98)] scale-105 animate-pulse',
  },
  indigo: {
    idle: 'border-indigo-400/80 shadow-[0_0_16px_rgba(99,102,241,0.6)]',
    firing: 'border-indigo-200 shadow-[0_0_26px_rgba(99,102,241,0.95)] scale-105 animate-pulse',
  },
};

const TIMING_LABELS: Record<SlotModifierDefinition['timing'], string> = {
  continuous: 'Efeito Contínuo no Lugar',
  end_of_round: 'Ativa ao Final de Cada Rodada',
  on_attack: 'Ativa Sempre que Atacar',
  on_defend: 'Ativa ao Receber Ataque Direto',
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
      return 'hit-attack';
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
      return 'hit-damage';
    }
  }

  if (evt.type === 'heal') {
    if (
      evt.targetSide === side &&
      (evt.targetSlot === slotIdx || evt.targetSlot === 'all')
    ) {
      return 'heal';
    }
    if (evt.sourceSide === side && evt.sourceSlot === slotIdx) {
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
  const [selectedAllySlot, setSelectedAllySlot] = useState<0 | 1 | 2 | null>(
    null
  );
  const [actionMode, setActionMode] = useState<'attack' | 'skill'>('attack');
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(
    null
  );
  const [isAuto, setIsAuto] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [activeEvent, setActiveEvent] = useState<VisualEvent | null>(null);
  const [arenaShake, setArenaShake] = useState(false);
  const [initialEnterAnim, setInitialEnterAnim] = useState(true);
  const [turnBanner, setTurnBanner] = useState<{
    key: string;
    title: string;
    subtitle: string;
    side: Side;
  } | null>(null);
  const [popupModifier, setPopupModifier] =
    useState<SlotModifierDefinition | null>(null);
  const [inspectModalCard, setInspectModalCard] = useState<{
    card: CardDefinition;
    effectiveStats?: { atk: number; hp: number; vel: number; shield?: number };
  } | null>(null);
  const [inspectHeroSide, setInspectHeroSide] = useState<Side | null>(null);
  const [newlyDrawnCardId, setNewlyDrawnCardId] = useState<string | null>(null);
  const [drawnToastName, setDrawnToastName] = useState<string | null>(null);
  const prevExtrasDrawnRef = useRef<number>(state.players.player.extrasDrawn);

  // Trigger entry slam animation when Round 1 starts
  useEffect(() => {
    sfx.cardPlace();
    const t = setTimeout(() => setInitialEnterAnim(false), 750);
    return () => clearTimeout(t);
  }, []);

  // Detect when a new reinforcement card arrives (only triggers when extrasDrawn increments)
  useEffect(() => {
    const currDrawn = state.players.player.extrasDrawn;
    if (currDrawn > prevExtrasDrawnRef.current) {
      const latestCard =
        state.players.player.hand[state.players.player.hand.length - 1];
      if (latestCard) {
        setNewlyDrawnCardId(latestCard.id);
        setDrawnToastName(latestCard.name);
        sfx.cardPlace();
      }
    }
    prevExtrasDrawnRef.current = currDrawn;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.players.player.extrasDrawn]);

  // Auto-dismiss reinforcement text toast quickly (never gets stuck on screen!)
  useEffect(() => {
    if (!drawnToastName) return;
    const t = setTimeout(() => {
      setDrawnToastName(null);
      setNewlyDrawnCardId(null);
    }, 2000);
    return () => clearTimeout(t);
  }, [drawnToastName]);

  // Trigger combat animations, screen shake, and SFX whenever lastEvent changes (slower, readable timing)
  useEffect(() => {
    const evt = state.lastEvent;
    if (!evt) return;
    setActiveEvent(evt);

    if (evt.type === 'attack') {
      sfx.attack(evt.precedenceResult === 'advantage');
      setArenaShake(true);
    } else if (evt.type === 'skill') {
      sfx.skill();
      setArenaShake(true);
    } else if (evt.type === 'heal') {
      sfx.heal();
    } else if (evt.type === 'reinforce') {
      sfx.cardPlace();
    }

    const shakeTimer = setTimeout(() => setArenaShake(false), 420);
    const evtTimer = setTimeout(() => setActiveEvent(null), 1550);
    return () => {
      clearTimeout(shakeTimer);
      clearTimeout(evtTimer);
    };
  }, [state.lastEvent]);

  // Victory / Defeat fanfare
  useEffect(() => {
    if (state.phase !== 'game_over') return;
    if (state.winner === 'player') sfx.victory();
    else sfx.defeat();
  }, [state.phase, state.winner]);

  // Trigger sculpted Turn & Round transition banner (hud_turn_banner.png) with clear turn order
  useEffect(() => {
    if (state.phase !== 'round_active') return;
    const pVel = getSideTotalVel(state, 'player');
    const eVel = getSideTotalVel(state, 'enemy');
    const isPlayer = state.activeSide === 'player';
    const orderLabel =
      state.activeSide === state.initiativeSide ? '1º A AGIR' : '2º A AGIR';
    setTurnBanner({
      key: `${state.round}-${state.activeSide}-${state.log[0]?.id ?? ''}`,
      title: isPlayer ? 'SUA VEZ' : 'VEZ DO INIMIGO',
      subtitle: `ROUND ${state.round} • ${orderLabel} • VEL ${pVel} × ${eVel}`,
      side: state.activeSide,
    });
    const t = setTimeout(() => setTurnBanner(null), 1950);
    return () => clearTimeout(t);
  }, [state.activeSide, state.round, state.phase, state.initiativeSide]);

  const isPlayerTurn =
    state.phase === 'round_active' && state.activeSide === 'player';

  const selectedAlly =
    selectedAllySlot !== null
      ? state.players.player.slots[selectedAllySlot]
      : null;

  const selectedActiveSkill = selectedAlly ? getActiveSkill(selectedAlly) : null;
  const selectedCanUseSkill = selectedAlly
    ? canUseActiveSkill(selectedAlly)
    : false;

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

  // Deliberate, readable pacing for AI & AUTO turns (no longer rushed!)
  useEffect(() => {
    if (state.phase !== 'round_active') return;

    if (state.activeSide === 'enemy') {
      const timer = setTimeout(() => {
        onUpdateState(performAiTurn(state, 'enemy'));
      }, 2100);
      return () => clearTimeout(timer);
    }

    if (state.activeSide === 'player' && isAuto) {
      const timer = setTimeout(() => {
        onUpdateState(performAiTurn(state, 'player'));
      }, 1850);
      return () => clearTimeout(timer);
    }
  }, [state, isAuto, onUpdateState]);

  const isChoosingAllyForSkill =
    actionMode === 'skill' &&
    selectedActiveSkill?.scope === 'chosen_ally' &&
    selectedAllySlot !== null;

  const handleSelectAlly = (slotIdx: 0 | 1 | 2) => {
    if (!isPlayerTurn || isAuto) return;
    const mon = state.players.player.slots[slotIdx];

    // If casting a chosen_ally skill (e.g., Kitsune / Boto / Djinn shield), apply to clicked ally!
    if (isChoosingAllyForSkill && mon && selectedAllySlot !== null) {
      onUpdateState(
        executeActiveSkill(state, 'player', selectedAllySlot, slotIdx)
      );
      setSelectedAllySlot(null);
      setActionMode('attack');
      return;
    }

    if (!mon && selectedHandIndex !== null && canReinforce) {
      const next = playReinforcement(state, 'player', selectedHandIndex, slotIdx);
      setSelectedHandIndex(null);
      onUpdateState(next);
      return;
    }

    if (!mon || mon.status !== 'ready') return;
    sfx.click();
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
    if (isChoosingAllyForSkill) return;
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
    if (
      selectedAllySlot === null ||
      !selectedActiveSkill ||
      !selectedCanUseSkill
    ) {
      return;
    }
    sfx.click();

    if (
      selectedActiveSkill.scope !== 'chosen_enemy' &&
      selectedActiveSkill.scope !== 'chosen_ally'
    ) {
      onUpdateState(executeActiveSkill(state, 'player', selectedAllySlot));
      setSelectedAllySlot(null);
      setActionMode('attack');
      return;
    }

    setActionMode('skill');
  };

  const playerVel = getSideTotalVel(state, 'player');
  const enemyVel = getSideTotalVel(state, 'enemy');
  const playerReadyCount = getReadySlots(state, 'player').length;
  const enemyReadyCount = getReadySlots(state, 'enemy').length;
  const turnTimeline = getRoundTurnTimeline(state);
  const nextTurnItem = turnTimeline[0] ?? null;
  const enemyRem = getRemainingMonsters(state, 'enemy');
  const allyRem = getRemainingMonsters(state, 'player');

  const getSlotCenterCoords = (
    side: Side,
    slot: 0 | 1 | 2 | 'all'
  ): { x: number; y: number } => {
    const xMap = { 0: 17, 1: 50, 2: 83, all: 50 };
    const y = side === 'enemy' ? 20 : 80;
    return { x: xMap[slot], y };
  };

  const projectileStyle = (() => {
    if (
      !activeEvent ||
      !activeEvent.sourceSide ||
      activeEvent.sourceSlot === undefined ||
      !activeEvent.targetSide ||
      activeEvent.targetSlot === undefined ||
      activeEvent.type === 'reinforce'
    ) {
      return null;
    }
    const from = getSlotCenterCoords(
      activeEvent.sourceSide,
      activeEvent.sourceSlot
    );
    const to = getSlotCenterCoords(
      activeEvent.targetSide,
      activeEvent.targetSlot
    );
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    return {
      '--from-x': `${from.x}%`,
      '--from-y': `${from.y}%`,
      '--to-x': `${to.x}%`,
      '--to-y': `${to.y}%`,
      '--angle': `${angleDeg}deg`,
    } as CSSProperties;
  })();

  return (
    <div
      className={[
        'relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950',
        arenaShake ? 'animate-arena-shake' : '',
      ].join(' ')}
    >
      {/* Top HUD */}
      <TopHud
        round={state.round}
        enemyName={state.players.enemy.heroName}
        enemyRemaining={enemyRem.total}
        enemyMaxTotal={enemyRem.maxTotal}
        enemyOnBoard={enemyRem.onBoard}
        playerVel={playerVel}
        enemyVel={enemyVel}
        playerReadyCount={playerReadyCount}
        enemyReadyCount={enemyReadyCount}
        activeSide={state.activeSide}
        initiativeSide={state.initiativeSide}
        isAuto={isAuto}
        onToggleAuto={() => setIsAuto((v) => !v)}
        onOpenLog={() => setShowLog(true)}
        onInspectEnemyHero={() => {
          sfx.click();
          setInspectHeroSide('enemy');
        }}
      />

      {/* Central Arena with Interchangeable Terrain */}
      <main className="relative flex-1 flex overflow-hidden">
        <img
          src={state.terrain.imageUrl}
          alt={state.terrain.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/55 pointer-events-none" />

        {/* Epic Sculpted Turn Transition Banner (hud_turn_banner.png) */}
        {turnBanner && (
          <div
            key={turnBanner.key}
            className="pointer-events-none absolute top-2 inset-x-4 z-40 flex justify-center animate-turn-banner"
          >
            <div className="relative w-full max-w-[335px] aspect-[3.1/1] flex flex-col items-center justify-center">
              <AssetImg
                src={UI_ASSETS.hudTurnBanner}
                alt=""
                className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)]"
                fallback={
                  <div className="absolute inset-x-4 inset-y-3 rounded-xl runic-dialog-panel border-2 border-amber-400" />
                }
              />
              <div
                className={[
                  'relative z-10 font-display text-sm tracking-[0.14em] text-outline pt-1',
                  turnBanner.side === 'player'
                    ? 'text-emerald-200'
                    : 'text-rose-200',
                ].join(' ')}
              >
                {turnBanner.title}
              </div>
              <div className="relative z-10 font-runic text-[9px] tracking-widest text-amber-300 text-outline-sm">
                {turnBanner.subtitle}
              </div>
            </div>
          </div>
        )}

        {/* Clean Text-Only New Reinforcement Toast (no plate, disappears quickly) */}
        {drawnToastName && (
          <div className="pointer-events-none absolute bottom-4 inset-x-4 z-40 flex justify-center animate-turn-banner">
            <span className="font-display text-sm sm:text-base tracking-[0.08em] text-sky-200 text-outline drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] text-center">
              ★ Novo Reforço: {drawnToastName}
            </span>
          </div>
        )}

        {/* Image-Based Flying Projectile VFX (only renders when vfx_attack_projectile.png exists — zero generic HTML lines!) */}
        {projectileStyle && activeEvent && (
          <div
            key={`proj-${activeEvent.id}`}
            style={projectileStyle}
            className="pointer-events-none absolute z-40 w-24 h-12 flex items-center justify-center animate-projectile-fly"
          >
            <AssetImg
              src={UI_ASSETS.vfxAttackProjectile}
              alt=""
              className="w-full h-full object-contain opacity-90 drop-shadow-[0_0_14px_rgba(251,191,36,0.95)]"
              fallback={null}
            />
          </div>
        )}

        {/* 3x3 Board Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-between px-3 py-1.5">
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
              // Effects & attacks ONLY apply to cards currently on the field (never empty slots!)
              const showEvent =
                mon !== null &&
                activeEvent?.targetSide === 'enemy' &&
                (activeEvent?.targetSlot === slotIdx ||
                  activeEvent?.targetSlot === 'all');
              const isLastSource =
                mon !== null &&
                activeEvent?.sourceSide === 'enemy' &&
                activeEvent?.sourceSlot === slotIdx;
              const isLastTarget = showEvent;
              const motion =
                mon === null
                  ? null
                  : initialEnterAnim
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
                      isLastSource={isLastSource}
                      isLastTarget={isLastTarget}
                      precedencePreview={precPreview}
                      motionEffect={motion}
                      onClick={() => handleSelectEnemy(slotIdx)}
                      onInspect={() =>
                        setInspectModalCard({
                          card: mon.card,
                          effectiveStats: {
                            atk: stats.atk,
                            hp: mon.currentHp,
                            vel: stats.vel,
                            shield: mon.shield,
                          },
                        })
                      }
                    />
                  ) : (
                    <div className="relative w-full aspect-[3/4.15] rounded-xl overflow-hidden flex items-center justify-center">
                      <AssetImg
                        src={UI_ASSETS.slotEmpty}
                        alt="Espaço vazio"
                        className="absolute inset-0 w-full h-full object-fill scale-[1.03] opacity-85 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
                        fallback={
                          <div className="absolute inset-0 rounded-xl border-2 border-slate-500/50 bg-slate-950/45" />
                        }
                      />
                      <span className="relative z-10 text-[10px] font-runic font-extrabold text-slate-300/85 text-outline-sm">
                        VAZIO
                      </span>
                    </div>
                  )}

                  {showEvent && activeEvent?.label && (
                    <div
                      key={activeEvent.id}
                      className={[
                        'pointer-events-none absolute top-1/3 left-1/2 z-40 px-2.5 py-1 rounded-lg border-2 text-white text-xs font-display font-black whitespace-nowrap shadow-[0_6px_18px_rgba(0,0,0,0.95)] animate-damage-pop text-outline',
                        activeEvent.type === 'heal'
                          ? 'bg-emerald-600/95 border-emerald-200'
                          : activeEvent.precedenceResult === 'advantage'
                            ? 'bg-gradient-to-b from-amber-500 to-red-700 border-yellow-200 scale-110'
                            : 'bg-red-600/95 border-amber-200',
                      ].join(' ')}
                    >
                      {activeEvent.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Center Strip: Slot Modifiers with Active Colored Luminous Glow + Action Bar */}
          <div className="my-0.5 flex flex-col items-center gap-1.5">
            {/* Slot Modifier Badges with Colored Luminous Shadow when Active / Triggering */}
            <div className="w-full grid grid-cols-3 gap-2 text-center">
              {([0, 1, 2] as const).map((slotIdx) => {
                const mod = state.players.player.slotModifiers[slotIdx];
                const allyInSlot = state.players.player.slots[slotIdx];
                const oppInSlot = state.players.enemy.slots[slotIdx];
                const glow = MOD_ACTIVE_GLOW[mod.color];

                // Determine if modifier is actively triggering right now vs continuously active
                const isFiringNow =
                  allyInSlot !== null &&
                  activeEvent !== null &&
                  ((mod.timing === 'on_attack' &&
                    activeEvent.type === 'attack' &&
                    activeEvent.sourceSide === 'player' &&
                    activeEvent.sourceSlot === slotIdx) ||
                    (mod.timing === 'on_defend' &&
                      activeEvent.type === 'attack' &&
                      activeEvent.targetSide === 'player' &&
                      activeEvent.targetSlot === slotIdx) ||
                    (mod.timing === 'continuous' &&
                      activeEvent.sourceSide === 'player' &&
                      activeEvent.sourceSlot === slotIdx));

                const isContinuouslyActive =
                  allyInSlot !== null &&
                  (mod.timing === 'continuous'
                    ? mod.effect !== 'weaken_opposite' || oppInSlot !== null
                    : false);

                const isHighlighted =
                  isFiringNow ||
                  isContinuouslyActive ||
                  (allyInSlot !== null && selectedAllySlot === slotIdx);

                return (
                  <button
                    key={slotIdx}
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setPopupModifier(mod);
                    }}
                    title={`${mod.name}: ${mod.description}`}
                    className={[
                      'group flex items-center justify-center gap-1.5 rounded-xl bg-slate-950/88 border-2 px-1.5 py-1 transition-all duration-300 cursor-pointer',
                      isFiringNow
                        ? glow.firing
                        : isHighlighted
                          ? glow.idle
                          : allyInSlot !== null
                            ? 'border-slate-600/85 hover:border-amber-400'
                            : 'border-slate-700/70 opacity-55 hover:opacity-90',
                    ].join(' ')}
                  >
                    <AssetImg
                      src={mod.iconUrl}
                      alt={mod.name}
                      className="w-9 h-9 object-contain shrink-0 drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)] group-hover:scale-110 transition"
                      fallback={null}
                    />
                    <div className="flex flex-col items-start min-w-0">
                      <span
                        className={[
                          'font-display text-xs sm:text-sm tracking-wide leading-none text-outline',
                          MOD_TEXT_COLOR[mod.color],
                        ].join(' ')}
                      >
                        {mod.label}
                      </span>
                      <span className="text-[8.5px] font-extrabold text-slate-200 leading-tight mt-0.5 text-outline-sm">
                        {mod.effect === 'damage_reduction'
                          ? `-${mod.value}% Dano`
                          : `+${mod.value}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Contextual Action Menu with New Attack & Effect Icons */}
            {selectedAlly ? (
              <div className="w-full rounded-xl runic-dialog-panel border-2 border-amber-400/90 px-2.5 py-1.5 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-display font-black text-amber-300 truncate text-outline-sm">
                      {selectedAlly.card.name}
                    </div>
                    <div className="text-[9.5px] text-slate-200 truncate">
                      {isChoosingAllyForSkill
                        ? 'Toque em uma carta ALIADA para proteger'
                        : actionMode === 'skill'
                          ? 'Toque no inimigo alvo do EFEITO'
                          : 'Toque no inimigo alvo para ATACAR'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setActionMode('attack');
                      }}
                      className={[
                        'flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1 text-[10px] font-runic font-black transition cursor-pointer shadow',
                        actionMode === 'attack'
                          ? 'bg-gradient-to-b from-red-500 to-red-700 border-amber-200 text-white shadow-[0_0_14px_rgba(239,68,68,0.85)]'
                          : 'hud-stone-bar border-slate-600 text-slate-300 hover:border-slate-400',
                      ].join(' ')}
                    >
                      <AssetImg
                        src={UI_ASSETS.hudActionAttack}
                        alt=""
                        className="w-5 h-5 object-contain drop-shadow"
                        fallback={<Swords className="w-4 h-4" />}
                      />
                      ATACAR
                    </button>

                    {selectedActiveSkill && (
                      <button
                        type="button"
                        disabled={!selectedCanUseSkill}
                        onClick={handleTriggerActiveSkillButton}
                        className={[
                          'flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1 text-[10px] font-runic font-black transition shadow',
                          selectedCanUseSkill
                            ? actionMode === 'skill'
                              ? 'bg-gradient-to-b from-sky-400 to-blue-600 border-white text-white shadow-[0_0_14px_rgba(56,189,248,0.9)] cursor-pointer'
                              : 'bg-gradient-to-b from-amber-500 to-amber-700 border-amber-200 text-slate-950 hover:brightness-110 cursor-pointer'
                            : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed',
                        ].join(' ')}
                      >
                        <AssetImg
                          src={UI_ASSETS.hudActionEffect}
                          alt=""
                          className="w-5 h-5 object-contain drop-shadow"
                          fallback={<Sparkles className="w-4 h-4" />}
                        />
                        {selectedCanUseSkill
                          ? 'EFEITO'
                          : `REC. ${selectedAlly.activeCooldown}`}
                      </button>
                    )}
                  </div>
                </div>

                {selectedAlly.card.skills[0] && (
                  <div className="text-[9.5px] text-amber-200/95 mt-1 border-t border-slate-700/80 pt-1">
                    <strong>{selectedAlly.card.skills[0].name}:</strong>{' '}
                    {selectedAlly.card.skills[0].description}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full flex items-center justify-center">
                {selectedHandIndex !== null ||
                (isPlayerTurn && allyRem.onBoard === 0 && canReinforce) ? (
                  <div className="rounded-full runic-dialog-panel border border-amber-500/60 px-3 py-0.5 text-[10px] font-runic font-extrabold text-amber-100 text-outline-sm">
                    {selectedHandIndex !== null
                      ? 'Toque em um espaço VAZIO para posicionar o reforço'
                      : 'Campo vazio! Toque no reforço abaixo para posicionar!'}
                  </div>
                ) : (
                  /* Card Heroes + Velocity Turn Order Strip */
                  <div className="flex items-center gap-1 overflow-x-auto max-w-full px-2 py-0.5 rounded-full bg-slate-950/85 border border-amber-500/45 shadow">
                    <span className="text-[8.5px] font-runic text-amber-300 shrink-0 mr-0.5">
                      ORDEM:
                    </span>
                    {turnTimeline.slice(0, 4).map((item, i) => (
                      <span
                        key={`${item.side}-${item.slotIndex}-${i}`}
                        className={[
                          'px-1.5 py-0.2 rounded-full text-[8px] font-runic shrink-0 border',
                          item.side === 'player'
                            ? i === 0
                              ? 'bg-emerald-500/35 border-emerald-300 text-emerald-100'
                              : 'bg-emerald-950/80 border-emerald-700/70 text-emerald-300'
                            : i === 0
                              ? 'bg-red-500/35 border-red-300 text-red-100'
                              : 'bg-red-950/80 border-red-700/70 text-red-300',
                        ].join(' ')}
                      >
                        {i + 1}º {item.cardName.split(' ')[0]} ({item.vel})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ally Row (Bottom 3 Slots) */}
          <div className="grid grid-cols-3 gap-2">
            {([0, 1, 2] as const).map((slotIdx) => {
              const mon = state.players.player.slots[slotIdx];
              const stats = getEffectiveStats(state, 'player', slotIdx);
              const isSelectable =
                isPlayerTurn &&
                !isAuto &&
                mon !== null &&
                mon.status === 'ready';
              const isDeployTarget =
                !mon && selectedHandIndex !== null && canReinforce;
              // Effects & attacks ONLY apply to cards currently on the field (never empty slots!)
              const showEvent =
                mon !== null &&
                activeEvent?.targetSide === 'player' &&
                (activeEvent?.targetSlot === slotIdx ||
                  activeEvent?.targetSlot === 'all');
              const isLastSource =
                mon !== null &&
                activeEvent?.sourceSide === 'player' &&
                activeEvent?.sourceSlot === slotIdx;
              const isLastTarget = showEvent;
              const motion =
                mon === null
                  ? null
                  : initialEnterAnim
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
                      isAllyTargetable={isChoosingAllyForSkill}
                      isNextInQueue={
                        isPlayerTurn &&
                        nextTurnItem?.side === 'player' &&
                        nextTurnItem?.slotIndex === slotIdx
                      }
                      isLastSource={isLastSource}
                      isLastTarget={isLastTarget}
                      motionEffect={motion}
                      onClick={() => handleSelectAlly(slotIdx)}
                      onInspect={() =>
                        setInspectModalCard({
                          card: mon.card,
                          effectiveStats: {
                            atk: stats.atk,
                            hp: mon.currentHp,
                            vel: stats.vel,
                            shield: mon.shield,
                          },
                        })
                      }
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectAlly(slotIdx)}
                      disabled={!isDeployTarget}
                      className={[
                        'relative w-full aspect-[3/4.15] rounded-xl overflow-hidden flex flex-col items-center justify-center gap-1 text-[10px] font-runic font-extrabold transition',
                        isDeployTarget
                          ? 'ring-2 ring-amber-400 bg-amber-500/20 text-amber-200 animate-pulse cursor-pointer'
                          : 'text-slate-300/85 cursor-default',
                      ].join(' ')}
                    >
                      <AssetImg
                        src={UI_ASSETS.slotEmpty}
                        alt="Espaço vazio"
                        className="absolute inset-0 w-full h-full object-fill scale-[1.03] opacity-85 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
                        fallback={
                          <div className="absolute inset-0 rounded-xl border-2 border-slate-500/50 bg-slate-950/45" />
                        }
                      />
                      {isDeployTarget ? (
                        <div className="relative z-10 flex flex-col items-center gap-1 text-outline-sm">
                          <PlusCircle className="w-6 h-6" />
                          <span>REFORÇAR</span>
                        </div>
                      ) : (
                        <span className="relative z-10 text-outline-sm">
                          VAZIO
                        </span>
                      )}
                    </button>
                  )}

                  {showEvent && activeEvent?.label && (
                    <div
                      key={activeEvent.id}
                      className={[
                        'pointer-events-none absolute top-1/3 left-1/2 z-40 px-2.5 py-1 rounded-lg border-2 text-white text-xs font-display font-black whitespace-nowrap shadow-[0_6px_18px_rgba(0,0,0,0.95)] animate-damage-pop text-outline',
                        activeEvent.type === 'heal'
                          ? 'bg-emerald-600/95 border-emerald-200'
                          : activeEvent.type === 'reinforce'
                            ? 'bg-amber-500/95 border-amber-100 text-slate-950'
                            : 'bg-red-600/95 border-amber-200',
                      ].join(' ')}
                    >
                      {activeEvent.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Bottom HUD */}
      <BottomHud
        heroName={state.players.player.heroName}
        heroBuild={state.players.player.heroBuild}
        allyRemaining={allyRem.total}
        allyMaxTotal={allyRem.maxTotal}
        hand={state.players.player.hand}
        extrasPlayed={state.players.player.extrasPlayed}
        extrasDrawn={state.players.player.extrasDrawn}
        maxExtras={state.players.player.maxExtras}
        selectedHandIndex={selectedHandIndex}
        newlyDrawnCardId={newlyDrawnCardId}
        isPlayerTurn={isPlayerTurn}
        canReinforce={canReinforce}
        canPass={isPlayerTurn && !isAuto}
        onSelectHandCard={(idx) => {
          sfx.click();
          setSelectedAllySlot(null);
          setSelectedHandIndex((curr) => (curr === idx ? null : idx));
        }}
        onPassTurn={() => {
          sfx.click();
          onUpdateState(passTurn(state, 'player'));
        }}
        onInspectHero={() => {
          sfx.click();
          setInspectHeroSide('player');
        }}
      />

      {/* POPUP: Modifier Details inside Arena (dialog_frame_popup.png) */}
      {popupModifier && (
        <RunicDialog
          title={popupModifier.name}
          variant="popup"
          onClose={() => setPopupModifier(null)}
        >
          <div className="flex flex-col items-center text-center gap-2.5">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-400/25 blur-xl" />
              <AssetImg
                src={popupModifier.iconUrl}
                alt={popupModifier.name}
                className="relative w-20 h-20 object-contain drop-shadow"
                fallback={null}
              />
            </div>
            <div>
              <div className="font-display font-black text-base text-amber-200 text-outline">
                {popupModifier.label}
              </div>
              <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-black/60 border border-amber-500/60 text-[9px] font-runic font-bold text-amber-300">
                {TIMING_LABELS[popupModifier.timing]}
              </span>
            </div>
            <p className="text-xs text-slate-200 bg-black/50 border border-slate-700/80 rounded-xl p-2.5 w-full">
              {popupModifier.description}
            </p>
          </div>
        </RunicDialog>
      )}

      {/* MODAL: Combat Log & Rules (dialog_frame_main.png) */}
      {showLog && (
        <RunicDialog
          title="Registro & Regras"
          variant="main"
          onClose={() => setShowLog(false)}
        >
          <div className="flex-1 flex flex-col overflow-hidden gap-2">
            <div className="text-[10px] text-slate-200 bg-black/55 rounded-xl p-2 border border-slate-700/80 space-y-1 text-center">
              <div>
                <strong className="text-red-400">Fúria</strong> &gt;{' '}
                <strong className="text-emerald-400">Astúcia</strong> &gt;{' '}
                <strong className="text-sky-400">Arcano</strong> &gt;{' '}
                <strong className="text-red-400">Fúria</strong>
              </div>
              <div className="text-amber-200/90">
                Limite de Reforços: máx. +2 monstros recebidos por partida.
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 text-[11px] max-h-[250px] pr-0.5">
              {state.log.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg bg-black/45 border border-slate-800 px-2.5 py-1.5 text-slate-200"
                >
                  <span className="text-[9.5px] font-runic font-bold text-amber-400 mr-1.5">
                    [R{entry.round}]
                  </span>
                  {entry.text}
                </div>
              ))}
            </div>

            <div className="space-y-1.5 pt-1">
              <RunicButton size="sm" onClick={() => setShowLog(false)}>
                VOLTAR À BATALHA
              </RunicButton>
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  setShowLog(false);
                  onBackToTitle();
                }}
                className="w-full py-2 rounded-xl hud-stone-bar border border-slate-600 text-slate-300 font-runic font-bold text-[10.5px] cursor-pointer hover:border-amber-400/60"
              >
                Sair para o Menu Principal
              </button>
            </div>
          </div>
        </RunicDialog>
      )}

      {/* MODAL: Game Over Overlay (Vitória / Derrota / Empate com Cálices Oficiais) */}
      {state.phase === 'game_over' && (
        <RunicDialog variant="main" hideHeaderPlate>
          <div className="flex-1 flex flex-col items-center justify-between text-center gap-2 py-1">
            <div className="relative flex-1 flex flex-col items-center justify-center w-full">
              <div
                className={[
                  'absolute w-40 h-40 rounded-full blur-2xl pointer-events-none',
                  state.winner === 'player'
                    ? 'bg-amber-400/35'
                    : state.winner === 'draw'
                      ? 'bg-sky-400/35'
                      : 'bg-red-500/30',
                ].join(' ')}
              />
              <AssetImg
                src={
                  state.winner === 'player'
                    ? UI_ASSETS.uiCaliceVenceu
                    : state.winner === 'draw'
                      ? UI_ASSETS.uiCaliceEmpate
                      : UI_ASSETS.uiCalicePerdeu
                }
                alt={
                  state.winner === 'player'
                    ? 'Vitória'
                    : state.winner === 'draw'
                      ? 'Empate'
                      : 'Derrota'
                }
                className="relative z-10 w-36 h-36 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)] animate-emblem-float"
                fallback={null}
              />

              <h2
                className={[
                  'relative z-20 -mt-2 font-display text-3xl sm:text-4xl tracking-[0.14em] text-outline uppercase drop-shadow-[0_6px_14px_rgba(0,0,0,0.95)]',
                  state.winner === 'player'
                    ? 'text-amber-300'
                    : state.winner === 'draw'
                      ? 'text-sky-300'
                      : 'text-red-400',
                ].join(' ')}
              >
                {state.winner === 'player'
                  ? 'VITÓRIA!'
                  : state.winner === 'draw'
                    ? 'EMPATE!'
                    : 'DERROTA'}
              </h2>
            </div>

            <div className="w-full space-y-2">
              <RunicButton size="md" onClick={onRestart}>
                <Swords className="w-4 h-4 text-amber-300" />
                JOGAR NOVAMENTE
              </RunicButton>
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  onBackToTitle();
                }}
                className="w-full py-2.5 rounded-xl hud-stone-bar border border-slate-600 text-slate-200 font-runic font-bold text-xs cursor-pointer hover:border-amber-400/60"
              >
                Voltar ao Menu Principal
              </button>
            </div>
          </div>
        </RunicDialog>
      )}
      {/* MODAL: Full 3D Holographic Card Inspector */}
      {inspectModalCard && (
        <CardInspectModal
          card={inspectModalCard.card}
          effectiveStats={inspectModalCard.effectiveStats}
          onClose={() => setInspectModalCard(null)}
        />
      )}

      {/* MODAL: Hero Effects & Equipment Inspector */}
      {inspectHeroSide && (
        <HeroEffectsModal
          heroName={state.players[inspectHeroSide].heroName}
          heroBuild={state.players[inspectHeroSide].heroBuild}
          fallbackPortraitUrl={
            inspectHeroSide === 'player'
              ? UI_ASSETS.heroAlly
              : UI_ASSETS.heroEnemy
          }
          fallbackFrameUrl={
            inspectHeroSide === 'player'
              ? UI_ASSETS.hudPortraitFrameAlly
              : UI_ASSETS.hudPortraitFrameEnemy
          }
          isEnemy={inspectHeroSide === 'enemy'}
          onClose={() => setInspectHeroSide(null)}
        />
      )}
    </div>
  );
}
