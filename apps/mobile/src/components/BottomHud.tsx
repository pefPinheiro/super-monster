import { PRECEDENCE_META, type CardDefinition } from '@super-monster/game-engine';
import { FastForward, ShieldCheck, Sparkles } from 'lucide-react';
import { CRYSTAL_ASSETS, UI_ASSETS } from '../assets/assetPaths';
import { AssetImg } from './AssetImg';

interface BottomHudProps {
  heroName: string;
  allyRemaining: number;
  allyMaxTotal: number;
  hand: CardDefinition[];
  extrasPlayed: number;
  extrasDrawn: number;
  maxExtras: number;
  selectedHandIndex: number | null;
  newlyDrawnCardId?: string | null;
  isPlayerTurn: boolean;
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
  extrasPlayed,
  extrasDrawn,
  maxExtras,
  selectedHandIndex,
  newlyDrawnCardId = null,
  isPlayerTurn,
  canReinforce,
  canPass,
  onSelectHandCard,
  onPassTurn,
}: BottomHudProps) {
  const extrasLeftToPlay = Math.max(0, maxExtras - extrasPlayed);

  return (
    <footer className="relative z-30 hud-leather-bar border-t-2 border-amber-800/90 px-2.5 py-2 overflow-hidden shadow-[0_-8px_22px_rgba(0,0,0,0.85)]">
      {/* Subtle Leather Panel Texture */}
      <AssetImg
        src={UI_ASSETS.hudBottomLeather}
        alt=""
        className="pointer-events-none absolute inset-x-0 -inset-y-6 w-full h-[155%] object-cover opacity-85"
        fallback={null}
      />

      <div className="relative z-10 flex items-center justify-between gap-2">
        {/* Left: Ally Hero Portrait + Dedicated Hero Modifier Socket (prepared for future hero buffs) */}
        <div className="w-[80px] shrink-0 flex flex-col items-center">
          <div
            className={[
              'relative w-16 h-16 flex items-center justify-center transition-all duration-300',
              isPlayerTurn
                ? 'scale-105 drop-shadow-[0_0_14px_rgba(52,211,153,0.85)]'
                : 'drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]',
            ].join(' ')}
          >
            {/* Hero Portrait inside the Transparent Window */}
            <div className="absolute inset-[18%] rounded-sm overflow-hidden bg-slate-950">
              <AssetImg
                src={UI_ASSETS.heroAlly}
                alt={heroName}
                className="w-full h-full object-cover"
                fallback={<ShieldCheck className="w-6 h-6 text-amber-300 m-auto" />}
              />
            </div>

            {/* Stone Claw Frame Overlay */}
            <AssetImg
              src={UI_ASSETS.hudPortraitFrameAlly}
              alt="Moldura do Herói"
              className="pointer-events-none relative z-10 w-full h-full object-contain"
              fallback={null}
            />

            {/* Hero Modifier Socket (Top-Right — ready for future Hero Modifiers like +VEL) */}
            <div
              title="Modificador do Herói (Em breve: bônus passivo de velocidade ou ataque)"
              className="absolute -top-1 -right-1 z-20 w-6 h-6 rounded-full flex items-center justify-center"
            >
              <AssetImg
                src={UI_ASSETS.hudHeroModSlot}
                alt="Modificador do Herói"
                className="w-6 h-6 object-contain drop-shadow"
                fallback={
                  <span className="w-5 h-5 rounded-full bg-slate-950/95 border border-cyan-400/90 flex items-center justify-center text-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.6)]">
                    <Sparkles className="w-3 h-3" />
                  </span>
                }
              />
            </div>

            {/* Reinforcements Left Counter */}
            <span
              title="Reforços extras restantes na partida"
              className="absolute -bottom-0.5 -right-0.5 z-20 rounded-full bg-amber-950 border border-amber-400 px-1.5 py-0.2 text-[8.5px] font-runic text-amber-300 shadow"
            >
              +{extrasLeftToPlay}
            </span>
          </div>

          <div className="w-full mt-0.5 text-center">
            <div className="text-[9px] font-runic text-amber-200 text-outline-sm leading-tight">
              {allyRemaining}/{allyMaxTotal} Cartas
            </div>
          </div>
        </div>

        {/* Center: Larger Reinforcement Cards (Strictly max 2 extra monsters per match) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[9px] text-amber-100 mb-1 px-0.5 text-outline-sm">
            <span className="font-runic uppercase tracking-wider">
              Reforços ({hand.length}/2)
            </span>
            <span className="text-[8.5px] text-amber-300 font-bold">
              {canReinforce
                ? 'Toque p/ reforçar'
                : extrasLeftToPlay === 0
                  ? 'Limite (2/2) usado'
                  : extrasDrawn >= maxExtras && hand.length === 0
                    ? 'Sem mais reforços'
                    : 'Aguardando vaga'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 min-h-[80px]">
            {[0, 1].map((idx) => {
              const card = hand[idx];
              if (!card) {
                const alreadyUsedOrExhausted =
                  idx >= extrasLeftToPlay ||
                  (extrasDrawn >= maxExtras && idx >= hand.length);
                return (
                  <div
                    key={idx}
                    className="relative rounded-xl border border-amber-900/75 bg-black/50 overflow-hidden flex items-center justify-center px-2"
                  >
                    <AssetImg
                      src={UI_ASSETS.cardBack}
                      alt="Espaço de reforço"
                      className="absolute inset-0 w-full h-full object-cover opacity-25"
                      fallback={null}
                    />
                    <span className="relative z-10 text-[9px] font-runic text-amber-200/80 text-outline-sm text-center leading-tight">
                      {alreadyUsedOrExhausted
                        ? 'Reforço Esgotado'
                        : `Reforço #${extrasDrawn + idx + 1}\n(Fim do Round)`}
                    </span>
                  </div>
                );
              }
              const isSelected = selectedHandIndex === idx;
              const isNewlyDrawn = newlyDrawnCardId === card.id;
              return (
                <button
                  key={`${card.id}-${idx}`}
                  type="button"
                  onClick={() => onSelectHandCard(idx)}
                  disabled={!canReinforce}
                  className={[
                    'relative rounded-xl border-2 overflow-hidden flex items-center gap-2 p-1.5 transition text-left bg-slate-950/90',
                    isSelected
                      ? 'border-amber-300 -translate-y-1.5 shadow-[0_0_18px_rgba(251,191,36,0.95)]'
                      : isNewlyDrawn
                        ? 'border-sky-300 shadow-[0_0_18px_rgba(56,189,248,0.95)] animate-card-enter'
                        : canReinforce
                          ? 'border-amber-500/90 hover:-translate-y-0.5 cursor-pointer'
                          : 'border-slate-600/90 opacity-90 cursor-not-allowed',
                  ].join(' ')}
                >
                  {/* Clear Portrait Thumbnail */}
                  <div className="relative w-12 h-16 rounded-lg overflow-hidden border border-amber-400/60 shrink-0 bg-slate-900">
                    <AssetImg
                      src={card.artUrl}
                      alt={card.name}
                      className="w-full h-full object-cover"
                      fallback={
                        <div className="w-full h-full flex items-center justify-center text-xl">
                          {card.emojiFallback}
                        </div>
                      }
                    />
                    <AssetImg
                      src={CRYSTAL_ASSETS[card.precedence]}
                      alt={PRECEDENCE_META[card.precedence].label}
                      className="absolute top-0.5 left-0.5 w-4 h-4 object-contain drop-shadow"
                      fallback={null}
                    />
                  </div>

                  {/* Card Name & Clear Attributes */}
                  <div className="relative z-10 min-w-0 flex-1 flex flex-col justify-between h-full py-0.5">
                    {isNewlyDrawn && (
                      <span className="self-start px-1.5 py-0.2 rounded bg-sky-500 text-slate-950 font-runic text-[7.5px] uppercase tracking-wider mb-0.5">
                        ★ NOVO!
                      </span>
                    )}
                    <div className="text-[10px] font-display text-white leading-tight line-clamp-2 text-outline-sm">
                      {card.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold mt-1 text-outline-sm">
                      <span className="text-red-400">{card.atk}</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-emerald-400">{card.hp}</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-sky-300">{card.vel}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Circular PASS Button (hud_pass_btn.png) */}
        <button
          type="button"
          onClick={onPassTurn}
          disabled={!canPass}
          title="Passar Vez (PASS)"
          className={[
            'relative w-14 h-14 shrink-0 flex flex-col items-center justify-center transition',
            canPass
              ? 'hover:brightness-115 active:scale-90 cursor-pointer'
              : 'opacity-50 saturate-50 cursor-not-allowed',
          ].join(' ')}
        >
          <AssetImg
            src={UI_ASSETS.hudPassBtn}
            alt="Passar Turno"
            className="w-15 h-15 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)]"
            fallback={
              <span className="w-13 h-13 rounded-full bg-amber-600 border-2 border-amber-200 flex items-center justify-center text-slate-950">
                <FastForward className="w-5 h-5 fill-current" />
              </span>
            }
          />
          <span className="absolute -bottom-0.5 px-1.5 py-0.2 rounded bg-slate-950/90 border border-amber-500/60 text-[7px] font-runic uppercase tracking-wider text-amber-200 text-outline-sm">
            PASS
          </span>
        </button>
      </div>
    </footer>
  );
}
