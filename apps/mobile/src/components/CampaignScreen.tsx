import {
  DEFAULT_CAMPAIGNS,
  DEFAULT_CARDS,
  DEFAULT_SLOT_MODIFIERS,
  DEFAULT_TERRAINS,
  type CampaignDefinition,
  type CampaignStageDefinition,
  type CardDefinition,
} from '@super-monster/game-engine';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Lock,
  Skull,
  Swords,
} from 'lucide-react';
import { useState } from 'react';
import { UI_ASSETS } from '../assets/assetPaths';
import { sfx } from '../utils/sfx';
import { AssetImg } from './AssetImg';
import { CardInspectModal } from './CardInspectModal';
import { RunicButton } from './RunicButton';

interface CampaignScreenProps {
  completedStageIds: string[];
  onStartStage: (
    campaign: CampaignDefinition,
    stage: CampaignStageDefinition
  ) => void;
  onBack: () => void;
}

export function CampaignScreen({
  completedStageIds,
  onStartStage,
  onBack,
}: CampaignScreenProps) {
  const [campaignIdx, setCampaignIdx] = useState(0);
  const campaign = DEFAULT_CAMPAIGNS[campaignIdx];

  // Determine which stages are unlocked within this campaign
  // Campaign 1 Stage 1 is always unlocked; subsequent stages unlock when previous stage is completed;
  // Campaign N Stage 1 unlocks when Campaign N-1 Stage 5 is completed (or let's keep Stage 1 of every campaign previewable, and unlock sequentially).
  const isCampaignUnlocked = (cIdx: number): boolean => {
    if (cIdx === 0) return true;
    const prevCamp = DEFAULT_CAMPAIGNS[cIdx - 1];
    return completedStageIds.includes(prevCamp.stages[4].id);
  };

  const isStageUnlocked = (
    cIdx: number,
    stageIdx: number
  ): boolean => {
    if (!isCampaignUnlocked(cIdx)) return false;
    if (stageIdx === 0) return true;
    const prevStage = DEFAULT_CAMPAIGNS[cIdx].stages[stageIdx - 1];
    return completedStageIds.includes(prevStage.id);
  };

  // Pick the highest unlocked stage in the current campaign by default
  const getDefaultStageIdx = (cIdx: number): number => {
    const camp = DEFAULT_CAMPAIGNS[cIdx];
    for (let i = camp.stages.length - 1; i >= 0; i -= 1) {
      if (isStageUnlocked(cIdx, i)) return i;
    }
    return 0;
  };

  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(() =>
    getDefaultStageIdx(0)
  );
  const [inspectCard, setInspectCard] = useState<CardDefinition | null>(null);

  const selectedStage = campaign.stages[selectedStageIdx] ?? campaign.stages[0];
  const selectedUnlocked = isStageUnlocked(campaignIdx, selectedStageIdx);
  const selectedCompleted = completedStageIds.includes(selectedStage.id);

  const fallbackTerrain =
    DEFAULT_TERRAINS.find((t) => t.id === campaign.terrainId) ??
    DEFAULT_TERRAINS[0];

  const handleChangeCampaign = (nextIdx: number) => {
    sfx.swipe();
    const wrapped =
      (nextIdx + DEFAULT_CAMPAIGNS.length) % DEFAULT_CAMPAIGNS.length;
    setCampaignIdx(wrapped);
    setSelectedStageIdx(getDefaultStageIdx(wrapped));
  };

  const stageEnemyCards = selectedStage.enemyCardIds
    .map((id) => DEFAULT_CARDS.find((c) => c.id === id))
    .filter((c): c is CardDefinition => Boolean(c));

  const stageMods = selectedStage.slotModifierIds
    .map((id) => DEFAULT_SLOT_MODIFIERS.find((m) => m.id === id))
    .filter(Boolean);

  const completedInCampaign = campaign.stages.filter((s) =>
    completedStageIds.includes(s.id)
  ).length;

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950 select-none">
      {/* Dynamic Campaign Background with automatic fallback to official Terrain */}
      <AssetImg
        src={campaign.backgroundUrl}
        alt={campaign.name}
        className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
        fallback={
          <img
            src={fallbackTerrain.imageUrl}
            alt={campaign.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        }
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/88 via-slate-950/35 to-slate-950/96" />

      {/* TOP BAR: Back + Campaign Switcher with sculpted icon_seta.png */}
      <header className="relative z-20 px-3 pt-2.5 pb-1 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              sfx.click();
              onBack();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full hud-stone-bar border border-amber-500/60 text-[10px] font-runic text-amber-200 hover:border-amber-300 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            MENU
          </button>

          <span className="px-2.5 py-0.5 rounded-full hud-stone-bar border border-slate-500/70 text-[9.5px] font-runic text-amber-200">
            CAMPANHA {campaign.number}/5 • {completedInCampaign}/5 FASES
          </span>
        </div>

        {/* Left/Right Campaign Selector */}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <button
            type="button"
            onClick={() => handleChangeCampaign(campaignIdx - 1)}
            aria-label="Campanha anterior"
            className="w-10 h-10 shrink-0 flex items-center justify-center hover:scale-110 active:scale-90 transition cursor-pointer"
          >
            <AssetImg
              src={UI_ASSETS.iconSeta}
              alt="Anterior"
              className="w-full h-full object-contain -scale-x-100 drop-shadow"
              fallback={<ChevronLeft className="w-6 h-6 text-amber-300" />}
            />
          </button>

          <div className="flex-1 min-w-0 text-center">
            <div className="text-[9.5px] font-runic uppercase tracking-[0.18em] text-amber-300 text-outline-sm">
              {campaign.subtitle}
            </div>
            <h2 className="font-display text-lg sm:text-xl text-white text-outline leading-tight truncate">
              {campaign.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => handleChangeCampaign(campaignIdx + 1)}
            aria-label="Próxima campanha"
            className="w-10 h-10 shrink-0 flex items-center justify-center hover:scale-110 active:scale-90 transition cursor-pointer"
          >
            <AssetImg
              src={UI_ASSETS.iconSeta}
              alt="Próxima"
              className="w-full h-full object-contain drop-shadow"
              fallback={<ChevronRight className="w-6 h-6 text-amber-300" />}
            />
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-200 leading-snug px-2 text-outline-sm">
          {campaign.story}
        </p>
      </header>

      {/* CENTER: Interactive War Map with 5 Stages connected by a tactical war trail */}
      <main className="relative z-20 flex-1 w-full my-1">
        {/* War Trail connecting Stage 1 -> 2 -> 3 -> 4 -> 5 */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 w-full h-full"
        >
          {campaign.stages.slice(0, 4).map((st, idx) => {
            const next = campaign.stages[idx + 1];
            const unlocked = isStageUnlocked(campaignIdx, idx + 1);
            return (
              <line
                key={st.id}
                x1={st.mapX}
                y1={st.mapY}
                x2={next.mapX}
                y2={next.mapY}
                stroke={unlocked ? campaign.accentColor : 'rgba(148,163,184,0.35)'}
                strokeWidth={unlocked ? '1.3' : '0.8'}
                strokeDasharray={unlocked ? undefined : '2 2'}
              />
            );
          })}
        </svg>

        {/* 5 Map Nodes */}
        {campaign.stages.map((stage, idx) => {
          const unlocked = isStageUnlocked(campaignIdx, idx);
          const completed = completedStageIds.includes(stage.id);
          const isSelected = selectedStageIdx === idx;
          const nodeImg = !unlocked
            ? UI_ASSETS.campaignNodeLocked
            : completed
              ? UI_ASSETS.campaignNodeCompleted
              : stage.isBoss
                ? UI_ASSETS.campaignNodeBoss
                : UI_ASSETS.campaignNodeUnlocked;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => {
                sfx.click();
                setSelectedStageIdx(idx);
              }}
              style={{ left: `${stage.mapX}%`, top: `${stage.mapY}%` }}
              className={[
                'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 transition-transform cursor-pointer group',
                isSelected ? 'scale-115 z-30' : 'z-20 hover:scale-108',
              ].join(' ')}
            >
              <div
                className={[
                  'relative flex items-center justify-center rounded-full transition',
                  stage.isBoss ? 'w-14 h-14' : 'w-11 h-11',
                  isSelected
                    ? 'ring-2 ring-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.9)]'
                    : unlocked && !completed
                      ? 'animate-pulse shadow-[0_0_16px_rgba(56,189,248,0.8)]'
                      : '',
                ].join(' ')}
              >
                <AssetImg
                  src={nodeImg}
                  alt={stage.name}
                  className="w-full h-full object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.95)]"
                  fallback={
                    <div
                      className={[
                        'w-full h-full rounded-full border-2 flex items-center justify-center shadow-xl',
                        !unlocked
                          ? 'bg-slate-900/95 border-slate-600 text-slate-400'
                          : completed
                            ? 'bg-gradient-to-b from-amber-400 to-amber-700 border-amber-100 text-slate-950'
                            : stage.isBoss
                              ? 'bg-gradient-to-b from-red-600 to-red-900 border-amber-300 text-amber-200'
                              : 'bg-gradient-to-b from-sky-500 to-blue-800 border-sky-200 text-white',
                      ].join(' ')}
                    >
                      {!unlocked ? (
                        <Lock className="w-4 h-4" />
                      ) : completed ? (
                        <Check className="w-5 h-5 stroke-[3]" />
                      ) : stage.isBoss ? (
                        <Crown className="w-6 h-6" />
                      ) : (
                        <Swords className="w-4 h-4" />
                      )}
                    </div>
                  }
                />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-950 border border-amber-400 text-[8.5px] font-runic text-amber-200 flex items-center justify-center">
                  {stage.stageNumber}
                </span>
              </div>

              <span
                className={[
                  'px-1.5 py-0.2 rounded bg-slate-950/90 border text-[8px] font-runic whitespace-nowrap text-outline-sm',
                  isSelected
                    ? 'border-amber-400 text-amber-200'
                    : unlocked
                      ? 'border-slate-600 text-slate-100'
                      : 'border-slate-800 text-slate-400',
                ].join(' ')}
              >
                {stage.name}
              </span>
            </button>
          );
        })}
      </main>

      {/* BOTTOM STAGE BRIEFING & LAUNCH PANEL */}
      <footer className="relative z-20 px-3 pb-2.5 pt-1">
        <div className="runic-dialog-panel rounded-2xl p-2.5 space-y-2 border-2 border-amber-500/60">
          {/* Stage Title & Difficulty Skulls */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-400/70 font-runic text-[8.5px] text-amber-300">
                  FASE {selectedStage.stageNumber}
                  {selectedStage.isBoss ? ' • CHEFE' : ''}
                </span>
                {selectedCompleted && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/25 border border-emerald-400 text-[8px] font-runic text-emerald-200">
                    ✓ VENCIDA
                  </span>
                )}
              </div>
              <h3 className="font-display text-sm text-white truncate mt-0.5 text-outline-sm">
                {selectedStage.name} — {selectedStage.enemyName}
              </h3>
            </div>

            <div
              className="flex items-center gap-0.5 shrink-0 pt-0.5"
              title={`Dificuldade: Fase ${selectedStage.stageNumber}/5`}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Skull
                  key={i}
                  className={[
                    'w-3 h-3',
                    i < selectedStage.stageNumber
                      ? 'text-red-400'
                      : 'text-slate-700',
                  ].join(' ')}
                />
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-200 leading-snug">
            {selectedStage.story}
          </p>

          {/* Enemy 5 Pre-defined Cards + Stage Modifiers Preview */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {stageEnemyCards.map((card, i) => (
                <button
                  key={`${card.id}-${i}`}
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setInspectCard(card);
                  }}
                  title={`Inimigo: ${card.name} (toque para inspecionar)`}
                  className="relative w-9 h-11 rounded border border-red-500/75 overflow-hidden bg-slate-900 hover:scale-110 transition cursor-pointer"
                >
                  <AssetImg
                    src={card.artUrl}
                    alt={card.name}
                    className="w-full h-full object-cover"
                    fallback={
                      <span className="text-sm">{card.emojiFallback}</span>
                    }
                  />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {stageMods.map((mod) =>
                mod ? (
                  <AssetImg
                    key={mod.id}
                    src={mod.iconUrl}
                    alt={mod.name}
                    className="w-7 h-7 object-contain drop-shadow"
                    fallback={null}
                  />
                ) : null
              )}
            </div>
          </div>

          {/* Launch Button */}
          <div className="pt-0.5">
            <RunicButton
              size="sm"
              disabled={!selectedUnlocked}
              onClick={() => onStartStage(campaign, selectedStage)}
            >
              {selectedUnlocked ? (
                <>
                  <Swords className="w-4 h-4 text-amber-300" />
                  <span>
                    {selectedCompleted
                      ? `REJOGAR FASE ${selectedStage.stageNumber}`
                      : `BATALHAR • FASE ${selectedStage.stageNumber}`}
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-300" />
                  <span>VENÇA A FASE ANTERIOR</span>
                </>
              )}
            </RunicButton>
          </div>
        </div>
      </footer>

      {/* 3D Holographic Inspector for Enemy Stage Cards */}
      {inspectCard && (
        <CardInspectModal
          card={inspectCard}
          onClose={() => setInspectCard(null)}
        />
      )}
    </div>
  );
}
