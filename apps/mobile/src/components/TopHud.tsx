import { Pause, Play, RotateCcw, ScrollText, Skull } from 'lucide-react';
import { UI_ASSETS } from '../assets/assetPaths';
import { AssetImg } from './AssetImg';

interface TopHudProps {
  round: number;
  enemyName: string;
  enemyRemaining: number;
  enemyMaxTotal: number;
  enemyOnBoard: number;
  playerVel: number;
  enemyVel: number;
  activeSide: 'player' | 'enemy';
  isAuto: boolean;
  onToggleAuto: () => void;
  onOpenLog: () => void;
  onRestart: () => void;
  onPause: () => void;
}

export function TopHud({
  round,
  enemyName,
  enemyRemaining,
  enemyMaxTotal,
  enemyOnBoard,
  playerVel,
  enemyVel,
  activeSide,
  isAuto,
  onToggleAuto,
  onOpenLog,
  onRestart,
  onPause,
}: TopHudProps) {
  const pct = Math.max(0, Math.min(100, (enemyRemaining / enemyMaxTotal) * 100));

  return (
    <header className="relative z-30 hud-stone-bar border-b-2 px-2 py-2">
      <div className="flex items-center justify-between gap-1.5">
        {/* Left System Controls: AUTO + Log */}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={onToggleAuto}
            className={[
              'flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-[10px] font-extrabold tracking-wide transition cursor-pointer',
              isAuto
                ? 'bg-emerald-600 border-emerald-300 text-white shadow-[0_0_10px_rgba(16,185,129,0.7)]'
                : 'bg-slate-800/90 border-slate-600 text-slate-200 hover:bg-slate-700',
            ].join(' ')}
          >
            <Play className="w-3 h-3 fill-current" />
            AUTO
          </button>
          <button
            type="button"
            onClick={onOpenLog}
            title="Registro de Combate"
            className="flex items-center justify-center gap-1 rounded-md bg-slate-800/90 border border-slate-600 px-2 py-1 text-[10px] font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            <ScrollText className="w-3 h-3" />
            LOG
          </button>
        </div>

        {/* Center: Enemy Portrait + Runic Axe Bar (Cartas Restantes) + Round */}
        <div className="flex-1 flex flex-col items-center gap-1 px-2 py-0.5">
          <div className="w-full flex items-center gap-2">
            <div className="w-11 h-11 shrink-0 rounded-full overflow-hidden bg-gradient-to-b from-slate-700 to-slate-950 border-2 border-red-500/90 ring-1 ring-black flex items-center justify-center shadow-lg">
              <AssetImg
                src={UI_ASSETS.heroEnemy}
                alt={enemyName}
                className="w-full h-full object-cover"
                fallback={<Skull className="w-5 h-5 text-red-400" />}
              />
            </div>

            {/* Runic Axe Bar showing Enemy Monsters Remaining (No Player HP!) */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] font-bold mb-0.5">
                <span className="text-slate-100 truncate font-display text-outline-sm">
                  {enemyName}
                </span>
                <span className="text-amber-300 font-black text-outline-sm">
                  {enemyRemaining}/{enemyMaxTotal} Cartas
                </span>
              </div>
              <div className="relative h-4 w-full rounded-r-full rounded-l-sm bg-slate-950 border-2 border-slate-500 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-red-700 via-red-500 to-amber-500 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[8.5px] font-black tracking-wider text-white text-outline-sm">
                  {enemyOnBoard} EM CAMPO • {Math.max(0, enemyRemaining - enemyOnBoard)} REFORÇOS
                </span>
              </div>
            </div>
          </div>

          {/* Round & Initiative Strip */}
          <div className="flex items-center gap-2 text-[10px]">
            <span className="font-display font-extrabold tracking-widest text-amber-300 bg-slate-950/90 border border-amber-500/50 rounded-full px-2.5 py-0.5 text-outline-sm">
              ROUND {round}
            </span>
            <span className="text-sky-300 font-extrabold text-outline-sm">
              VEL {playerVel} vs {enemyVel}
            </span>
            <span
              className={[
                'px-1.5 py-0.5 rounded font-extrabold text-[9px] uppercase text-outline-sm',
                activeSide === 'player'
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50'
                  : 'bg-red-500/25 text-red-300 border border-red-400/50',
              ].join(' ')}
            >
              {activeSide === 'player' ? 'Sua Vez' : 'Inimigo'}
            </span>
          </div>
        </div>

        {/* Right System Controls: Restart + Pause */}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={onRestart}
            title="Reiniciar Partida"
            className="flex items-center justify-center rounded-md bg-slate-800/90 border border-slate-600 p-1.5 text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onPause}
            title="Pausar / Regras"
            className="flex items-center justify-center rounded-md bg-slate-800/90 border border-slate-600 p-1.5 text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
