import {
  PRECEDENCE_META,
  getDraftPreviewStats,
  type CardDefinition,
  type MatchState,
  type SlotModifierDefinition,
} from '@super-monster/game-engine';
import { Check, Info, Shield, Sparkles, Swords } from 'lucide-react';
import { useState } from 'react';
import { CRYSTAL_ASSETS, UI_ASSETS } from '../assets/assetPaths';
import { sfx } from '../utils/sfx';
import { AssetImg } from './AssetImg';
import { CardInspectModal } from './CardInspectModal';
import { RunicButton } from './RunicButton';
import { RunicDialog } from './RunicDialog';

interface DraftScreenProps {
  state: MatchState;
  onConfirmDraft: (slotCardIds: [string, string, string]) => void;
}

const MOD_TEXT_COLOR: Record<SlotModifierDefinition['color'], string> = {
  red: 'text-red-300',
  blue: 'text-sky-300',
  green: 'text-emerald-300',
  cyan: 'text-cyan-300',
  orange: 'text-orange-300',
  lime: 'text-lime-300',
  rose: 'text-rose-300',
  purple: 'text-purple-300',
  amber: 'text-amber-300',
  indigo: 'text-indigo-300',
};

/**
 * Per-modifier soft ambient visual aura (background radial glow + border glow)
 */
const MOD_SLOT_VFX: Record<
  SlotModifierDefinition['color'],
  { aura: string; border: string; burst: string }
> = {
  red: {
    aura: 'radial-gradient(circle, rgba(239,68,68,0.48) 0%, rgba(185,28,28,0.14) 55%, transparent 78%)',
    border: 'border-red-400/80 shadow-[0_0_16px_rgba(239,68,68,0.45)]',
    burst: 'radial-gradient(circle, rgba(254,202,202,0.95) 0%, rgba(239,68,68,0.7) 45%, transparent 75%)',
  },
  blue: {
    aura: 'radial-gradient(circle, rgba(56,189,248,0.48) 0%, rgba(2,132,199,0.14) 55%, transparent 78%)',
    border: 'border-sky-400/80 shadow-[0_0_16px_rgba(56,189,248,0.45)]',
    burst: 'radial-gradient(circle, rgba(224,242,254,0.95) 0%, rgba(56,189,248,0.7) 45%, transparent 75%)',
  },
  green: {
    aura: 'radial-gradient(circle, rgba(34,197,94,0.48) 0%, rgba(21,128,61,0.14) 55%, transparent 78%)',
    border: 'border-emerald-400/80 shadow-[0_0_16px_rgba(34,197,94,0.45)]',
    burst: 'radial-gradient(circle, rgba(209,250,229,0.95) 0%, rgba(16,185,129,0.7) 45%, transparent 75%)',
  },
  cyan: {
    aura: 'radial-gradient(circle, rgba(34,211,238,0.48) 0%, rgba(8,145,178,0.14) 55%, transparent 78%)',
    border: 'border-cyan-400/80 shadow-[0_0_16px_rgba(34,211,238,0.45)]',
    burst: 'radial-gradient(circle, rgba(207,250,254,0.95) 0%, rgba(6,182,212,0.7) 45%, transparent 75%)',
  },
  orange: {
    aura: 'radial-gradient(circle, rgba(249,115,22,0.5) 0%, rgba(194,65,12,0.15) 55%, transparent 78%)',
    border: 'border-orange-400/80 shadow-[0_0_16px_rgba(249,115,22,0.48)]',
    burst: 'radial-gradient(circle, rgba(254,215,170,0.95) 0%, rgba(249,115,22,0.72) 45%, transparent 75%)',
  },
  lime: {
    aura: 'radial-gradient(circle, rgba(132,204,22,0.46) 0%, rgba(77,124,15,0.14) 55%, transparent 78%)',
    border: 'border-lime-400/80 shadow-[0_0_16px_rgba(132,204,22,0.45)]',
    burst: 'radial-gradient(circle, rgba(236,252,203,0.95) 0%, rgba(132,204,22,0.7) 45%, transparent 75%)',
  },
  rose: {
    aura: 'radial-gradient(circle, rgba(244,63,94,0.48) 0%, rgba(190,18,60,0.14) 55%, transparent 78%)',
    border: 'border-rose-400/80 shadow-[0_0_16px_rgba(244,63,94,0.45)]',
    burst: 'radial-gradient(circle, rgba(255,228,230,0.95) 0%, rgba(244,63,94,0.7) 45%, transparent 75%)',
  },
  purple: {
    aura: 'radial-gradient(circle, rgba(168,85,247,0.48) 0%, rgba(126,34,206,0.14) 55%, transparent 78%)',
    border: 'border-purple-400/80 shadow-[0_0_16px_rgba(168,85,247,0.45)]',
    burst: 'radial-gradient(circle, rgba(243,232,255,0.95) 0%, rgba(168,85,247,0.72) 45%, transparent 75%)',
  },
  amber: {
    aura: 'radial-gradient(circle, rgba(245,158,11,0.5) 0%, rgba(180,83,9,0.15) 55%, transparent 78%)',
    border: 'border-amber-400/85 shadow-[0_0_16px_rgba(245,158,11,0.5)]',
    burst: 'radial-gradient(circle, rgba(254,243,199,0.95) 0%, rgba(245,158,11,0.75) 45%, transparent 75%)',
  },
  indigo: {
    aura: 'radial-gradient(circle, rgba(99,102,241,0.48) 0%, rgba(67,56,202,0.15) 55%, transparent 78%)',
    border: 'border-indigo-400/80 shadow-[0_0_16px_rgba(99,102,241,0.45)]',
    burst: 'radial-gradient(circle, rgba(224,231,255,0.95) 0%, rgba(99,102,241,0.72) 45%, transparent 75%)',
  },
};

