import {
  HERO_COLLECTIONS,
  HERO_COLLECTION_LIST,
  HERO_FRAMES,
  HERO_SKINS,
  HERO_SLOT_META,
  ITEM_RARITY_META,
  formatItemEffect,
  generateHeroShopCatalog,
  getActiveSetBonuses,
  getCollectionCounts,
  type HeroCollectionId,
  type HeroItem,
  type HeroSlotType,
} from '@super-monster/game-engine';
import {
  ArrowLeft,
  Backpack,
  Check,
  Coins,
  Flame,
  Lock,
  Palette,
  Pencil,
  Shield,
  ShoppingBag,
  Sparkles,
  Swords,
  X,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { MOD_STAT_ASSETS, UI_ASSETS } from '../assets/assetPaths';
import type { HeroProfileState } from '../utils/heroProfile';
import { sfx } from '../utils/sfx';
import { AssetImg } from './AssetImg';

interface HeroConfigScreenProps {
  profile: HeroProfileState;
  onChangeProfile: (next: HeroProfileState) => void;
  initialTab?: ConfigTab;
  onBack: () => void;
}

type ConfigTab = 'equip' | 'sets' | 'shop' | 'appearance';

const SLOT_ORDER: HeroSlotType[] = ['arma', 'elmo', 'botas', 'amuleto'];

const SLOT_ASSET_MAP: Record<HeroSlotType, string> = {
  arma: UI_ASSETS.heroSlotArma,
  elmo: UI_ASSETS.heroSlotElmo,
  botas: UI_ASSETS.heroSlotBotas,
  amuleto: UI_ASSETS.heroSlotAmuleto,
};

function SlotIcon({
  slot,
  className = 'w-4 h-4',
}: {
  slot: HeroSlotType;
  className?: string;
}) {
  if (slot === 'arma') return <Swords className={className} />;
  if (slot === 'elmo') return <Shield className={className} />;
  if (slot === 'botas') return <Zap className={className} />;
  return <Sparkles className={className} />;
}

export function HeroConfigScreen({
  profile,
  onChangeProfile,
  initialTab = 'equip',
  onBack,
}: HeroConfigScreenProps) {
  const [activeTab, setActiveTab] = useState<ConfigTab>(initialTab);
  const [slotFilter, setSlotFilter] = useState<HeroSlotType | 'all'>('all');
  const [collectionFilter, setCollectionFilter] = useState<
    HeroCollectionId | 'all'
  >('all');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.build.heroName);
  const [toast, setToast] = useState<string | null>(null);

  const shopCatalog = useMemo(() => generateHeroShopCatalog(), []);

  const currentSkin =
    HERO_SKINS.find((s) => s.id === profile.build.skinId) ?? HERO_SKINS[0];
  const currentFrame =
    HERO_FRAMES.find((f) => f.id === profile.build.frameId) ?? HERO_FRAMES[0];

  const activeSets = getActiveSetBonuses(profile.build);
  const collectionCounts = getCollectionCounts(profile.build);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const handleSaveName = () => {
    const cleaned = nameDraft.trim().slice(0, 22);
    if (cleaned) {
      onChangeProfile({
        ...profile,
        build: { ...profile.build, heroName: cleaned },
      });
    }
    setEditingName(false);
  };

  const handleEquipItem = (item: HeroItem) => {
    sfx.cardPlace();
    const currentlyEquipped = profile.build.equipped[item.slotType];
    const nextInventory = profile.inventory.filter((i) => i.id !== item.id);
    if (currentlyEquipped) {
      nextInventory.unshift(currentlyEquipped);
    }
    onChangeProfile({
      ...profile,
      inventory: nextInventory,
      build: {
        ...profile.build,
        equipped: {
          ...profile.build.equipped,
          [item.slotType]: item,
        },
      },
    });
    showToast(`${item.name} equipado!`);
  };

  const handleUnequipSlot = (slot: HeroSlotType) => {
    const item = profile.build.equipped[slot];
    if (!item) return;
    sfx.cardRemove();
    const nextEquipped = { ...profile.build.equipped };
    delete nextEquipped[slot];
    onChangeProfile({
      ...profile,
      inventory: [item, ...profile.inventory],
      build: {
        ...profile.build,
        equipped: nextEquipped,
      },
    });
  };

  const handleBuyItem = (
    template: Omit<HeroItem, 'id' | 'remainingDurability'>
  ) => {
    if (profile.gold < template.price) {
      sfx.click();
      showToast('Ouro Rúnico insuficiente!');
      return;
    }
    sfx.cardPlace();
    const newItem: HeroItem = {
      ...template,
      id: `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      remainingDurability: template.maxDurability,
    };
    onChangeProfile({
      ...profile,
      gold: profile.gold - template.price,
      inventory: [newItem, ...profile.inventory],
    });
    showToast(`${newItem.name} comprado e adicionado ao inventário!`);
  };

  const handleSelectOrBuyFrame = (frameId: string, price: number) => {
    const unlocked = profile.unlockedFrameIds.includes(frameId);
    if (unlocked) {
      sfx.click();
      onChangeProfile({
        ...profile,
        build: { ...profile.build, frameId },
      });
      return;
    }
    if (profile.gold < price) {
      sfx.click();
      showToast('Ouro Rúnico insuficiente para esta moldura!');
      return;
    }
    sfx.cardPlace();
    onChangeProfile({
      ...profile,
      gold: profile.gold - price,
      unlockedFrameIds: [...profile.unlockedFrameIds, frameId],
      build: { ...profile.build, frameId },
    });
    showToast('Moldura desbloqueada e equipada!');
  };

  const filteredInventory = profile.inventory.filter((i) => {
    if (slotFilter !== 'all' && i.slotType !== slotFilter) return false;
    if (collectionFilter !== 'all' && i.collectionId !== collectionFilter)
      return false;
    return true;
  });

  const filteredShop = shopCatalog.filter((i) => {
    if (slotFilter !== 'all' && i.slotType !== slotFilter) return false;
    if (collectionFilter !== 'all' && i.collectionId !== collectionFilter)
      return false;
    return true;
  });

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#090c14] text-slate-100 select-none">
      {/* Background */}
      <AssetImg
        src={UI_ASSETS.bgHeroConfig}
        alt=""
        className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-35"
        fallback={null}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(245,158,11,0.16), rgba(9,12,20,0.92) 60%, #07090f 100%)',
        }}
      />

      {/* Toast */}
      {toast && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 font-runic text-[10.5px] shadow-xl animate-fade-in whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* TOP BAR */}
      <header className="relative z-20 shrink-0 px-3 pt-2.5 pb-2 border-b border-amber-500/25 bg-slate-950/90 backdrop-blur-md flex items-center justify-between gap-2 overflow-hidden">
        <AssetImg
          src={UI_ASSETS.hudTopHeader}
          alt=""
          className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-35"
          fallback={null}
        />
        <button
          type="button"
          onClick={() => {
            sfx.click();
            onBack();
          }}
          className="relative z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hud-stone-bar border border-slate-600/80 hover:border-amber-400 text-xs font-runic text-slate-100 cursor-pointer active:scale-95 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-300" />
          <span>Voltar</span>
        </button>

        <div className="relative z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full hud-stone-bar border border-amber-400/60 text-amber-200 text-xs font-runic">
          <Coins className="w-3.5 h-3.5 text-amber-300" />
          <span>{profile.gold}</span>
        </div>
      </header>

      {/* HERO PREVIEW + 4 EQUIPMENT SLOTS */}
      <section className="relative z-10 shrink-0 mx-3 mt-2.5 rounded-2xl border border-amber-500/35 bg-slate-900/80 backdrop-blur-md p-2.5 shadow-xl">
        <div className="flex items-center gap-3">
          {/* Portrait + Custom Frame */}
          <div
            className={`relative w-20 h-20 shrink-0 rounded-full flex items-center justify-center ${currentFrame.glowClass}`}
          >
            <div className="absolute inset-[17%] rounded-full overflow-hidden bg-slate-950">
              <AssetImg
                src={currentSkin.imageUrl}
                alt={profile.build.heroName}
                className="w-full h-full object-cover"
                fallback={null}
              />
            </div>
            <AssetImg
              src={currentFrame.imageUrl}
              alt={currentFrame.name}
              className="relative z-10 w-full h-full object-contain pointer-events-none"
              fallback={null}
            />
          </div>

          {/* Hero Name + Active Sets */}
          <div className="flex-1 min-w-0">
            {editingName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveName();
                }}
                className="flex items-center gap-1"
              >
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={22}
                  autoFocus
                  className="flex-1 min-w-0 bg-slate-950 border border-amber-400 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-emerald-600 text-white cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5">
                <h1 className="font-display text-sm sm:text-base text-amber-200 truncate">
                  {profile.build.heroName}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setNameDraft(profile.build.heroName);
                    setEditingName(true);
                  }}
                  title="Alterar nome"
                  className="p-1 rounded text-slate-400 hover:text-amber-300 cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="text-[10px] text-slate-400 truncate">
              {currentSkin.name} · Moldura: {currentFrame.name}
            </div>

            {/* Active Set Bonuses Badges */}
            <div className="mt-1.5 flex flex-wrap gap-1">
              {activeSets.length === 0 ? (
                <span className="text-[9.5px] text-slate-500">
                  Nenhum conjunto ativo (use 2+ itens da mesma coleção)
                </span>
              ) : (
                activeSets.map((b) => (
                  <span
                    key={`${b.collection.id}-${b.tier.requiredPieces}`}
                    className={`px-1.5 py-0.5 rounded-md border text-[9px] font-runic ${b.collection.badgeBg}`}
                  >
                    {b.collection.name} ({b.equippedCount}/
                    {b.tier.requiredPieces})
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 4 Equipment Slots Grid */}
        <div className="mt-2.5 grid grid-cols-4 gap-1.5">
          {SLOT_ORDER.map((slot) => {
            const meta = HERO_SLOT_META[slot];
            const item = profile.build.equipped[slot];
            const rarity = item ? ITEM_RARITY_META[item.rarity] : null;
            const col = item ? HERO_COLLECTIONS[item.collectionId] : null;
            const selected = slotFilter === slot;

            return (
              <div
                key={slot}
                onClick={() => {
                  sfx.click();
                  setSlotFilter(selected ? 'all' : slot);
                }}
                className={[
                  'relative rounded-xl border p-1.5 flex flex-col justify-between min-h-[76px] cursor-pointer transition overflow-hidden',
                  item && rarity
                    ? `${rarity.borderClass} ${rarity.bgClass}`
                    : 'border-dashed border-slate-700 bg-slate-950/65',
                  selected ? 'ring-2 ring-amber-400' : '',
                ].join(' ')}
              >
                {item ? (
                  <AssetImg
                    src={item.imageUrl}
                    alt={item.name}
                    className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-55"
                    fallback={
                      <AssetImg
                        src={SLOT_ASSET_MAP[slot]}
                        alt=""
                        className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-30"
                        fallback={null}
                      />
                    }
                  />
                ) : (
                  <AssetImg
                    src={SLOT_ASSET_MAP[slot]}
                    alt=""
                    className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-45"
                    fallback={null}
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-slate-950/55" />
                <div className="relative z-10 flex items-center justify-between gap-0.5">
                  <span className="text-[8.5px] font-runic uppercase text-amber-200/90 flex items-center gap-0.5">
                    <SlotIcon slot={slot} className="w-2.5 h-2.5" />
                    {meta.label}
                  </span>
                  {item && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnequipSlot(slot);
                      }}
                      title="Desequipar"
                      className="w-4 h-4 rounded-full bg-black/60 text-slate-300 hover:text-rose-300 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                {item && col ? (
                  <div className="relative z-10 mt-1">
                    <div className="text-[9.5px] font-bold text-white truncate leading-tight">
                      {item.name}
                    </div>
                    <div className={`text-[8.5px] truncate ${col.themeColor}`}>
                      {col.name}
                    </div>
                    <div className="text-[8px] text-emerald-300 font-semibold mt-0.5">
                      +{item.value}{' '}
                      {item.stat === 'damage_enemies'
                        ? 'DMG'
                        : item.stat.toUpperCase()}{' '}
                      · {item.remainingDurability}p
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 text-center text-[9px] text-slate-500 my-auto">
                    +{meta.statHint}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* TAB NAVIGATION */}
      <nav className="relative z-10 shrink-0 px-3 pt-2.5 pb-1.5 grid grid-cols-4 gap-1.5">
        {(
          [
            { id: 'equip', label: 'Mochila', icon: Backpack },
            { id: 'sets', label: '10 Coleções', icon: Flame },
            { id: 'shop', label: 'Mercado', icon: ShoppingBag },
            { id: 'appearance', label: 'Visual', icon: Palette },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                sfx.click();
                setActiveTab(tab.id);
              }}
              className={[
                'py-1.5 px-1 rounded-xl border font-runic text-[9.5px] flex items-center justify-center gap-1 transition cursor-pointer',
                active
                  ? 'bg-amber-500/25 border-amber-400 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-900/75 border-slate-700/80 text-slate-300 hover:border-slate-500',
              ].join(' ')}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* SLOT & COLLECTION FILTER PILLS (for Equip & Shop) */}
      {(activeTab === 'equip' || activeTab === 'shop') && (
        <div className="relative z-10 shrink-0 px-3 pb-2 space-y-1.5">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'all', label: 'Todos Slots' },
                { id: 'arma', label: 'Arma (ATK)' },
                { id: 'elmo', label: 'Elmo (HP)' },
                { id: 'botas', label: 'Botas (VEL)' },
                { id: 'amuleto', label: 'Amuleto' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  sfx.click();
                  setSlotFilter(f.id);
                }}
                className={[
                  'shrink-0 px-2.5 py-1 rounded-lg border text-[9.5px] font-runic cursor-pointer transition',
                  slotFilter === f.id
                    ? 'bg-sky-500/25 border-sky-400 text-sky-100'
                    : 'bg-slate-900/70 border-slate-700 text-slate-400',
                ].join(' ')}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setCollectionFilter('all');
              }}
              className={[
                'shrink-0 px-2 py-0.5 rounded-lg border text-[9px] font-runic cursor-pointer transition',
                collectionFilter === 'all'
                  ? 'bg-amber-500/25 border-amber-400 text-amber-100'
                  : 'bg-slate-900/70 border-slate-700 text-slate-400',
              ].join(' ')}
            >
              Todas Coleções
            </button>
            {HERO_COLLECTION_LIST.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => {
                  sfx.click();
                  setCollectionFilter(col.id);
                }}
                className={[
                  'shrink-0 px-2 py-0.5 rounded-lg border text-[9px] font-runic cursor-pointer transition',
                  collectionFilter === col.id
                    ? `${col.badgeBg} ring-1 ring-amber-300/60`
                    : 'bg-slate-900/70 border-slate-700 text-slate-400',
                ].join(' ')}
              >
                {col.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT */}
      <main className="relative z-10 flex-1 overflow-y-auto px-3 pb-5 space-y-2">
        {/* TAB 1: INVENTORY */}
        {activeTab === 'equip' && (
          <>
            {filteredInventory.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center space-y-2">
                <p className="text-xs text-slate-300">
                  Nenhum item disponível na mochila para este filtro.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setActiveTab('shop');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-runic text-[10.5px] cursor-pointer"
                >
                  IR AO MERCADO COMPRAR ITENS
                </button>
              </div>
            ) : (
              filteredInventory.map((item) => {
                const rarity = ITEM_RARITY_META[item.rarity];
                const col = HERO_COLLECTIONS[item.collectionId];
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border ${rarity.borderClass} ${rarity.bgClass} p-2.5 flex items-center justify-between gap-2.5`}
                  >
                    <div className="w-14 h-14 rounded-xl bg-slate-950/90 border border-amber-500/35 overflow-hidden shrink-0 flex items-center justify-center">
                      <AssetImg
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        fallback={
                          <AssetImg
                            src={MOD_STAT_ASSETS[item.stat]}
                            alt={item.stat}
                            className="w-9 h-9 object-contain"
                            fallback={<SlotIcon slot={item.slotType} className="w-5 h-5 text-amber-300" />}
                          />
                        }
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <SlotIcon
                          slot={item.slotType}
                          className="w-3.5 h-3.5 text-amber-300 shrink-0"
                        />
                        <span className="font-display text-xs text-white truncate">
                          {item.name}
                        </span>
                        <span
                          className={`text-[8.5px] font-runic px-1.5 py-0.2 rounded border ${rarity.borderClass} ${rarity.colorClass}`}
                        >
                          {rarity.label}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[10px]">
                        <span className={`px-1.5 py-0.2 rounded border ${col.badgeBg}`}>
                          {col.name}
                        </span>
                        <span className="text-slate-300">
                          Resistência: <b>{item.remainingDurability}</b>/
                          {item.maxDurability}
                        </span>
                      </div>
                      <div className="mt-1 text-[10.5px] text-emerald-200">
                        {formatItemEffect(item)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleEquipItem(item)}
                      className="shrink-0 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-300/60 text-white font-runic text-[10px] cursor-pointer"
                    >
                      EQUIPAR
                    </button>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* TAB 2: 15 COLLECTIONS */}
        {activeTab === 'sets' && (
          <div className="space-y-2">
            {HERO_COLLECTION_LIST.map((col) => {
              const count = collectionCounts[col.id] ?? 0;
              return (
                <div
                  key={col.id}
                  className={[
                    'rounded-2xl border p-2.5 bg-slate-900/80',
                    count >= 2
                      ? 'border-amber-400/70 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'border-slate-700/80',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-display text-xs ${col.themeColor}`}>
                      {col.name}
                    </span>
                    <span
                      className={`text-[9.5px] font-runic px-2 py-0.5 rounded-full border ${col.badgeBg}`}
                    >
                      {count}/4 equipados
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{col.lore}</p>
                  <div className="mt-1.5 space-y-1">
                    {col.tiers.map((tier) => {
                      const active = count >= tier.requiredPieces;
                      return (
                        <div
                          key={tier.requiredPieces}
                          className={[
                            'rounded-lg px-2 py-1 text-[10px] border',
                            active
                              ? 'bg-emerald-950/50 border-emerald-400/60 text-emerald-100'
                              : 'bg-black/35 border-slate-800 text-slate-400',
                          ].join(' ')}
                        >
                          <b className="text-amber-200">
                            [{tier.requiredPieces} peças] {tier.name}:
                          </b>{' '}
                          {tier.description}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: SHOP */}
        {activeTab === 'shop' && (
          <div className="space-y-2">
            {filteredShop.map((tpl, idx) => {
              const rarity = ITEM_RARITY_META[tpl.rarity];
              const col = HERO_COLLECTIONS[tpl.collectionId];
              const canAfford = profile.gold >= tpl.price;
              const previewItem: HeroItem = {
                ...tpl,
                id: `shop-${idx}`,
                remainingDurability: tpl.maxDurability,
              };
              return (
                <div
                  key={`${tpl.name}-${idx}`}
                  className={`rounded-2xl border ${rarity.borderClass} ${rarity.bgClass} p-2.5 flex items-center justify-between gap-2.5`}
                >
                  <div className="w-14 h-14 rounded-xl bg-slate-950/90 border border-amber-500/35 overflow-hidden shrink-0 flex items-center justify-center">
                    <AssetImg
                      src={tpl.imageUrl}
                      alt={tpl.name}
                      className="w-full h-full object-cover"
                      fallback={
                        <AssetImg
                          src={MOD_STAT_ASSETS[tpl.stat]}
                          alt={tpl.stat}
                          className="w-9 h-9 object-contain"
                          fallback={<SlotIcon slot={tpl.slotType} className="w-5 h-5 text-amber-300" />}
                        />
                      }
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <SlotIcon
                        slot={tpl.slotType}
                        className="w-3.5 h-3.5 text-amber-300 shrink-0"
                      />
                      <span className="font-display text-xs text-white truncate">
                        {tpl.name}
                      </span>
                      <span
                        className={`text-[8.5px] font-runic px-1.5 py-0.2 rounded border ${rarity.borderClass} ${rarity.colorClass}`}
                      >
                        {rarity.label}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px]">
                      <span className={`px-1.5 py-0.2 rounded border ${col.badgeBg}`}>
                        {col.name}
                      </span>
                      <span className="text-slate-300">
                        Durabilidade: {tpl.maxDurability} partidas
                      </span>
                    </div>
                    <div className="mt-1 text-[10.5px] text-emerald-200">
                      {formatItemEffect(previewItem)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBuyItem(tpl)}
                    className={[
                      'shrink-0 px-2.5 py-2 rounded-xl border font-runic text-[10px] flex items-center gap-1 cursor-pointer transition',
                      canAfford
                        ? 'bg-amber-400 hover:bg-amber-300 border-amber-200 text-slate-950 font-black'
                        : 'bg-slate-800 border-slate-700 text-slate-500',
                    ].join(' ')}
                  >
                    <Coins className="w-3 h-3" />
                    <span>{tpl.price}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: SKINS & FRAMES */}
        {activeTab === 'appearance' && (
          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-runic text-amber-300 mb-1.5">
                SKINS DO PERSONAGEM
              </div>
              <div className="grid grid-cols-2 gap-2">
                {HERO_SKINS.map((skin) => {
                  const selected = profile.build.skinId === skin.id;
                  return (
                    <button
                      key={skin.id}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        onChangeProfile({
                          ...profile,
                          build: { ...profile.build, skinId: skin.id },
                        });
                      }}
                      className={[
                        'rounded-2xl border p-2 text-left flex items-center gap-2 cursor-pointer transition',
                        selected
                          ? 'bg-amber-500/20 border-amber-400'
                          : 'bg-slate-900/75 border-slate-700 hover:border-slate-500',
                      ].join(' ')}
                    >
                      <AssetImg
                        src={skin.imageUrl}
                        alt={skin.name}
                        className="w-11 h-11 rounded-full object-cover border border-amber-400/50 shrink-0"
                        fallback={null}
                      />
                      <div className="min-w-0">
                        <div className="font-display text-[11px] text-white truncate">
                          {skin.name}
                        </div>
                        <div className="text-[9px] text-slate-400 line-clamp-2">
                          {skin.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-runic text-sky-300 mb-1.5">
                MOLDURAS CUSTOMIZÁVEIS (EVENTOS & MERCADO)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {HERO_FRAMES.map((frame) => {
                  const unlocked = profile.unlockedFrameIds.includes(frame.id);
                  const selected = profile.build.frameId === frame.id;
                  return (
                    <button
                      key={frame.id}
                      type="button"
                      onClick={() =>
                        handleSelectOrBuyFrame(frame.id, frame.price)
                      }
                      className={[
                        'rounded-2xl border p-2 text-left flex items-center gap-2 cursor-pointer transition',
                        selected
                          ? 'bg-amber-500/20 border-amber-400'
                          : 'bg-slate-900/75 border-slate-700 hover:border-slate-500',
                      ].join(' ')}
                    >
                      <div
                        className={`relative w-11 h-11 rounded-full shrink-0 flex items-center justify-center ${frame.glowClass}`}
                      >
                        <AssetImg
                          src={frame.imageUrl}
                          alt={frame.name}
                          className="w-full h-full object-contain"
                          fallback={null}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-[11px] text-white truncate">
                          {frame.name}
                        </div>
                        {unlocked ? (
                          <div className="text-[9.5px] text-emerald-300 font-runic">
                            {selected ? 'EQUIPADA' : 'DESBLOQUEADA'}
                          </div>
                        ) : (
                          <div className="text-[9.5px] text-amber-300 font-runic flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{frame.price} Ouro</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
