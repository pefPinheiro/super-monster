import { PRECEDENCE_META, type CardDefinition } from '@super-monster/game-engine';
import { Shield, Sparkles, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { CRYSTAL_ASSETS, UI_ASSETS } from '../assets/assetPaths';
import { sfx } from '../utils/sfx';
import { AssetImg } from './AssetImg';

interface CardInspectModalProps {
  card: CardDefinition;
  effectiveStats?: {
    atk: number;
    hp: number;
    maxHp?: number;
    vel: number;
    shield?: number;
  };
  onClose: () => void;
}

const PRECEDENCE_GLOW: Record<CardDefinition['precedence'], string> = {
  furia: 'rgba(239, 68, 68, 0.6)',
  astucia: 'rgba(34, 197, 94, 0.6)',
  arcano: 'rgba(56, 189, 248, 0.65)',
};

/**
 * Full-size Marvel Snap-inspired 3D Holographic Card Inspector Modal.
 * Usable from Deck, Draft, and Battle screens.
 */
export function CardInspectModal({
  card,
  effectiveStats,
  onClose,
}: CardInspectModalProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState<{ rx: number; ry: number; px: number; py: number } | null>(
    null
  );

  const atk = effectiveStats?.atk ?? card.atk;
  const hp = effectiveStats?.hp ?? card.hp;
  const vel = effectiveStats?.vel ?? card.vel;
  const shield = effectiveStats?.shield ?? 0;

  const updatePointerTilt = (clientX: number, clientY: number) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const ry = (nx - 0.5) * 26;
    const rx = (0.5 - ny) * 22;
    setTilt({ rx, ry, px: nx * 100, py: ny * 100 });
  };

  const handleClose = () => {
    sfx.click();
    onClose();
  };

  return (
    <div
      className="absolute inset-0 z-50 bg-slate-950/30 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
      onClick={handleClose}
    >
      {/* Main Container (stops click propagation so interacting with the 3D card doesn't close) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[330px] flex flex-col items-center gap-3 select-none"
      >
        {/* Ambient Precedence Aura + Close Button anchored close to the card */}
        <div className="relative flex items-center justify-center">
          {/* Close Button positioned right beside the top-right corner of the card */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar visualização"
            className="absolute -top-3 -right-4 z-50 w-9 h-9 rounded-full hud-stone-bar border-2 border-amber-400/90 text-amber-200 flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.95)] hover:brightness-125 active:scale-90 transition cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.8]" />
          </button>

          <div
            className="pointer-events-none absolute -inset-8 rounded-full blur-3xl opacity-75"
            style={{
              background: `radial-gradient(circle, ${PRECEDENCE_GLOW[card.precedence]} 0%, transparent 72%)`,
            }}
          />

          {/* 3D Interactive Holographic Card */}
          <div
            ref={cardRef}
            onPointerMove={(e) => updatePointerTilt(e.clientX, e.clientY)}
            onPointerDown={(e) => updatePointerTilt(e.clientX, e.clientY)}
            onPointerLeave={() => setTilt(null)}
            style={
              tilt
                ? {
                    transform: `perspective(950px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(1.03)`,
                    transition: 'transform 60ms ease-out',
                  }
                : {
                    transition: 'transform 380ms ease-out',
                  }
            }
            className={[
              'relative w-[255px] sm:w-[275px] aspect-[3/4.2] rounded-2xl touch-none cursor-grab active:cursor-grabbing',
              !tilt ? 'animate-holo-idle' : '',
            ].join(' ')}
          >
            {/* Inner Card Artwork — aligned strictly to the frame's recessed window */}
            <div className="absolute top-[14%] bottom-[11%] inset-x-[12%] rounded-lg overflow-hidden bg-slate-900 shadow-inner">
              <AssetImg
                src={card.artUrl}
                alt={card.name}
                className="w-full h-full object-cover"
                fallback={
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    {card.emojiFallback}
                  </div>
                }
              />

              {/* Marvel Snap-style Iridescent Foil Overlay following pointer */}
              <div
                className="pointer-events-none absolute inset-0 holo-foil-layer opacity-75"
                style={{
                  backgroundPosition: tilt
                    ? `${tilt.px}% ${tilt.py}%`
                    : '50% 50%',
                  backgroundSize: '200% 200%',
                }}
              />

              {/* Dynamic Specular Light Glare */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: tilt
                    ? `radial-gradient(circle at ${tilt.px}% ${tilt.py}%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.06) 35%, transparent 65%)`
                    : 'radial-gradient(circle at 35% 25%, rgba(255,255,255,0.22) 0%, transparent 55%)',
                }}
              />

              {/* Seamless Bottom Title Gradient (goes all the way to bottom-0 — zero sharp cut!) */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-3 pt-10 pb-3.5 text-center">
                <div className="font-display text-lg sm:text-xl text-white leading-tight text-outline">
                  {card.name}
                </div>
                <div className="text-[10px] font-runic tracking-widest uppercase text-amber-300 text-outline-sm mt-0.5">
                  {PRECEDENCE_META[card.precedence].label} • {card.monsterType}
                </div>
              </div>
            </div>

            {/* Stone & Claw Card Frame */}
            <AssetImg
              src={UI_ASSETS.cardFrame}
              alt=""
              className="pointer-events-none absolute inset-0 w-full h-full object-fill scale-[1.04] z-10 drop-shadow-[0_18px_36px_rgba(0,0,0,0.95)]"
              fallback={null}
            />

            {/* Top Center Precedence Crystal nestled inside the Diamond Socket */}
            <div className="pointer-events-none absolute top-[5.5%] left-1/2 -translate-x-1/2 w-10 h-10 z-20 flex items-center justify-center">
              <AssetImg
                src={CRYSTAL_ASSETS[card.precedence]}
                alt={PRECEDENCE_META[card.precedence].label}
                className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)]"
                fallback={null}
              />
            </div>

            {/* Shield Badge if active */}
            {shield > 0 && (
              <div className="absolute top-2 right-2 z-30 flex items-center gap-1 rounded-full bg-sky-600 border-2 border-sky-200 px-2 py-0.5 text-xs font-black text-white shadow">
                <Shield className="w-3.5 h-3.5" />+{shield}
              </div>
            )}

            {/* Bottom 3 Attribute Seals (ATK / HP / VEL) */}
            <div className="absolute bottom-1 inset-x-3 z-20 grid grid-cols-3 gap-1.5 text-center">
              {/* ATK */}
              <div className="relative h-12 flex flex-col items-center justify-center">
                <AssetImg
                  src={UI_ASSETS.sealAtk}
                  alt="ATK"
                  className="pointer-events-none absolute inset-0 w-full h-full object-contain scale-115 drop-shadow"
                  fallback={null}
                />
                <span className="relative z-10 text-[7px] font-runic text-red-200 leading-none text-outline-sm">
                  ATK
                </span>
                <span className="relative z-10 font-display text-base text-white leading-none text-outline">
                  {atk}
                </span>
              </div>

              {/* HP */}
              <div className="relative h-12 flex flex-col items-center justify-center">
                <AssetImg
                  src={UI_ASSETS.sealHp}
                  alt="HP"
                  className="pointer-events-none absolute inset-0 w-full h-full object-contain scale-115 drop-shadow"
                  fallback={null}
                />
                <span className="relative z-10 text-[7px] font-runic text-emerald-200 leading-none text-outline-sm">
                  HP
                </span>
                <span className="relative z-10 font-display text-base text-white leading-none text-outline">
                  {hp}
                </span>
              </div>

              {/* VEL */}
              <div className="relative h-12 flex flex-col items-center justify-center">
                <AssetImg
                  src={UI_ASSETS.sealVel}
                  alt="VEL"
                  className="pointer-events-none absolute inset-0 w-full h-full object-contain scale-115 drop-shadow"
                  fallback={null}
                />
                <span className="relative z-10 text-[7px] font-runic text-sky-200 leading-none text-outline-sm">
                  VEL
                </span>
                <span className="relative z-10 font-display text-base text-white leading-none text-outline">
                  {vel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Faction & Skill Description Box */}
        <div className="w-full runic-dialog-panel rounded-2xl px-3.5 py-2.5 text-center space-y-1 shadow-2xl">
          <div className="text-[9.5px] font-runic uppercase tracking-widest text-amber-300/90">
            {card.faction}
          </div>
          {card.skills[0] ? (
            <div className="text-xs text-slate-100 leading-snug flex items-start justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-amber-300">
                  {card.skills[0].name}:
                </strong>{' '}
                {card.skills[0].description}
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-300 italic">
              Monstro de combate puro (sem habilidade especial).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