const TIMING_LABELS: Record<SlotModifierDefinition['timing'], string> = {
  continuous: 'Efeito Contínuo',
  end_of_round: 'Fim de Cada Rodada',
  on_attack: 'Ao Atacar',
  on_defend: 'Ao Receber Ataque',
};

export function DraftScreen({ state, onConfirmDraft }: DraftScreenProps) {
  const [slots, setSlots] = useState<
    [CardDefinition | null, CardDefinition | null, CardDefinition | null]
  >([null, null, null]);
  // Starts null: card info only appears in the center when the player clicks a card
  const [inspectedCard, setInspectedCard] = useState<CardDefinition | null>(
    null
  );
  const [popupModifier, setPopupModifier] =
    useState<SlotModifierDefinition | null>(null);
  const [fullInspectCard, setFullInspectCard] = useState<CardDefinition | null>(
    null
  );
  const [placedBurst, setPlacedBurst] = useState<{
    slot: 0 | 1 | 2;
    key: number;
  } | null>(null);

  const options = state.players.player.draftOptions;
  const modifiers = state.players.player.slotModifiers;

  const preview = getDraftPreviewStats(slots, modifiers);

  const handleToggleOption = (card: CardDefinition) => {
    setInspectedCard(card);
    const existingIdx = slots.findIndex((s) => s?.id === card.id);
    if (existingIdx >= 0) {
      sfx.cardRemove();
      const next: [
        CardDefinition | null,
        CardDefinition | null,
        CardDefinition | null,
      ] = [...slots];
      next[existingIdx] = null;
      setSlots(next);
      return;
    }
    const emptyIdx = slots.findIndex((s) => s === null);
    if (emptyIdx === -1) {
      sfx.click();
      return;
    }
    sfx.cardPlace();
    const next: [
      CardDefinition | null,
      CardDefinition | null,
      CardDefinition | null,
    ] = [...slots];
    next[emptyIdx] = card;
    setSlots(next);
    setPlacedBurst({ slot: emptyIdx as 0 | 1 | 2, key: Date.now() });
  };

  const handleClearSlot = (idx: 0 | 1 | 2) => {
    const card = slots[idx];
    if (!card) return;
    sfx.cardRemove();
    setInspectedCard(card);
    const next: [
      CardDefinition | null,
      CardDefinition | null,
      CardDefinition | null,
    ] = [...slots];
    next[idx] = null;
    setSlots(next);
  };

  const missingCount = slots.filter((s) => s === null).length;
  const allFilled = missingCount === 0;

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950">
      {/* Terrain Background */}
      <img
        src={state.terrain.imageUrl}
        alt={state.terrain.name}
        className="absolute inset-0 w-full h-full object-cover opacity-65"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-slate-950/95" />

      {/* TOP HEADER: Larger Proportional Title Plate (dialog_header_plate.png) + Clean Attribute Icons Only */}
      <header className="relative z-20 px-4 pt-2 flex flex-col items-center gap-1">
        {/* Full-Width Proportional Header Plate */}
        <div className="relative w-full max-w-[385px] h-[66px] flex items-center justify-center">
          <AssetImg
            src={UI_ASSETS.dialogHeaderPlate}
            alt=""
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-auto drop-shadow-[0_6px_14px_rgba(0,0,0,0.95)]"
            fallback={null}
          />
          <h2 className="relative z-10 px-14 font-display text-sm sm:text-base tracking-[0.08em] text-amber-100 text-outline whitespace-nowrap">
            ESCOLHA 3 CARTAS
          </h2>
        </div>

        {/* Clean Attribute Icons + Values ONLY (hud_top_header.png removed) */}
        <div className="flex items-center justify-center gap-5 py-0.5">
          {/* ATK (Red) */}
          <div className="flex items-center gap-1.5" title="Ataque Total">
            <AssetImg
              src={UI_ASSETS.sealAtk}
              alt="ATK"
              className="w-6 h-6 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
              fallback={null}
            />
            <span className="font-display text-base text-red-400 text-outline">
              {preview.totalAtk}
            </span>
          </div>

          {/* VEL Highlighted Center (Glowing Cyan) */}
          <div
            className="relative flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/75 border border-sky-400/80 shadow-[0_0_16px_rgba(56,189,248,0.65)]"
            title="Velocidade Total (Iniciativa)"
          >
            <AssetImg
              src={UI_ASSETS.sealVel}
              alt="VEL"
              className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(56,189,248,0.95)]"
              fallback={null}
            />
            <span className="font-display text-xl text-sky-300 text-outline leading-none">
              {preview.totalVel}
            </span>
          </div>

          {/* HP (Green) */}
          <div className="flex items-center gap-1.5" title="Vida Total">
            <AssetImg
              src={UI_ASSETS.sealHp}
              alt="HP"
              className="w-6 h-6 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
              fallback={null}
            />
            <span className="font-display text-base text-emerald-400 text-outline">
              {preview.totalHp}
            </span>
          </div>
        </div>
      </header>

      {/* 3 BOARD SLOTS: Modifier Icon + Name directly above each slot */}
      <div className="relative z-20 px-4 pt-1">
        <div className="grid grid-cols-3 gap-2.5">
          {([0, 1, 2] as const).map((idx) => {
            const mod = modifiers[idx];
            const card = slots[idx];
            const eff = preview.perSlot[idx];
            const vfx = MOD_SLOT_VFX[mod.color];
            const isBursting = placedBurst?.slot === idx;

            const atkDiff = card && eff ? eff.atk - card.atk : 0;
            const velDiff = card && eff ? eff.vel - card.vel : 0;
            const hpDiff = card && eff ? eff.hp - card.hp : 0;

            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                {/* Modifier Icon + Name right below (No info icon, tap opens popup directly) */}
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setPopupModifier(mod);
                  }}
                  className="group flex flex-col items-center justify-center gap-0.5 py-0.5 hover:scale-108 active:scale-95 transition cursor-pointer"
                >
                  <div className="relative flex items-center justify-center">
                    <div
                      className="pointer-events-none absolute -inset-2 rounded-full blur-md animate-modifier-aura"
                      style={{ background: vfx.aura }}
                    />
                    <AssetImg
                      src={mod.iconUrl}
                      alt={mod.name}
                      className="relative z-10 w-10 h-10 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)]"
                      fallback={null}
                    />
                  </div>
                  <span
                    className={[
                      'font-display font-black text-[10px] tracking-wide leading-none text-outline-sm text-center',
                      MOD_TEXT_COLOR[mod.color],
                    ].join(' ')}
                  >
                    {mod.name}
                  </span>
                </button>

                {/* Slot Container with Per-Modifier Soft Aura + Radiant Light Burst when Card Placed */}
                <div className="relative w-full">
                  {/* Soft continuous elemental aura behind slot */}
                  <div
                    className="pointer-events-none absolute -inset-2 rounded-2xl blur-lg animate-modifier-aura"
                    style={{ background: vfx.aura }}
                  />

                  {/* Bright light burst when a card is placed in this slot */}
                  {isBursting && card && (
                    <div
                      key={placedBurst.key}
                      className="pointer-events-none absolute -inset-5 rounded-full blur-xl z-10 animate-slot-light-burst"
                      style={{ background: vfx.burst }}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => handleClearSlot(idx)}
                    className={[
                      'relative z-20 w-full aspect-[3/4.05] rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center transition-all duration-300',
                      card
                        ? `card-frame ${vfx.border} ring-1 ring-amber-300/75 animate-card-enter cursor-pointer`
                        : `${vfx.border} bg-slate-950/65 cursor-default`,
                    ].join(' ')}
                  >
                    {card && eff ? (
                      <>
                        <div className="absolute inset-[9%] rounded-md overflow-hidden">
                          <AssetImg
                            src={card.artUrl}
                            alt={card.name}
                            className="w-full h-full object-cover"
                            fallback={
                              <span className="text-4xl drop-shadow">
                                {card.emojiFallback}
                              </span>
                            }
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/35" />
                        </div>

                        <AssetImg
                          src={UI_ASSETS.cardFrame}
                          alt=""
                          className="pointer-events-none absolute inset-0 w-full h-full object-fill scale-[1.06] z-10"
                          fallback={null}
                        />

                        <AssetImg
                          src={CRYSTAL_ASSETS[card.precedence]}
                          alt={PRECEDENCE_META[card.precedence].label}
                          className="pointer-events-none absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-6 object-contain z-20 drop-shadow"
                          fallback={null}
                        />

                        {eff.shield > 0 && (
                          <div className="absolute top-1 right-1 z-30 flex items-center gap-0.5 rounded-full bg-sky-600 border border-sky-200 px-1.5 py-0.2 text-[8px] font-black text-white shadow">
                            <Shield className="w-2.5 h-2.5" />+{eff.shield}
                          </div>
                        )}

                        <div className="relative z-20 mt-auto w-full px-1.5 pb-1.5 pt-1 text-center">
                          <div className="text-[9px] font-display font-black text-white leading-tight truncate text-outline-sm mb-0.5">
                            {card.name}
                          </div>

                          <div className="grid grid-cols-3 gap-0.5 bg-slate-950/92 border border-amber-500/45 rounded-md px-1 py-0.5 text-[9.5px] font-black">
                            <div className="flex flex-col items-center">
                              <span className="text-[6.5px] font-runic text-red-300 leading-none">
                                ATK
                              </span>
                              <span
                                className={
                                  atkDiff > 0
                                    ? 'text-amber-300 text-outline-sm'
                                    : 'text-white'
                                }
                              >
                                {eff.atk}
                              </span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[6.5px] font-runic text-emerald-300 leading-none">
                                HP
                              </span>
                              <span
                                className={
                                  hpDiff > 0 || eff.shield > 0
                                    ? 'text-emerald-300 text-outline-sm'
                                    : 'text-white'
                                }
                              >
                                {eff.hp}
                              </span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[6.5px] font-runic text-sky-300 leading-none">
                                VEL
                              </span>
                              <span
                                className={
                                  velDiff > 0
                                    ? 'text-sky-300 text-outline-sm'
                                    : 'text-white'
                                }
                              >
                                {eff.vel}
                              </span>
                            </div>
                          </div>

                          {(atkDiff !== 0 || velDiff !== 0 || eff.shield > 0) && (
                            <div className="mt-0.5 text-[7px] font-extrabold text-amber-300 bg-amber-950/90 border border-amber-500/50 rounded px-1 truncate">
                              {atkDiff > 0 && `+${atkDiff} ATK `}
                              {velDiff > 0 && `+${velDiff} VEL `}
                              {eff.shield > 0 && `+${eff.shield} ESC`}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      /* Clean Empty Slot — No "Lugar 1/2/3" text */
                      <AssetImg
                        src={UI_ASSETS.slotEmpty}
                        alt=""
                        className="absolute inset-0 w-full h-full object-fill scale-[1.03] opacity-90"
                        fallback={null}
                      />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER CARD INFO STRIP: Only shown when a card has been clicked, with crisp aligned text */}
      <div className="relative z-20 px-4 min-h-[54px] flex items-center justify-center">
        {inspectedCard && (
          <div className="w-full runic-dialog-panel rounded-xl px-3 py-2 border border-amber-400/70 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <AssetImg
                  src={CRYSTAL_ASSETS[inspectedCard.precedence]}
                  alt=""
                  className="w-4 h-4 object-contain shrink-0"
                  fallback={null}
                />
                <span className="font-display font-black text-xs text-amber-300 truncate text-outline-sm">
                  {inspectedCard.name}
                </span>
              </div>
              <span className="text-[9.5px] font-runic font-bold text-slate-300 shrink-0">
                {PRECEDENCE_META[inspectedCard.precedence].label} •{' '}
                {inspectedCard.monsterType}
              </span>
            </div>
            {inspectedCard.skills[0] && (
              <div className="flex items-start gap-1.5 mt-1 text-[10px] text-slate-200 leading-snug text-left">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  <strong className="text-amber-200">
                    {inspectedCard.skills[0].name}:
                  </strong>{' '}
                  {inspectedCard.skills[0].description}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5 DRAFT CARDS SIDE BY SIDE */}
      <div className="relative z-20 px-4 py-1">
        <div className="grid grid-cols-5 gap-1.5">
          {options.map((card) => {
            const chosenIdx = slots.findIndex((s) => s?.id === card.id);
            const chosen = chosenIdx >= 0;
            const active = inspectedCard?.id === card.id;
            const slotEff =
              chosenIdx >= 0 ? preview.perSlot[chosenIdx as 0 | 1 | 2] : null;

            const displayAtk = slotEff ? slotEff.atk : card.atk;
            const displayHp = slotEff ? slotEff.hp : card.hp;
            const displayVel = slotEff ? slotEff.vel : card.vel;

            return (
              <div key={card.id} className="relative">
                <button
                  type="button"
                  onClick={() => handleToggleOption(card)}
                  className={[
                    'relative w-full aspect-[3/4.5] rounded-lg border-2 overflow-hidden flex flex-col justify-between transition cursor-pointer card-frame',
                    chosen
                      ? 'border-amber-400 -translate-y-1.5 shadow-[0_0_18px_rgba(251,191,36,0.85)]'
                      : active
                        ? 'border-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.65)]'
                        : 'border-slate-600 hover:border-amber-300/80',
                  ].join(' ')}
                >
                  <AssetImg
                    src={card.artUrl}
                    alt={card.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    fallback={
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-2xl">
                        {card.emojiFallback}
                      </div>
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/45" />

                  <AssetImg
                    src={CRYSTAL_ASSETS[card.precedence]}
                    alt={PRECEDENCE_META[card.precedence].label}
                    className="relative z-10 mx-auto mt-0.5 w-4 h-4 object-contain drop-shadow"
                    fallback={null}
                  />

                  {chosen && (
                    <div className="absolute top-1 right-1 z-20 w-4 h-4 rounded-full bg-amber-400 border border-amber-100 text-slate-950 flex items-center justify-center shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <div className="relative z-10 w-full px-0.5 pb-1 text-center">
                    <div className="text-[8px] font-black text-white leading-tight truncate text-outline-sm">
                      {card.name.split(' ')[0]}
                    </div>
                    <div className="flex items-center justify-center gap-0.5 text-[7px] font-black mt-0.5 text-outline-sm">
                      <span
                        className={
                          displayAtk > card.atk
                            ? 'text-amber-300'
                            : 'text-red-400'
                        }
                      >
                        {displayAtk}
                      </span>
                      <span className="text-slate-400">/</span>
                      <span className="text-emerald-400">{displayHp}</span>
                      <span className="text-slate-400">/</span>
                      <span
                        className={
                          displayVel > card.vel
                            ? 'text-amber-300'
                            : 'text-sky-400'
                        }
                      >
                        {displayVel}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Discrete Info Button (i) to view full 3D card */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sfx.click();
                    setFullInspectCard(card);
                  }}
                  title="Ver carta completa"
                  className={[
                    'absolute top-1 left-1 z-30 w-4 h-4 rounded-full bg-slate-950/85 border border-slate-400/75 text-slate-200 flex items-center justify-center opacity-75 hover:opacity-100 hover:border-amber-300 hover:text-amber-200 transition cursor-pointer shadow',
                    chosen ? '-translate-y-1.5' : '',
                  ].join(' ')}
                >
                  <Info className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONFIRM FOOTER: Properly Proportioned RunicButton (dialog_btn_confirm_draft.png) with clean dark backdrop */}
      <footer className="relative z-20 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent px-4 pb-2 pt-1 flex items-center justify-center">
        <RunicButton
          size="md"
          disabled={!allFilled}
          onClick={() => {
            if (allFilled) {
              onConfirmDraft([slots[0]!.id, slots[1]!.id, slots[2]!.id]);
            }
          }}
        >
          <Swords className="w-4 h-4 text-amber-300 shrink-0" />
          <span>
            {allFilled
              ? 'INICIAR BATALHA'
              : missingCount === 3
                ? 'ESCOLHA MAIS 3'
                : missingCount === 2
                  ? 'ESCOLHA MAIS 2'
                  : 'ESCOLHA MAIS 1'}
          </span>
        </RunicButton>
      </footer>

      {/* POPUP: Single Modifier Info (all content inside recess, proportional ENTENDI button, NO "X" button) */}
      {popupModifier && (
        <RunicDialog
          title={popupModifier.name}
          variant="popup"
          hideCloseButton
          onClose={() => setPopupModifier(null)}
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div
                className="absolute -inset-2 rounded-full blur-lg"
                style={{ background: MOD_SLOT_VFX[popupModifier.color].aura }}
              />
              <AssetImg
                src={popupModifier.iconUrl}
                alt={popupModifier.name}
                className="relative w-14 h-14 object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.95)]"
                fallback={null}
              />
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-black/65 border border-amber-500/60 text-[8.5px] font-runic font-bold text-amber-300">
              {TIMING_LABELS[popupModifier.timing]}
            </span>

            <p className="text-[11px] text-slate-200 leading-snug bg-black/50 border border-slate-700/80 rounded-xl px-2.5 py-2 w-full">
              {popupModifier.description}
            </p>

            <div className="pt-0.5 w-full flex justify-center">
              <RunicButton size="sm" onClick={() => setPopupModifier(null)}>
                ENTENDI
              </RunicButton>
            </div>
          </div>
        </RunicDialog>
      )}
      {/* MODAL: Full 3D Holographic Card Inspector */}
      {fullInspectCard && (
        <CardInspectModal
          card={fullInspectCard}
          onClose={() => setFullInspectCard(null)}
        />
      )}
    </div>
  );
}
