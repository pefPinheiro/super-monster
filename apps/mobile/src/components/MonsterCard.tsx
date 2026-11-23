import {
  PRECEDENCE_META,
  canUseActiveSkill,
  getActiveSkill,
  type BoardMonster,
  type PrecedenceRelation,
} from '@super-monster/game-engine';
import { Clock, Info, Lock, Shield, Sparkles, Swords } from 'lucide-react';
import { CRYSTAL_ASSETS, UI_ASSETS } from '../assets/assetPaths';
import { sfx } from '../utils/sfx';
import { AssetImg } from './AssetImg';

export type CardMotionEffect =
  | 'enter'
  | 'lunge-up'
  | 'lunge-down'
  | 'hit-attack'
  | 'hit-damage'
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
  isAllyTargetable?: boolean;
  isNextInQueue?: boolean;
  isLastSource?: boolean;
  isLastTarget?: boolean;
  precedencePreview?: PrecedenceRelation | null;
  motionEffect?: CardMotionEffect;
  onClick?: () => void;
  onInspect?: () => void;
}

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
  isAllyTargetable = false,
  isNextInQueue = false,
  isLastSource = false,
  isLastTarget = false,
  precedencePreview = null,
  motionEffect = null,
  onClick,
  onInspect,
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
          : motionEffect === 'hit-attack' || motionEffect === 'hit-damage'
            ? 'animate-card-hit z-20'
            : motionEffect === 'skill'
              ? 'animate-card-skill z-30'
              : motionEffect === 'heal'
                ? 'animate-card-heal z-20'
                : '';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={[
        'relative w-full aspect-[3/4.15] rounded-xl flex flex-col justify-between transition-all duration-200 text-left select-none',
        motionClass,
        isSelected
          ? '-translate-y-2 scale-[1.05] drop-shadow-[0_0_20px_rgba(251,191,36,0.95)] z-20'
          : isAllyTargetable
            ? 'ring-2 ring-cyan-400 rounded-xl hover:scale-[1.04] shadow-[0_0_16px_rgba(34,211,238,0.8)] cursor-pointer z-20'
            : isTargetable
              ? 'ring-2 ring-red-500 rounded-xl hover:scale-[1.04] shadow-[0_0_16px_rgba(239,68,68,0.65)] cursor-pointer z-10'
              : isSelectable
                ? 'animate-ready-glow hover:-translate-y-1 cursor-pointer'
                : '',
        isDimmed && !isTargetable && !isAllyTargetable
          ? 'opacity-65 saturate-50'
          : '',
      ].join(' ')}
    >
      {/* 1. Inner Monster Artwork Layer (sits behind the transparent window of card_frame.png) */}
      <div
        className={[
          'absolute inset-[9%] rounded-md overflow-hidden bg-gradient-to-b flex flex-col items-center justify-center',
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

        {/* 1. Direct Attack VFX: Semi-transparent Red Claw (efect_garra.png) + Red Illumination */}
        {motionEffect === 'hit-attack' && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center animate-vfx-impact">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle, rgba(239,68,68,0.52) 0%, rgba(185,28,28,0.28) 55%, transparent 82%)',
              }}
            />
            <AssetImg
              src={UI_ASSETS.efectGarra}
              alt=""
              className="relative z-10 w-[112%] h-[112%] max-w-none object-contain opacity-85 drop-shadow-[0_0_16px_rgba(239,68,68,0.95)]"
              fallback={null}
            />
          </div>
        )}

        {/* 2. Skill / Other Damage VFX: Semi-transparent Damage Slash (efect_dano.png) + Purple Illumination */}
        {motionEffect === 'hit-damage' && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center animate-vfx-impact">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle, rgba(168,85,247,0.5) 0%, rgba(126,34,206,0.26) 55%, transparent 82%)',
              }}
            />
            <AssetImg
              src={UI_ASSETS.efectDano}
              alt=""
              className="relative z-10 w-[112%] h-[112%] max-w-none object-contain opacity-85 drop-shadow-[0_0_16px_rgba(192,132,252,0.95)]"
              fallback={null}
            />
          </div>
        )}

        {/* 3. Heal VFX: Semi-transparent Green Bubbles (efect_vida.png) + Green Illumination */}
        {motionEffect === 'heal' && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center animate-vfx-impact">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle, rgba(34,197,94,0.48) 0%, rgba(16,185,129,0.25) 55%, transparent 82%)',
              }}
            />
            <AssetImg
              src={UI_ASSETS.efectVida}
              alt=""
              className="relative z-10 w-[112%] h-[112%] max-w-none object-contain opacity-85 drop-shadow-[0_0_18px_rgba(52,211,153,0.95)]"
              fallback={null}
            />
          </div>
        )}

        {/* 4. Caster Skill Glow (subtle translucent aura on caster, not damage) */}
        {motionEffect === 'skill' && (
          <div
            className="pointer-events-none absolute inset-0 z-20 animate-pulse"
            style={{
              background:
                'radial-gradient(circle, rgba(56,189,248,0.42) 0%, rgba(250,204,21,0.18) 55%, transparent 82%)',
            }}
          />
        )}

        {/* Name & HP Bar inside bottom of artwork window */}
        <div className="absolute bottom-[18%] inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-1.5 pt-3 pb-1 text-center">
          <div className="text-[9px] font-display font-black leading-tight text-white truncate text-outline-sm">
            {card.name}
          </div>
          {/* Mini HP Bar */}
          <div className="w-full h-1.5 bg-slate-950/95 rounded-full overflow-hidden mt-0.5 border border-black/80">
            <div
              className={[
                'h-full transition-all duration-300',
                hpPct > 50
                  ? 'bg-gradient-to-r from-emerald-500 to-lime-400'
                  : hpPct > 25
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-red-600 to-orange-500',
              ].join(' ')}
              style={{ width: `${hpPct}%` }}
            />
          </div>
        </div>

        {/* Status Overlay (Acted / Waiting) */}
        {isPlayerSide && monster.status === 'acted' && (
          <div className="absolute inset-0 bg-slate-950/55 flex items-center justify-center">
            <span className="flex items-center gap-0.5 rounded bg-slate-950/90 border border-slate-500 px-1.5 py-0.5 text-[8.5px] font-runic font-extrabold text-slate-200">
              <Lock className="w-2.5 h-2.5" /> AGIU
            </span>
          </div>
        )}
        {monster.status === 'waiting' && (
          <div className="absolute inset-0 bg-sky-950/60 flex items-center justify-center">
            <span className="flex items-center gap-0.5 rounded bg-sky-950/95 border border-sky-400 px-1.5 py-0.5 text-[8px] font-runic font-extrabold text-sky-200">
              <Clock className="w-2.5 h-2.5" /> ESPERA
            </span>
          </div>
        )}
      </div>

      {/* 2. Stone & Claw Card Frame Overlay (card_frame.png) */}
      <AssetImg
        src={UI_ASSETS.cardFrame}
        alt=""
        className="pointer-events-none absolute inset-0 w-full h-full object-fill scale-[1.06] z-10 drop-shadow-[0_6px_12px_rgba(0,0,0,0.85)]"
        fallback={
          <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-slate-500" />
        }
      />

      {/* 3. Precedence Crystal at Top Center Diamond Socket */}
      <div
        title={`Precedência: ${PRECEDENCE_META[card.precedence].label}`}
        className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 w-7 h-7 z-20 flex items-center justify-center"
      >
        <AssetImg
          src={CRYSTAL_ASSETS[card.precedence]}
          alt={PRECEDENCE_META[card.precedence].label}
          className="w-full h-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
          fallback={
            <span
              className="w-4 h-4 rotate-45 rounded-[2px] border border-white"
              style={{
                backgroundColor: PRECEDENCE_META[card.precedence].colorHex,
              }}
            />
          }
        />
      </div>

      {/* Active Attacker Indicator Tag */}
      {isLastSource && (
        <div className="pointer-events-none absolute -top-2.5 left-1/2 -translate-x-1/2 z-40 px-2 py-0.5 rounded-full bg-amber-400 border border-white text-slate-950 text-[8px] font-runic font-black uppercase tracking-wider shadow-[0_0_12px_rgba(251,191,36,0.95)] whitespace-nowrap flex items-center gap-0.5">
          <Swords className="w-2.5 h-2.5" /> ATACANTE
        </div>
      )}

      {/* Next in Card Heroes + Velocity Queue Tag */}
      {isNextInQueue && !isLastSource && !isSelected && (
        <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 z-30 px-1.5 py-0.2 rounded-full bg-emerald-500 border border-emerald-100 text-slate-950 text-[7.5px] font-runic font-black uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.9)] whitespace-nowrap">
          PRÓXIMO
        </div>
      )}

      {/* Double-Attack Indicator (e.g. Tengu, Cérbero) */}
      {monster.status === 'ready' && monster.actionsLeft > 1 && (
        <div
          title="Pode atacar 2 vezes nesta rodada"
          className="pointer-events-none absolute top-4 right-0.5 z-30 px-1 py-0.2 rounded bg-amber-500 border border-amber-100 text-slate-950 text-[7.5px] font-runic font-black shadow"
        >
          {monster.actionsLeft}×
        </div>
      )}

      {/* Discrete Info Button (i) to view full 3D Holographic Card */}
      {onInspect && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            sfx.click();
            onInspect();
          }}
          title="Ver carta completa"
          className="absolute top-1.5 right-1.5 z-40 w-4 h-4 rounded-full bg-slate-950/85 border border-slate-400/75 text-slate-200 flex items-center justify-center opacity-75 hover:opacity-100 hover:border-amber-300 hover:text-amber-200 transition cursor-pointer shadow"
        >
          <Info className="w-2.5 h-2.5" />
        </button>
      )}

      {/* Shield Badge */}
      {monster.shield > 0 && (
        <div className="absolute -top-1.5 -right-1 z-30 flex items-center gap-0.5 rounded-full bg-sky-600 border border-sky-200 px-1.5 py-0.5 text-[9.5px] font-black text-white shadow text-outline-sm">
          <Shield className="w-2.5 h-2.5" />
          {monster.shield}
        </div>
      )}

      {/* Active Skill Indicator */}
      {activeSkill && (
        <div
          title={activeSkill.name}
          className={[
            'absolute -top-1.5 -left-1 z-30 flex items-center justify-center w-5 h-5 rounded-full border text-[9px] font-black shadow',
            activeReady
              ? 'bg-amber-400 border-amber-100 text-slate-950'
              : 'bg-slate-800 border-slate-500 text-slate-300',
          ].join(' ')}
        >
          {activeReady ? (
            <Sparkles className="w-3 h-3" />
          ) : (
            monster.activeCooldown
          )}
        </div>
      )}

      {/* Precedence Preview Badge when Targeting */}
      {isTargetable && precedencePreview && precedencePreview !== 'neutral' && (
        <div
          className={[
            'absolute top-5 left-1/2 -translate-x-1/2 z-30 px-1.5 py-0.5 rounded text-[8.5px] font-runic font-black uppercase tracking-wide shadow-md whitespace-nowrap',
            precedencePreview === 'advantage'
              ? 'bg-emerald-500 text-slate-950 border border-emerald-200'
              : 'bg-rose-600 text-white border border-rose-300',
          ].join(' ')}
        >
          {precedencePreview === 'advantage' ? '+50% Vantagem' : '-25% Resist.'}
        </div>
      )}

      {/* 4. Three Attribute Seals at Bottom Base: ATK (seal_atk.png) | HP (seal_hp.png) | VEL (seal_vel.png) */}
      <div className="relative z-20 mt-auto grid grid-cols-3 gap-0.5 px-1.5 pb-1 pt-0.5 text-center">
        {/* ATK Seal */}
        <div className="relative flex flex-col items-center justify-center py-0.5">
          <AssetImg
            src={UI_ASSETS.sealAtk}
            alt="ATK"
            className="pointer-events-none absolute inset-0 w-full h-full object-contain scale-125 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
            fallback={
              <div className="absolute inset-0 rounded bg-red-950/95 border border-red-600/80" />
            }
          />
          <span className="relative z-10 text-[6.5px] font-runic font-black text-red-200 leading-none text-outline-sm">
            ATK
          </span>
          <span
            className={[
              'relative z-10 text-[11px] font-display font-black leading-tight text-outline',
              effectiveAtk > card.atk
                ? 'text-amber-300'
                : effectiveAtk < card.atk
                  ? 'text-rose-400'
                  : 'text-white',
            ].join(' ')}
          >
            {effectiveAtk}
          </span>
        </div>

        {/* HP Seal */}
        <div className="relative flex flex-col items-center justify-center py-0.5">
          <AssetImg
            src={UI_ASSETS.sealHp}
            alt="HP"
            className="pointer-events-none absolute inset-0 w-full h-full object-contain scale-125 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
            fallback={
              <div className="absolute inset-0 rounded bg-emerald-950/95 border border-emerald-600/80" />
            }
          />
          <span className="relative z-10 text-[6.5px] font-runic font-black text-emerald-200 leading-none text-outline-sm">
            HP
          </span>
          <span className="relative z-10 text-[11px] font-display font-black text-white leading-tight text-outline">
            {monster.currentHp}
          </span>
        </div>

        {/* VEL Seal */}
        <div className="relative flex flex-col items-center justify-center py-0.5">
          <AssetImg
            src={UI_ASSETS.sealVel}
            alt="VEL"
            className="pointer-events-none absolute inset-0 w-full h-full object-contain scale-125 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
            fallback={
              <div className="absolute inset-0 rounded bg-sky-950/95 border border-sky-600/80" />
            }
          />
          <span className="relative z-10 text-[6.5px] font-runic font-black text-sky-200 leading-none text-outline-sm">
            VEL
          </span>
          <span
            className={[
              'relative z-10 text-[11px] font-display font-black leading-tight text-outline',
              effectiveVel > card.vel ? 'text-sky-300' : 'text-white',
            ].join(' ')}
          >
            {effectiveVel}
          </span>
        </div>
      </div>
    </div>
  );
}
