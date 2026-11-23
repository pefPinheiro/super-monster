import {
  HERO_FRAMES,
  HERO_SKINS,
  getActiveSetBonuses,
  getEquippedItemsList,
  type TerrainDefinition,
} from '@super-monster/game-engine';
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  Flame,
  Music,
  Settings2,
  Shuffle,
  Swords,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { UI_ASSETS } from '../assets/assetPaths';
import type { HeroProfileState } from '../utils/heroProfile';
import { isMusicEnabled, setMusicEnabled } from '../utils/music';
import { isSfxEnabled, setSfxEnabled, sfx } from '../utils/sfx';
import { AssetImg } from './AssetImg';
import { RunicButton } from './RunicButton';
import { RunicDialog } from './RunicDialog';

interface TitleScreenProps {
  terrains: TerrainDefinition[];
  selectedTerrainId: string | 'random';
  heroProfile: HeroProfileState;
  onSelectTerrain: (id: string | 'random') => void;
  onStartMatch: () => void;
  onOpenCampaign: () => void;
  onOpenDeck: () => void;
  onOpenHeroConfig: () => void;
  onOpenHeroShop: () => void;
}

type MenuId = 'battle' | 'campaign' | 'deck' | 'market' | 'settings';

interface MenuItemConfig {
  id: MenuId;
  title: string;
  subtitle: string;
  badge?: string;
  imageUrl: string;
  glowGradient: string;
  textColor: string;
}

const MENU_ITEMS: MenuItemConfig[] = [
  {
    id: 'battle',
    title: 'BATALHA',
    subtitle: 'Entrar na Arena Rúnica 3x3',
    badge: 'JOGAR AGORA',
    imageUrl: UI_ASSETS.logoBatalha,
    glowGradient:
      'radial-gradient(circle, rgba(249,115,22,0.8) 0%, rgba(220,38,38,0.48) 42%, rgba(0,0,0,0) 72%)',
    textColor: 'text-amber-300',
  },
  {
    id: 'campaign',
    title: 'CAMPANHA',
    subtitle: 'Jornada pelos Reinos Antigos',
    badge: 'MAPA DE FASES',
    imageUrl: UI_ASSETS.logoCampanha,
    glowGradient:
      'radial-gradient(circle, rgba(34,197,94,0.75) 0%, rgba(16,185,129,0.42) 42%, rgba(0,0,0,0) 72%)',
    textColor: 'text-emerald-300',
  },
  {
    id: 'deck',
    title: 'DECK',
    subtitle: 'Grimório de Monstros e Atributos',
    badge: '50 CARTAS',
    imageUrl: UI_ASSETS.logoDeck,
    glowGradient:
      'radial-gradient(circle, rgba(250,204,21,0.78) 0%, rgba(56,189,248,0.44) 45%, rgba(0,0,0,0) 72%)',
    textColor: 'text-amber-200',
  },
  {
    id: 'market',
    title: 'MERCADO',
    subtitle: 'Relíquias, Pacotes e Skins Rúnicas',
    badge: 'COMÉRCIO',
    imageUrl: UI_ASSETS.logoMercado,
    glowGradient:
      'radial-gradient(circle, rgba(56,189,248,0.78) 0%, rgba(245,158,11,0.44) 45%, rgba(0,0,0,0) 72%)',
    textColor: 'text-sky-300',
  },
  {
    id: 'settings',
    title: 'CONFIGURAÇÕES',
    subtitle: 'Terreno da Arena, Áudio e Sistema',
    badge: 'AJUSTES',
    imageUrl: UI_ASSETS.logoConfig,
    glowGradient:
      'radial-gradient(circle, rgba(59,130,246,0.82) 0%, rgba(14,165,233,0.45) 45%, rgba(0,0,0,0) 72%)',
    textColor: 'text-cyan-300',
  },
];

