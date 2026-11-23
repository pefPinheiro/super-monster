import {
  HERO_COLLECTIONS,
  HERO_FRAMES,
  HERO_SKINS,
  HERO_SLOT_META,
  ITEM_RARITY_META,
  formatItemEffect,
  getActiveSetBonuses,
  getCollectionCounts,
  type HeroBuild,
  type HeroSlotType,
} from '@super-monster/game-engine';
import { Flame, Shield, Sparkles, Swords, X, Zap } from 'lucide-react';
import { MOD_STAT_ASSETS } from '../assets/assetPaths';
import { sfx } from '../utils/sfx';
import { AssetImg } from './AssetImg';

interface HeroEffectsModalProps {
  heroName: string;
  heroBuild?: HeroBuild;
  fallbackPortraitUrl: string;
  fallbackFrameUrl: string;
  isEnemy?: boolean;
  onClose: () => void;
}

const SLOT_ORDER: HeroSlotType[] = ['arma', 'elmo', 'botas', 'amuleto'];

export function HeroEffectsModal({
  heroName,
  heroBuild,
  fallbackPortraitUrl,
  fallbackFrameUrl,
  isEnemy = false,
  onClose,
}: HeroEffectsModalProps) {
  const skin = HERO_SKINS.find((s) => s.id === heroBuild?.skinId);
  const frame = HERO_FRAMES.find((f) => f.id === heroBuild?.frameId);
  const portraitUrl = skin?.imageUrl ?? fallbackPortraitUrl;
  const frameUrl = frame?.imageUrl ?? fallbackFrameUrl;

  const activeSets = getActiveSetBonuses(heroBuild);
  const counts = getCollectionCounts(heroBuild);

  const handleClose = () => {
    sfx.click();
    onClose();
  };

  return (
    <div
      className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3.5 animate-fade-in"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[390px] max-h-[88dvh] rounded-2xl border border-amber-500/45 bg-slate-900/95 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-3.5 py-2.5 border-b border-amber-500/25 bg-slate-950/75 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
              <div className="absolute inset-[18%] rounded-full overflow-hidden bg-slate-950">
                <AssetImg
                  src={portraitUrl}
                  alt={heroName}
                  className="w-full h-full object-cover"
                  fallback={null}
                />
              </div>
              <AssetImg
                src={frameUrl}
                alt=""
                className="relative z-10 w-full h-full object-contain"
                fallback={null}
              />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-runic uppercase tracking-wider text-amber-300/85">
                {isEnemy ? 'Herói Adversário' : 'Seu Herói'}
              </div>
              <h3 className="font-display text-sm text-white truncate">
                {heroBuild?.heroName ?? heroName}
              </h3>
              {skin && (
                <div className="text-[10px] text-slate-400 truncate">
                  {skin.name} · {frame?.name ?? 'Moldura Padrão'}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 text-slate-200 flex items-center justify-center hover:border-amber-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Active Set Bonuses */}
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-runic text-amber-300 mb-1.5">
              <Flame className="w-3.5 h-3.5" />
              <span>BÔNUS DE CONJUNTO ATIVOS ({activeSets.length})</span>
            </div>

            {activeSets.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-[11px] text-slate-400">
                Nenhum bônus de conjunto ativo. Equipe 2, 3 ou 4 itens da mesma
                coleção para ativar habilidades extras.
              </div>
            ) : (
              <div className="space-y-1.5">
                {activeSets.map((bonus) => (
                  <div
                    key={`${bonus.collection.id}-${bonus.tier.requiredPieces}`}
                    className="rounded-xl border border-amber-400/45 bg-amber-950/25 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-xs text-amber-200">
                        {bonus.collection.name} ({bonus.equippedCount}/
                        {bonus.tier.requiredPieces})
                      </span>
                      <span className="text-[9px] font-runic px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-emerald-200">
                        ATIVO
                      </span>
                    </div>
                    <div className="text-[10.5px] font-semibold text-white mt-0.5">
                      {bonus.tier.name}
                    </div>
                    <div className="text-[10px] text-slate-300">
                      {bonus.tier.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4 Equipped Item Slots */}
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-runic text-sky-300 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>EQUIPAMENTOS ({SLOT_ORDER.filter((s) => heroBuild?.equipped[s]).length}/4)</span>
            </div>

            <div className="space-y-1.5">
              {SLOT_ORDER.map((slot) => {
                const slotMeta = HERO_SLOT_META[slot];
                const item = heroBuild?.equipped[slot];
                if (!item) {
                  return (
                    <div
                      key={slot}
                      className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-3 py-2 flex items-center justify-between text-[11px] text-slate-500"
                    >
                      <span className="font-runic">{slotMeta.label}</span>
                      <span>Vazio</span>
                    </div>
                  );
                }
                const rarityMeta = ITEM_RARITY_META[item.rarity];
                const col = HERO_COLLECTIONS[item.collectionId];
                const SlotIcon =
                  slot === 'arma'
                    ? Swords
                    : slot === 'elmo'
                      ? Shield
                      : slot === 'botas'
                        ? Zap
                        : Sparkles;

                return (
                  <div
                    key={slot}
                    className={`rounded-xl border ${rarityMeta.borderClass} ${rarityMeta.bgClass} px-3 py-2`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg overflow-hidden border border-amber-400/40 bg-slate-950 shrink-0 flex items-center justify-center">
                          <AssetImg
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            fallback={
                              <AssetImg
                                src={MOD_STAT_ASSETS[item.stat]}
                                alt={item.stat}
                                className="w-4 h-4 object-contain"
                                fallback={<SlotIcon className="w-3.5 h-3.5 text-amber-300" />}
                              />
                            }
                          />
                        </div>
                        <span className="font-display text-xs text-white truncate">
                          {item.name}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-runic px-1.5 py-0.5 rounded border ${rarityMeta.borderClass} ${rarityMeta.colorClass} shrink-0`}
                      >
                        {rarityMeta.label}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded border ${col.badgeBg}`}>
                        {col.name} ({counts[col.id] ?? 1})
                      </span>
                      <span className="text-slate-300">
                        Resistência: <b>{item.remainingDurability}</b>/
                        {item.maxDurability}
                      </span>
                    </div>

                    <div className="mt-1 text-[10.5px] text-emerald-200 font-medium">
                      {formatItemEffect(item)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
