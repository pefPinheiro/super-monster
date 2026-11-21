import {
  PRECEDENCE_META,
  canUseActiveSkill,
  getActiveSkill,
  type BoardMonster,
  type PrecedenceRelation,
} from '@super-monster/game-engine';
import { Clock, Lock, Shield, Sparkles } from 'lucide-react';
import { AssetImg } from './AssetImg';

export type CardMotionEffect =
  | 'enter'
  | 'lunge-up'
  | 'lunge-down'
  | 'hit'
  | 'skill'
  | 'heal'
  | null;

interface MonsterCardProps {
  monster: BoardMonster;
  effectiveAtk: number;
  effectiveVel: number;
  isPlayerSide: boolean;
  isSelected?: boolean;
  isSelectable?: boolean;
  isTargetable?: boolean;
  precedencePreview?: PrecedenceRelation | null;
  motionEffect?: CardMotionEffect;
  onClick?: () => void;
}

const CRYSTAL_STYLES = {
  furia:
    'bg-gradient-to-b from-red-400 via-red-600 to-red-900 border-red-200 shadow-red-500/70',
  astucia:
    'bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-900 border-emerald-200 shadow-emerald-500/70',
  arcano:
    'bg-gradient-to-b from-sky-400 via-blue-600 to-blue-900 border-sky-200 shadow-blue-500/70',
};

const ART_BG_STYLES = {
  furia: 'from-red-950/90 via-slate-900/90 to-orange-950/80',
  astucia: 'from-emerald-950/90 via-slate-900/90 to-teal-950/80',
  arcano: 'from-blue-950/90 via-slate-900/90 to-indigo-950/80',
};