const AMBIENT_SPARKS = [
  { left: '16%', bottom: '18%', delay: '0s', size: 'w-1.5 h-1.5', color: 'bg-amber-300' },
  { left: '34%', bottom: '12%', delay: '1.2s', size: 'w-1 h-1', color: 'bg-sky-300' },
  { left: '62%', bottom: '15%', delay: '2.4s', size: 'w-1.5 h-1.5', color: 'bg-orange-400' },
  { left: '80%', bottom: '22%', delay: '0.8s', size: 'w-1 h-1', color: 'bg-amber-200' },
  { left: '48%', bottom: '8%', delay: '3.1s', size: 'w-1.5 h-1.5', color: 'bg-cyan-300' },
];

export function TitleScreen({
  terrains,
  selectedTerrainId,
  heroProfile,
  onSelectTerrain,
  onStartMatch,
  onOpenCampaign,
  onOpenDeck,
  onOpenHeroConfig,
  onOpenHeroShop,
}: TitleScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [modal, setModal] = useState<'settings' | null>(null);
  const [soundOn, setSoundOn] = useState(isSfxEnabled());
  const [musicOn, setMusicOn] = useState(isMusicEnabled());

  const heroSkin =
    HERO_SKINS.find((s) => s.id === heroProfile.build.skinId) ?? HERO_SKINS[0];
  const heroFrame =
    HERO_FRAMES.find((f) => f.id === heroProfile.build.frameId) ?? HERO_FRAMES[0];
  const equippedItems = getEquippedItemsList(heroProfile.build);
  const activeSets = getActiveSetBonuses(heroProfile.build);

  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef<number>(0);

  const previewTerrain =
    selectedTerrainId === 'random'
      ? terrains[0]
      : terrains.find((t) => t.id === selectedTerrainId) ?? terrains[0];

  const activeMenu = MENU_ITEMS[activeIndex];

  const goPrev = () => {
    sfx.swipe();
    setActiveIndex(
      (prev) => (prev - 1 + MENU_ITEMS.length) % MENU_ITEMS.length
    );
  };

  const goNext = () => {
    sfx.swipe();
    setActiveIndex((prev) => (prev + 1) % MENU_ITEMS.length);
  };

  const handleActivateMenu = (item: MenuItemConfig) => {
    sfx.click();
    if (item.id === 'battle') {
      onStartMatch();
      return;
    }
    if (item.id === 'campaign') {
      onOpenCampaign();
      return;
    }
    if (item.id === 'deck') {
      onOpenDeck();
      return;
    }
    if (item.id === 'market') {
      onOpenHeroShop();
      return;
    }
    setModal(item.id);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    dragDeltaX.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    dragDeltaX.current = e.clientX - dragStartX.current;
  };

  const handlePointerUp = () => {
    if (dragStartX.current === null) return;
    const delta = dragDeltaX.current;
    dragStartX.current = null;
    dragDeltaX.current = 0;
    if (Math.abs(delta) > 38) {
      if (delta < 0) goNext();
      else goPrev();
    }
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSfxEnabled(next);
    if (next) sfx.click();
  };

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
    sfx.click();
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950">
      {/* Background Terrain */}
      <img
        src={previewTerrain.imageUrl}
        alt={previewTerrain.name}
        className="absolute inset-0 w-full h-full object-cover scale-105 opacity-85 transition-all duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/82 via-slate-950/35 to-slate-950/95" />

      {/* Ambient Floating Runic Embers */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        {AMBIENT_SPARKS.map((sp, i) => (
          <span
            key={i}
            style={{
              left: sp.left,
              bottom: sp.bottom,
              animationDelay: sp.delay,
            }}
            className={`absolute rounded-full blur-[0.5px] animate-float-particle ${sp.size} ${sp.color}`}
          />
        ))}
      </div>

      {/* TOP: Smaller Game Logo at the Top + Quick Audio & Arena Controls */}
      <header className="relative z-20 flex flex-col items-center pt-3 px-4">
        <div className="w-full flex justify-between items-center text-[10px] font-runic font-bold tracking-widest uppercase text-amber-200 mb-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMusic}
              title="Ativar / Desativar Músicas de Fundo"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full hud-stone-bar border border-amber-500/60 text-outline-sm hover:border-amber-300 cursor-pointer"
            >
              <Music
                className={[
                  'w-3 h-3',
                  musicOn ? 'text-emerald-300' : 'text-slate-500',
                ].join(' ')}
              />
              <span>{musicOn ? 'MUS' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={toggleSound}
              title="Ativar / Desativar Efeitos Sonoros"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full hud-stone-bar border border-amber-500/60 text-outline-sm hover:border-amber-300 cursor-pointer"
            >
              {soundOn ? (
                <Volume2 className="w-3 h-3 text-emerald-300" />
              ) : (
                <VolumeX className="w-3 h-3 text-slate-400" />
              )}
              <span>{soundOn ? 'SFX' : 'OFF'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              sfx.click();
              setModal('settings');
            }}
            className="px-2.5 py-0.5 rounded-full hud-stone-bar border border-slate-400/70 text-outline-sm hover:border-amber-400 cursor-pointer"
          >
            {selectedTerrainId === 'random'
              ? 'Arena: Aleatória'
              : `Arena: ${previewTerrain.biome}`}
          </button>
        </div>

        {/* HERO CARD (replaces static logo — click to configure hero, skins, frames & 4 item slots) */}
        <button
          type="button"
          onClick={() => {
            sfx.click();
            onOpenHeroConfig();
          }}
          className="mt-1.5 w-full max-w-[390px] rounded-2xl border border-amber-500/45 bg-slate-950/75 hover:bg-slate-900/85 hover:border-amber-300 backdrop-blur-md px-3 py-2 flex items-center gap-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.85)] transition cursor-pointer active:scale-[0.99]"
        >
          <div
            className={`relative w-14 h-14 shrink-0 rounded-full flex items-center justify-center ${heroFrame.glowClass}`}
          >
            <div className="absolute inset-[17%] rounded-full overflow-hidden bg-slate-950">
              <AssetImg
                src={heroSkin.imageUrl}
                alt={heroProfile.build.heroName}
                className="w-full h-full object-cover"
                fallback={null}
              />
            </div>
            <AssetImg
              src={heroFrame.imageUrl}
              alt={heroFrame.name}
              className="relative z-10 w-full h-full object-contain pointer-events-none"
              fallback={null}
            />
          </div>

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between gap-1.5">
              <span className="font-display text-xs sm:text-sm text-amber-200 truncate text-outline-sm">
                {heroProfile.build.heroName}
              </span>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/50 text-[9px] font-runic text-amber-200 shrink-0">
                <Coins className="w-2.5 h-2.5 text-amber-300" />
                {heroProfile.gold}
              </span>
            </div>

            <div className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-slate-300">
              <span>{equippedItems.length}/4 Itens</span>
              <span>·</span>
              {activeSets.length > 0 ? (
                <span className="text-emerald-300 font-semibold flex items-center gap-0.5 truncate">
                  <Flame className="w-3 h-3 text-orange-400 shrink-0" />
                  {activeSets.map((s) => s.collection.name).join(', ')}
                </span>
              ) : (
                <span className="text-slate-400 truncate">
                  Toque para montar build
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-200">
            <Settings2 className="w-3.5 h-3.5" />
          </div>
        </button>
      </header>

      {/* CENTER: Giant Swipeable Menu Emblem Carousel with Levitation & Backlight Glow */}
      <div
        className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 select-none touch-pan-y"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Carousel Row with Left/Right Sculpted Arrow Icons (icon_seta.png) & Giant Center Emblem */}
        <div className="relative w-full flex items-center justify-center">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Menu anterior"
            className="absolute left-0 z-30 w-13 h-13 flex items-center justify-center hover:scale-110 active:scale-90 transition cursor-pointer"
          >
            <AssetImg
              src={UI_ASSETS.iconSeta}
              alt="Anterior"
              className="w-full h-full object-contain -scale-x-100 drop-shadow-[0_6px_14px_rgba(0,0,0,0.95)]"
              fallback={<ChevronLeft className="w-7 h-7 text-amber-300" />}
            />
          </button>

          {/* Giant Emblem Button with Intense Backlight Glow */}
          <div className="relative flex flex-col items-center justify-center">
            <div
              className="pointer-events-none absolute -inset-9 rounded-full blur-2xl opacity-95 animate-pulse transition-all duration-500"
              style={{ background: activeMenu.glowGradient }}
            />
            <div
              className="pointer-events-none absolute -inset-3 rounded-full blur-xl opacity-85 transition-all duration-500"
              style={{ background: activeMenu.glowGradient }}
            />

            <button
              key={activeMenu.id}
              type="button"
              onClick={() => handleActivateMenu(activeMenu)}
              className="group relative w-60 h-60 sm:w-68 sm:h-68 flex items-center justify-center animate-emblem-float hover:scale-[1.05] active:scale-95 transition-transform cursor-pointer"
            >
              <AssetImg
                src={activeMenu.imageUrl}
                alt={activeMenu.title}
                className="w-full h-full object-contain drop-shadow-[0_18px_36px_rgba(0,0,0,0.95)]"
                fallback={
                  <div className="w-56 h-56 rounded-full hud-stone-bar border-4 border-amber-400 flex items-center justify-center">
                    <Swords className="w-16 h-16 text-amber-300" />
                  </div>
                }
              />
            </button>
          </div>

          <button
            type="button"
            onClick={goNext}
            aria-label="Próximo menu"
            className="absolute right-0 z-30 w-13 h-13 flex items-center justify-center hover:scale-110 active:scale-90 transition cursor-pointer"
          >
            <AssetImg
              src={UI_ASSETS.iconSeta}
              alt="Próximo"
              className="w-full h-full object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.95)]"
              fallback={<ChevronRight className="w-7 h-7 text-amber-300" />}
            />
          </button>
        </div>

        {/* Properly Scaled Active Menu CTA Plate (dialog_header_plate.png) */}
        <button
          type="button"
          onClick={() => handleActivateMenu(activeMenu)}
          className="group relative mt-2 w-full max-w-[360px] h-[74px] flex items-center justify-center hover:brightness-115 active:scale-95 transition cursor-pointer"
        >
          <AssetImg
            src={UI_ASSETS.dialogHeaderPlate}
            alt=""
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-auto drop-shadow-[0_10px_22px_rgba(0,0,0,0.95)]"
            fallback={
              <div className="absolute inset-0 rounded-2xl runic-dialog-panel border-2 border-amber-400" />
            }
          />
          <span
            className={[
              'relative z-10 px-14 font-display text-outline leading-none text-center whitespace-nowrap',
              activeMenu.title.length > 10
                ? 'text-base sm:text-lg tracking-[0.06em]'
                : 'text-xl sm:text-2xl tracking-[0.12em]',
              activeMenu.textColor,
            ].join(' ')}
          >
            {activeMenu.title}
          </span>
        </button>
      </div>

      {/* BOTTOM: 5 Clean Mini-Emblems */}
      <footer className="relative z-20 px-4 pb-5 pt-1 flex items-center justify-center">
        <div className="grid grid-cols-5 gap-1 w-full">
          {MENU_ITEMS.map((item, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (idx === activeIndex) {
                    handleActivateMenu(item);
                  } else {
                    sfx.swipe();
                    setActiveIndex(idx);
                  }
                }}
                className={[
                  'relative py-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 cursor-pointer',
                  isSelected
                    ? 'scale-110 -translate-y-1 opacity-100'
                    : 'opacity-65 hover:opacity-100 hover:scale-105',
                ].join(' ')}
              >
                {isSelected && (
                  <div
                    className="pointer-events-none absolute -inset-1 rounded-full blur-md opacity-80"
                    style={{ background: item.glowGradient }}
                  />
                )}
                <AssetImg
                  src={item.imageUrl}
                  alt={item.title}
                  className={[
                    'relative z-10 w-11 h-11 object-contain transition',
                    isSelected
                      ? 'drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]'
                      : 'drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]',
                  ].join(' ')}
                  fallback={null}
                />
                <span
                  className={[
                    'relative z-10 font-runic text-[8.5px] font-black tracking-wider truncate w-full text-center text-outline-sm',
                    isSelected ? item.textColor : 'text-amber-100/90',
                  ].join(' ')}
                >
                  {item.title === 'CONFIGURAÇÕES' ? 'CONFIG.' : item.title}
                </span>
              </button>
            );
          })}
        </div>
      </footer>

      {/* MODAL: CONFIGURAÇÕES */}
      {modal === 'settings' && (
        <RunicDialog
          title="Configurações"
          variant="main"
          onClose={() => setModal(null)}
        >
          <div className="flex-1 flex flex-col justify-between gap-3">
            <div className="space-y-3">
              {/* Music Toggle */}
              <div className="flex items-center justify-between bg-black/45 border border-slate-700/80 rounded-xl p-2.5">
                <div className="flex items-center gap-2">
                  <Music
                    className={[
                      'w-4 h-4 shrink-0',
                      musicOn ? 'text-emerald-300' : 'text-slate-500',
                    ].join(' ')}
                  />
                  <div>
                    <div className="text-xs font-display font-black text-amber-200">
                      Músicas de Fundo
                    </div>
                    <div className="text-[9.5px] text-slate-300">
                      Trilha nos menus e batalha
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleMusic}
                  className={[
                    'px-2.5 py-1 rounded-lg border font-runic font-black text-[9.5px] transition cursor-pointer',
                    musicOn
                      ? 'bg-emerald-600/35 border-emerald-400 text-emerald-200'
                      : 'bg-slate-800 border-slate-600 text-slate-400',
                  ].join(' ')}
                >
                  {musicOn ? 'TOCANDO' : 'DESATIVADA'}
                </button>
              </div>

              {/* Audio Toggle */}
              <div className="flex items-center justify-between bg-black/45 border border-slate-700/80 rounded-xl p-2.5">
                <div className="flex items-center gap-2">
                  {soundOn ? (
                    <Volume2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-display font-black text-amber-200">
                      Efeitos Sonoros (SFX)
                    </div>
                    <div className="text-[9.5px] text-slate-300">
                      Cliques, ataques e habilidades
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleSound}
                  className={[
                    'px-2.5 py-1 rounded-lg border font-runic font-black text-[9.5px] transition cursor-pointer',
                    soundOn
                      ? 'bg-emerald-600/35 border-emerald-400 text-emerald-200'
                      : 'bg-slate-800 border-slate-600 text-slate-400',
                  ].join(' ')}
                >
                  {soundOn ? 'ATIVADO' : 'DESATIVADO'}
                </button>
              </div>

              {/* Terrain Selector */}
              <div>
                <div className="text-[10px] font-runic font-bold uppercase tracking-wider text-amber-200 mb-2">
                  Terreno da Arena (Batalha)
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      onSelectTerrain('random');
                    }}
                    className={[
                      'rounded-lg border p-2 flex flex-col items-center justify-center gap-1 text-[9.5px] font-bold transition cursor-pointer h-14',
                      selectedTerrainId === 'random'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200 ring-1 ring-amber-400'
                        : 'border-slate-700 bg-slate-950/90 text-slate-300 hover:border-slate-500',
                    ].join(' ')}
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>Aleatório</span>
                  </button>

                  {terrains.map((t) => {
                    const active = selectedTerrainId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          sfx.click();
                          onSelectTerrain(t.id);
                        }}
                        className={[
                          'relative rounded-lg border overflow-hidden h-14 transition cursor-pointer',
                          active
                            ? 'border-amber-400 ring-2 ring-amber-400/70'
                            : 'border-slate-700 opacity-75 hover:opacity-100',
                        ].join(' ')}
                      >
                        <img
                          src={t.imageUrl}
                          alt={t.biome}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/85 text-[8.5px] font-bold text-white py-0.5 text-center">
                          {t.biome}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <RunicButton size="sm" onClick={() => setModal(null)}>
              SALVAR E VOLTAR
            </RunicButton>
          </div>
        </RunicDialog>
      )}
    </div>
  );
}
