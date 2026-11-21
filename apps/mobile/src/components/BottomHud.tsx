import { PRECEDENCE_META, type CardDefinition } from '@super-monster/game-engine';
import { FastForward, ShieldCheck } from 'lucide-react';
import { UI_ASSETS } from '../assets/assetPaths';
import { AssetImg } from './AssetImg';

interface BottomHudProps {
  heroName: string;
  allyRemaining: number;
  allyMaxTotal: number;
  hand: CardDefinition[];
  deckCount: number;
  extrasPlayed: number;
  maxExtras: number;
  selectedHandIndex: number | null;
  canReinforce: boolean;
  canPass: boolean;
  onSelectHandCard: (index: number) => void;
  onPassTurn: () => void;
}

export function BottomHud({
  heroName,
  allyRemaining,
  allyMaxTotal,
  hand,
  deckCount,
  extrasPlayed,
  maxExtras,
  selectedHandIndex,
  canReinforce,
  canPass,
  onSelectHandCard,
  onPassTurn,
}: BottomHudProps) {
  const extrasLeft = Math.max(0, maxExtras - extrasPlayed);

  return (
    <footer className="relative z-30 hud-leather-bar border-t-2 px-2 py-2">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Ally Portrait + Monsters Remaining & Reinforcements (No Player HP!) */}
        <div className="w-[82px] shrink-0 flex flex-col items-center">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-b from-amber-800 to-slate-950 border-2 border-amber-400/90 ring-1 ring-black flex items-center justify-center shadow-lg">
            <AssetImg
              src={UI_ASSETS.heroAlly}
              alt={heroName}
              className="w-full h-full object-cover"
              fallback={<ShieldCheck className="w-6 h-6 text-amber-300" />}
            />
            <span
              title="Reforços extras restantes na partida"
              className="absolute -bottom-0.5 -right-0.5 rounded-tl-md bg-slate-950/95 border-t border-l border-amber-400 px-1 text-[9px] font-black text-amber-300"
            >
              +{extrasLeft}
            </span>
          </div>
          <div className="w-full mt-1 text-center">
            <div className="text-[9px] font-black text-amber-200 text-outline-sm">
              {allyRemaining}/{allyMaxTotal} Cartas
            </div>
            <div className="text-[8px] font-bold text-amber-200/80 text-outline-sm">
              Deck: {deckCount}
            </div>
          </div>
        </div>

        {/* Center: Hand (up to 4 cards) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[9px] text-amber-100 mb-1 px-0.5 text-outline-sm">
            <span className="font-extrabold uppercase tracking-wider">
              Mão ({hand.length}/4)
            </span>
            <span className="text-[8.5px] text-amber-300 font-bold">
              {canReinforce
                ? 'Toque p/ reforçar'
                : extrasLeft === 0
                  ? 'Máx. 2 extras'
                  : 'Campo cheio'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 min-h-[64px]">
            {[0, 1, 2, 3].map((idx) => {
              const card = hand[idx];
              if (!card) {
                return (
                  <div
                    key={idx}
                    className="rounded-md border border-dashed border-amber-800/70 bg-black/30 flex items-center justify-center text-[10px] text-amber-800/70 font-display"
                  >
                    ✦
                  </div>
                );
              }
              const isSelected = selectedHandIndex === idx;
              return (
                <button
                  key={`${card.id}-${idx}`}
                  type="button"
                  onClick={() => onSelectHandCard(idx)}
                  disabled={!canReinforce}
                  className={[
                    'relative rounded-md border-2 overflow-hidden flex flex-col items-center justify-end p-0.5 transition text-center',
                    isSelected
                      ? 'border-amber-300 -translate-y-1 shadow-[0_0_12px_rgba(251,191,36,0.75)]'
                      : canReinforce
                        ? 'border-amber-500/80 hover:-translate-y-0.5 cursor-pointer'
                        : 'border-slate-700 opacity-75 cursor-not-allowed',
                  ].join(' ')}
                >
                  <AssetImg
                    src={card.artUrl}
                    alt={card.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    fallback={
                      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-lg">
                        {card.emojiFallback}
                      </div>
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/30" />
                  <span
                    className="absolute top-1 left-1 w-2.5 h-2.5 rotate-45 rounded-[1px] border border-white/70 z-10"
                    style={{
                      backgroundColor: PRECEDENCE_META[card.precedence].colorHex,
                    }}
                  />
                  <span className="relative z-10 text-[8px] font-black text-white truncate w-full text-outline-sm">
                    {card.name.split(' ')[0]}
                  </span>
                  <span className="relative z-10 text-[7.5px] font-extrabold text-amber-300 text-outline-sm">
                    {card.atk}/{card.hp}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Circular FAST-FORWARD / PASS (>>) Button */}
        <button
          type="button"
          onClick={onPassTurn}
          disabled={!canPass}
          className={[
            'w-14 h-14 shrink-0 rounded-full border-2 flex flex-col items-center justify-center transition shadow-lg ring-1 ring-black/80',
            canPass
              ? 'bg-gradient-to-b from-amber-400 via-amber-600 to-amber-900 border-amber-200 text-slate-950 hover:brightness-110 active:scale-95 cursor-pointer'
              : 'bg-slate-800 border-slate-600 text-slate-500 cursor-not-allowed',
          ].join(' ')}
        >
          <FastForward className="w-5 h-5 fill-current" />
          <span className="text-[8px] font-black uppercase tracking-tight leading-none mt-0.5">
            PASS
          </span>
        </button>
      </div>
    </footer>
  );
}