export function MonsterCard({
  monster,
  effectiveAtk,
  effectiveVel,
  isPlayerSide,
  isSelected = false,
  isSelectable = false,
  isTargetable = false,
  precedencePreview = null,
  motionEffect = null,
  onClick,
}: MonsterCardProps) {
  const { card } = monster;
  const activeSkill = getActiveSkill(monster);
  const activeReady = canUseActiveSkill(monster);
  const hpPct = Math.max(
    0,
    Math.min(100, (monster.currentHp / monster.maxHp) * 100)
  );
  const isDimmed = monster.status === 'acted' || monster.status === 'waiting';

  const motionClass =
    motionEffect === 'enter'
      ? 'animate-card-enter'
      : motionEffect === 'lunge-up'
        ? 'animate-card-lunge-up z-30'
        : motionEffect === 'lunge-down'
          ? 'animate-card-lunge-down z-30'
          : motionEffect === 'hit'
            ? 'animate-card-hit z-20'
            : motionEffect === 'skill'
              ? 'animate-card-skill z-30'
              : motionEffect === 'heal'
                ? 'animate-card-heal z-20'
                : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative w-full aspect-[3/4.2] rounded-xl border-2 p-1 flex flex-col justify-between transition-all duration-200 card-frame text-left ring-1 ring-black/90',
        motionClass,
        isSelected
          ? 'border-amber-400 -translate-y-1.5 scale-[1.03] shadow-[0_0_22px_rgba(251,191,36,0.8)] z-20'
          : isTargetable
            ? 'border-red-400 ring-2 ring-red-500/80 hover:scale-[1.03] cursor-pointer z-10'
            : isSelectable
              ? 'border-amber-300/85 animate-ready-glow hover:-translate-y-1 cursor-pointer'
              : 'border-slate-500/90',
        isDimmed && !isTargetable ? 'opacity-65 saturate-50' : '',
      ].join(' ')}
    >
      {/* Precedence Crystal at Top Center */}
      <div
        title={`Precedência: ${PRECEDENCE_META[card.precedence].label}`}
        className={[
          'absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rotate-45 rounded-[3px] border-2 shadow-md z-20',
          CRYSTAL_STYLES[card.precedence],
        ].join(' ')}
      />

      {/* Shield Badge */}
      {monster.shield > 0 && (
        <div className="absolute -top-2 -right-1.5 z-20 flex items-center gap-0.5 rounded-full bg-sky-600 border border-sky-200 px-1.5 py-0.5 text-[10px] font-black text-white shadow text-outline-sm">
          <Shield className="w-2.5 h-2.5" />
          {monster.shield}
        </div>
      )}

      {/* Active Skill Indicator */}
      {activeSkill && (
        <div
          title={activeSkill.name}
          className={[
            'absolute -top-2 -left-1.5 z-20 flex items-center justify-center w-5 h-5 rounded-full border text-[9px] font-black shadow',
            activeReady
              ? 'bg-amber-400 border-amber-100 text-slate-950'
              : 'bg-slate-800 border-slate-500 text-slate-300',
          ].join(' ')}
        >
          {activeReady ? <Sparkles className="w-3 h-3" /> : monster.activeCooldown}
        </div>
      )}

      {/* Precedence Preview Badge when Targeting */}
      {isTargetable && precedencePreview && precedencePreview !== 'neutral' && (
        <div
          className={[
            'absolute top-2.5 left-1/2 -translate-x-1/2 z-30 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide shadow-md whitespace-nowrap',
            precedencePreview === 'advantage'
              ? 'bg-emerald-500 text-slate-950 border border-emerald-200'
              : 'bg-rose-600 text-white border border-rose-300',
          ].join(' ')}
        >
          {precedencePreview === 'advantage' ? '+50% Vantagem' : '-25% Resist.'}
        </div>
      )}

      {/* Monster Artwork Container with Clean Dark Contour */}
      <div
        className={[
          'relative w-full flex-1 rounded-md overflow-hidden border border-slate-900 ring-1 ring-slate-600/60 bg-gradient-to-b flex flex-col items-center justify-center',
          ART_BG_STYLES[card.precedence],
        ].join(' ')}
      >
        <AssetImg
          src={card.artUrl}
          alt={card.name}
          className="w-full h-full object-cover"
          fallback={
            <span className="text-3xl sm:text-4xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              {card.emojiFallback}
            </span>
          }
        />

        {/* Monster Name Plate with Crisp Outline */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-1 pt-3 pb-0.5 text-center">
          <div className="text-[9.5px] font-extrabold leading-tight text-white truncate text-outline-sm">
            {card.name}
          </div>
          <div className="text-[7.5px] font-semibold text-slate-300 truncate text-outline-sm">
            {card.monsterType}
          </div>
        </div>

        {/* Status Overlay (Acted / Waiting) */}
        {isPlayerSide && monster.status === 'acted' && (
          <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center">
            <span className="flex items-center gap-0.5 rounded bg-slate-950/90 border border-slate-500 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-200">
              <Lock className="w-2.5 h-2.5" /> AGIU
            </span>
          </div>
        )}
        {monster.status === 'waiting' && (
          <div className="absolute inset-0 bg-sky-950/60 flex items-center justify-center">
            <span className="flex items-center gap-0.5 rounded bg-sky-950/95 border border-sky-400 px-1.5 py-0.5 text-[8.5px] font-extrabold text-sky-200">
              <Clock className="w-2.5 h-2.5" /> ESPERA
            </span>
          </div>
        )}
      </div>

      {/* Mini HP Bar */}
      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden my-0.5 border border-black/80">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-all duration-300"
          style={{ width: `${hpPct}%` }}
        />
      </div>

      {/* 3 Bottom Seals: ATK | HP | VEL */}
      <div className="grid grid-cols-3 gap-0.5 text-center">
        <div className="rounded bg-red-950/95 border border-red-600/80 py-0.5 shadow-inner">
          <div className="text-[7px] font-extrabold text-red-300 leading-none">
            ATK
          </div>
          <div className="text-[11px] font-black text-white leading-tight text-outline-sm">
            {effectiveAtk}
          </div>
        </div>
        <div className="rounded bg-emerald-950/95 border border-emerald-600/80 py-0.5 shadow-inner">
          <div className="text-[7px] font-extrabold text-emerald-300 leading-none">
            HP
          </div>
          <div className="text-[11px] font-black text-white leading-tight text-outline-sm">
            {monster.currentHp}
          </div>
        </div>
        <div className="rounded bg-sky-950/95 border border-sky-600/80 py-0.5 shadow-inner">
          <div className="text-[7px] font-extrabold text-sky-300 leading-none">
            VEL
          </div>
          <div className="text-[11px] font-black text-white leading-tight text-outline-sm">
            {effectiveVel}
          </div>
        </div>
      </div>
    </button>
  );
}
