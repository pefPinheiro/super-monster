import {
  PRECEDENCE_META,
  type CardDefinition,
  type MatchState,
  type SlotModifierDefinition,
} from '@super-monster/game-engine';
import { Check, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { UI_ASSETS } from '../assets/assetPaths';
import { AssetImg } from './AssetImg';

interface DraftScreenProps {
  state: MatchState;
  onConfirmDraft: (slotCardIds: [string, string, string]) => void;
}

const MOD_BADGE_COLORS: Record<SlotModifierDefinition['color'], string> = {
  red: 'text-red-300 border-red-500/80 bg-red-950/90',
  blue: 'text-sky-300 border-sky-500/80 bg-sky-950/90',
  green: 'text-emerald-300 border-emerald-500/80 bg-emerald-950/90',
  cyan: 'text-cyan-300 border-cyan-500/80 bg-cyan-950/90',
  orange: 'text-orange-300 border-orange-500/80 bg-orange-950/90',
  lime: 'text-lime-300 border-lime-500/80 bg-lime-950/90',
  rose: 'text-rose-300 border-rose-500/80 bg-rose-950/90',
  purple: 'text-purple-300 border-purple-500/80 bg-purple-950/90',
  amber: 'text-amber-300 border-amber-500/80 bg-amber-950/90',
  indigo: 'text-indigo-300 border-indigo-500/80 bg-indigo-950/90',
};

export function DraftScreen({ state, onConfirmDraft }: DraftScreenProps) {
  const [slots, setSlots] = useState<
    [CardDefinition | null, CardDefinition | null, CardDefinition | null]
  >([null, null, null]);
  const [inspectedCard, setInspectedCard] = useState<CardDefinition | null>(
    state.players.player.draftOptions[0] ?? null
  );

  const options = state.players.player.draftOptions;
  const modifiers = state.players.player.slotModifiers;

  const isChosen = (cardId: string) => slots.some((s) => s?.id === cardId);

  const handleToggleOption = (card: CardDefinition) => {
    setInspectedCard(card);
    const existingIdx = slots.findIndex((s) => s?.id === card.id);
    if (existingIdx >= 0) {
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
    if (emptyIdx === -1) return;
    const next: [
      CardDefinition | null,
      CardDefinition | null,
      CardDefinition | null,
    ] = [...slots];
    next[emptyIdx] = card;
    setSlots(next);
  };

  const handleClearSlot = (idx: 0 | 1 | 2) => {
    const next: [
      CardDefinition | null,
      CardDefinition | null,
      CardDefinition | null,
    ] = [...slots];
    next[idx] = null;
    setSlots(next);
  };

  const allFilled = slots[0] !== null && slots[1] !== null && slots[2] !== null;

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
      {/* Terrain Background */}
      <img
        src={state.terrain.imageUrl}
        alt={state.terrain.name}
        className="absolute inset-0 w-full h-full object-cover opacity-65"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/55 to-slate-950/95" />

      {/* Header */}
      <div className="relative z-10 hud-stone-bar border-b-2 px-3 py-2.5 text-center">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 text-outline-sm">
          Terreno: {state.terrain.name} ({state.terrain.biome})
        </div>
        <h2 className="font-display font-black text-base text-white mt-0.5 text-outline">
          Escolha 3 de 5 Cartas
        </h2>
        <p className="text-[10.5px] text-slate-200 text-outline-sm">
          As 2 cartas restantes voltam ao baralho.
        </p>
      </div>

      {/* 3 Board Slots with Modifiers */}
      <div className="relative z-10 px-3 pt-3">
        <div className="grid grid-cols-3 gap-2">
          {([0, 1, 2] as const).map((idx) => {
            const mod = modifiers[idx];
            const card = slots[idx];
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                {/* Modifier Asset + Label */}
                <div
                  title={mod.description}
                  className={[
                    'w-full flex items-center justify-center gap-1 px-1.5 py-1 rounded-lg border shadow-md',
                    MOD_BADGE_COLORS[mod.color],
                  ].join(' ')}
                >
                  <AssetImg
                    src={mod.iconUrl}
                    alt={mod.name}
                    className="w-4 h-4 object-contain shrink-0 drop-shadow"
                    fallback={null}
                  />
                  <span className="text-[10px] font-black tracking-wide text-outline-sm truncate">
                    {mod.label}
                  </span>
                </div>

                {/* Slot Pedestal */}
                <button
                  type="button"
                  onClick={() => card && handleClearSlot(idx)}
                  className={[
                    'relative w-full aspect-[3/4.1] rounded-lg border-2 overflow-hidden flex flex-col items-center justify-center transition',
                    card
                      ? 'card-frame border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.45)] cursor-pointer'
                      : 'border-slate-500/80 bg-slate-950/60 text-slate-300',
                  ].join(' ')}
                >
                  {card ? (
                    <>
                      <AssetImg
                        src={card.artUrl}
                        alt={card.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        fallback={
                          <span className="text-4xl drop-shadow">
                            {card.emojiFallback}
                          </span>
                        }
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/40" />
                      <span
                        className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 rounded-[2px] border border-white/80 shadow"
                        style={{
                          backgroundColor:
                            PRECEDENCE_META[card.precedence].colorHex,
                        }}
                      />
                      <div className="relative z-10 mt-auto w-full p-1.5 text-center">
                        <div className="text-[10px] font-black text-white leading-tight truncate text-outline-sm">
                          {card.name}
                        </div>
                        <div className="text-[9px] font-extrabold text-amber-300 text-outline-sm">
                          {card.atk} / {card.hp} / {card.vel}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <AssetImg
                        src={UI_ASSETS.slotEmpty}
                        alt={`Lugar ${idx + 1}`}
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                        fallback={null}
                      />
                      <span className="relative z-10 text-[10px] font-extrabold uppercase tracking-wider text-slate-200 text-outline-sm">
                        Lugar {idx + 1}
                      </span>
                      <span className="relative z-10 text-[8.5px] text-slate-300 px-1 text-center leading-tight mt-0.5 text-outline-sm">
                        {mod.name}
                      </span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inspected Card Detail Strip */}
      <div className="relative z-10 px-3 pt-2">
        {inspectedCard && (
          <div className="rounded-xl bg-slate-950/90 border border-slate-600/90 px-3 py-2 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-amber-300 truncate text-outline-sm">
                {inspectedCard.name}
              </span>
              <span className="text-[10px] font-bold text-slate-300 shrink-0">
                {PRECEDENCE_META[inspectedCard.precedence].label} •{' '}
                {inspectedCard.monsterType}
              </span>
            </div>
            {inspectedCard.skills[0] && (
              <div className="text-[10px] text-slate-200 flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3 shrink-0 text-amber-400" />
                <span className="truncate">
                  <strong>{inspectedCard.skills[0].name}:</strong>{' '}
                  {inspectedCard.skills[0].description}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5 Draft Cards SIDE BY SIDE */}
      <div className="relative z-10 px-2.5 py-2 mt-auto">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-200 mb-1.5 text-center text-outline-sm">
          Suas 5 Cartas (Toque para posicionar)
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {options.map((card) => {
            const chosen = isChosen(card.id);
            const active = inspectedCard?.id === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleToggleOption(card)}
                className={[
                  'relative aspect-[3/4.6] rounded-lg border-2 overflow-hidden flex flex-col justify-between transition cursor-pointer card-frame',
                  chosen
                    ? 'border-amber-400 -translate-y-1.5 shadow-[0_0_16px_rgba(251,191,36,0.6)]'
                    : active
                      ? 'border-slate-300'
                      : 'border-slate-600 hover:border-slate-400',
                ].join(' ')}
              >
                {/* Card Artwork */}
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

                {/* Precedence Crystal */}
                <span
                  className="relative z-10 mx-auto mt-1 w-3 h-3 rotate-45 rounded-[2px] border border-white/80 shadow"
                  style={{
                    backgroundColor: PRECEDENCE_META[card.precedence].colorHex,
                  }}
                />

                {/* Check Badge when Selected */}
                {chosen && (
                  <div className="absolute top-1 right-1 z-20 w-4 h-4 rounded-full bg-amber-400 border border-amber-100 text-slate-950 flex items-center justify-center shadow">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* Name & Compact Stats */}
                <div className="relative z-10 w-full px-0.5 pb-1 text-center">
                  <div className="text-[8.5px] font-black text-white leading-tight truncate text-outline-sm">
                    {card.name.split(' ')[0]}
                  </div>
                  <div className="flex items-center justify-center gap-0.5 text-[7.5px] font-black mt-0.5 text-outline-sm">
                    <span className="text-red-400">{card.atk}</span>
                    <span className="text-slate-400">/</span>
                    <span className="text-emerald-400">{card.hp}</span>
                    <span className="text-slate-400">/</span>
                    <span className="text-sky-400">{card.vel}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm Footer */}
      <div className="relative z-10 hud-leather-bar border-t-2 p-3">
        <button
          type="button"
          disabled={!allFilled}
          onClick={() => {
            if (allFilled) {
              onConfirmDraft([slots[0]!.id, slots[1]!.id, slots[2]!.id]);
            }
          }}
          className={[
            'w-full py-3 rounded-xl font-display font-black text-sm tracking-wider border-2 transition',
            allFilled
              ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 border-amber-200 text-slate-950 shadow-lg hover:brightness-110 cursor-pointer'
              : 'bg-slate-800 border-slate-600 text-slate-400 cursor-not-allowed',
          ].join(' ')}
        >
          {allFilled
            ? 'INICIAR ROUND 1'
            : `ESCOLHA MAIS ${slots.filter((s) => s === null).length} CARTA(S)`}
        </button>
      </div>
    </div>
  );
}
