import { Play, ScrollText, Skull } from 'lucide-react';
import { useEffect, useState } from 'react';
import { UI_ASSETS } from '../assets/assetPaths';
import { sfx } from '../utils/sfx';
import { AssetImg } from './AssetImg';

interface TopHudProps {
  round: number;
  enemyName: string;
  enemyRemaining: number;
  enemyMaxTotal: number;
  enemyOnBoard: number;
  playerVel: number;
  enemyVel: number;
  playerReadyCount: number;
  enemyReadyCount: number;
  activeSide: 'player' | 'enemy';
  initiativeSide: 'player' | 'enemy';
  isAuto: boolean;
  onToggleAuto: () => void;
  onOpenLog: () => void;
}

export function TopHud({
  round,
  enemyName,
  enemyRemaining,
  enemyMaxTotal,
  enemyOnBoard,
  playerVel,
  enemyVel,
  playerReadyCount,
  enemyReadyCount,
  activeSide,
  initiativeSide,
  isAuto,
  onToggleAuto,
  onOpenLog,
}: TopHudProps) {
  const [velChanged, setVelChanged] = useState(false);

  useEffect(() => {
    setVelChanged(true);
    const t = setTimeout(() => setVelChanged(false), 700);
    return () => clearTimeout(t);
  }, [playerVel, enemyVel]);

  return (
    <header className="relative z-30 flex flex-col">
      {/* Compact, Sleek Top Bar: Enemy Info (Top-Left) + AUTO & LOG Side-by-Side (Top-Right) */}
      <div className="hud-stone-bar border-b-2 border-amber-600/45 px-3 py-1.5 flex items-center justify-between gap-2 shadow-[0_6px_18px_rgba(0,0,0,0.85)]">
        {/* Top-Left: Enemy Portrait + Name + Round/Cards */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={[
              'relative w-12 h-12 shrink-0 flex items-center justify-center transition-all duration-300',
              activeSide === 'enemy'
                ? 'scale-108 drop-shadow-[0_0_14px_rgba(239,68,68,0.95)]'
                : 'drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]',
            ].join(' ')}
          >
            <div className="absolute inset-[19%] rounded-full overflow-hidden bg-slate-950">
              <AssetImg
                src={UI_ASSETS.heroEnemy}
                alt={enemyName}
                className="w-full h-full object-cover"
                fallback={<Skull className="w-5 h-5 text-red-400 m-auto" />}
              />
            </div>
            <AssetImg
              src={UI_ASSETS.hudPortraitFrameEnemy}
              alt="Moldura do Inimigo"
              className="pointer-events-none relative z-10 w-full h-full object-contain"
              fallback={null}
            />
          </div>

          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-xs sm:text-[13px] text-amber-100 truncate text-outline-sm tracking-wide">
                {enemyName}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-400/70 font-runic text-[8.5px] text-amber-200 shrink-0 text-outline-sm">
                R{round}/30
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={[
                  'px-2 py-0.2 rounded-full font-runic text-[8.5px] uppercase tracking-wider text-outline-sm shrink-0 transition-all',
                  activeSide === 'player'
                    ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/90 shadow-[0_0_8px_rgba(16,185,129,0.55)]'
                    : 'bg-red-500/35 text-red-200 border border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.75)] animate-pulse',
                ].join(' ')}
              >
                {activeSide === 'player'
                  ? `★ SUA VEZ (${playerReadyCount} pronto${playerReadyCount === 1 ? '' : 's'})`
                  : `⚔ INIMIGO (${enemyReadyCount} pronto${enemyReadyCount === 1 ? '' : 's'})`}
              </span>
              <span className="text-[9px] font-bold text-slate-200 text-outline-sm whitespace-nowrap">
                {enemyRemaining}/{enemyMaxTotal}
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right: AUTO & LOG Side by Side */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              sfx.click();
              onToggleAuto();
            }}
            title="Modo Automático (AUTO)"
            className={[
              'relative w-10 h-10 flex items-center justify-center rounded-lg transition cursor-pointer',
              isAuto
                ? 'ring-2 ring-emerald-400 brightness-125 shadow-[0_0_14px_rgba(16,185,129,0.9)]'
                : 'hover:brightness-115 active:scale-90',
            ].join(' ')}
          >
            <AssetImg
              src={UI_ASSETS.hudBtnAuto}
              alt="AUTO"
              className="w-10 h-10 object-contain drop-shadow"
              fallback={
                <span className="flex items-center justify-center w-8 h-8 rounded bg-slate-800 border border-slate-600 text-amber-300">
                  <Play className="w-3.5 h-3.5 fill-current" />
                </span>
              }
            />
            <span
              className={[
                'absolute -bottom-0.5 inset-x-0 text-center text-[7px] font-runic tracking-wider text-outline-sm',
                isAuto ? 'text-emerald-300' : 'text-amber-200',
              ].join(' ')}
            >
              AUTO
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sfx.click();
              onOpenLog();
            }}
            title="Registro de Combate & Regras"
            className="relative w-10 h-10 flex items-center justify-center hover:brightness-115 active:scale-90 transition cursor-pointer"
          >
            <AssetImg
              src={UI_ASSETS.hudBtnLog}
              alt="Registro"
              className="w-10 h-10 object-contain drop-shadow"
              fallback={
                <span className="flex items-center justify-center w-8 h-8 rounded bg-slate-800 border border-slate-600 text-slate-200">
                  <ScrollText className="w-3.5 h-3.5" />
                </span>
              }
            />
            <span className="absolute -bottom-0.5 inset-x-0 text-center text-[7px] font-runic tracking-wider text-slate-200 text-outline-sm">
              LOG
            </span>
          </button>
        </div>
      </div>

      {/* Centered Larger Winged Speed Banner (hud_vel_banner.png) directly above enemy cards */}
      <div className="relative z-20 -mb-2 pt-1 flex items-center justify-center pointer-events-none select-none">
        <div
          className={[
            'relative w-[178px] h-[66px] flex items-center justify-center transition-transform',
            velChanged ? 'animate-vel-pulse' : '',
          ].join(' ')}
        >
          <AssetImg
            src={UI_ASSETS.hudVelBanner}
            alt="Velocidade"
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-auto drop-shadow-[0_6px_16px_rgba(56,189,248,0.55)]"
            fallback={
              <div className="absolute inset-0 rounded-xl runic-dialog-panel border border-sky-400" />
            }
          />

          {/* Twin Speed Values inside the Left (Player) and Right (Enemy) panels */}
          <div className="relative z-10 w-[63%] grid grid-cols-2 items-center text-center pt-0.5">
            <div className="flex flex-col items-center leading-none">
              <span className="text-[7px] font-runic text-emerald-300 text-outline-sm">
                {initiativeSide === 'player' ? '1º VOCÊ' : 'VOCÊ'}
              </span>
              <span
                className={[
                  'font-display text-base text-outline mt-0.5',
                  playerVel >= enemyVel ? 'text-emerald-300' : 'text-slate-100',
                ].join(' ')}
              >
                {playerVel}
              </span>
            </div>

            <div className="flex flex-col items-center leading-none">
              <span className="text-[7px] font-runic text-rose-300 text-outline-sm">
                {initiativeSide === 'enemy' ? '1º INIM.' : 'INIM.'}
              </span>
              <span
                className={[
                  'font-display text-base text-outline mt-0.5',
                  enemyVel > playerVel ? 'text-rose-400' : 'text-slate-200',
                ].join(' ')}
              >
                {enemyVel}
              </span>
            </div>
          </div>
        </div>
        <span className="-mt-2.5 px-2 py-0.2 rounded-full bg-slate-950/90 border border-sky-400/60 font-runic text-[7.5px] tracking-wider text-sky-200 text-outline-sm shadow">
          {playerVel === enemyVel
            ? `VEL EMPATADA • ${initiativeSide === 'player' ? 'VOCÊ COMEÇA' : 'INIMIGO COMEÇA'}`
            : initiativeSide === 'player'
              ? 'VEL MAIOR: VOCÊ COMEÇA'
              : 'VEL MAIOR: INIMIGO COMEÇA'}
        </span>
      </div>
    </header>
  );
}
