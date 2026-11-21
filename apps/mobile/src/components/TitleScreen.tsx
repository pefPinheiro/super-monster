import type { TerrainDefinition } from '@super-monster/game-engine';
import {
  Map,
  Settings,
  ShoppingBag,
  Shuffle,
  Swords,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface TitleScreenProps {
  terrains: TerrainDefinition[];
  selectedTerrainId: string | 'random';
  onSelectTerrain: (id: string | 'random') => void;
  onStartMatch: () => void;
}

export function TitleScreen({
  terrains,
  selectedTerrainId,
  onSelectTerrain,
  onStartMatch,
}: TitleScreenProps) {
  const [modal, setModal] = useState<'campaign' | 'shop' | 'settings' | null>(null);

  const previewTerrain =
    selectedTerrainId === 'random'
      ? terrains[0]
      : terrains.find((t) => t.id === selectedTerrainId) ?? terrains[0];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-5 overflow-hidden">
      {/* Background Terrain */}
      <img
        src={previewTerrain.imageUrl}
        alt={previewTerrain.name}
        className="absolute inset-0 w-full h-full object-cover scale-105 opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/95" />

      {/* Top Status Strip */}
      <div className="relative z-10 flex justify-between items-center text-[10px] font-bold tracking-widest uppercase text-amber-200">
        <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-amber-500/50 text-outline-sm">
          Protótipo v0.2
        </span>
        <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-500/70 text-outline-sm">
          {selectedTerrainId === 'random' ? 'Terreno: Aleatório' : previewTerrain.biome}
        </span>
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto">
        <img
          src="/logo.png"
          alt="Super Monster"
          className="w-64 sm:w-72 drop-shadow-[0_14px_30px_rgba(0,0,0,0.95)]"
        />
        <p className="mt-2 font-display text-xs tracking-[0.22em] text-amber-300 uppercase text-outline">
          Card Battler Tático 2D
        </p>
      </div>

      {/* Main Menu: Batalha, Campanha, Shop, Configurações */}
      <div className="relative z-10 space-y-2.5">
        {/* Primary CTA: BATALHA */}
        <button
          type="button"
          onClick={onStartMatch}
          className="w-full py-3.5 rounded-xl bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 border-2 border-amber-200 text-slate-950 font-display font-black text-base tracking-wider shadow-[0_10px_28px_rgba(245,158,11,0.45)] hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Swords className="w-5 h-5" />
          BATALHA
        </button>

        {/* Secondary CTA: CAMPANHA */}
        <button
          type="button"
          onClick={() => setModal('campaign')}
          className="relative w-full py-3 rounded-xl hud-stone-bar border-2 border-slate-500/90 text-slate-100 font-display font-bold text-sm tracking-wider hover:border-amber-400/70 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer text-outline-sm"
        >
          <Map className="w-4 h-4 text-sky-400" />
          CAMPANHA
          <span className="absolute right-3 px-2 py-0.5 rounded-full bg-sky-950/90 border border-sky-400/60 text-[9px] font-sans font-extrabold text-sky-300">
            EM BREVE
          </span>
        </button>

        {/* Bottom Row: SHOP & CONFIGURAÇÕES */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setModal('shop')}
            className="py-2.5 rounded-xl hud-leather-bar border-2 border-amber-700/80 text-amber-100 font-display font-bold text-xs tracking-wider hover:border-amber-400 active:scale-[0.98] transition flex items-center justify-center gap-1.5 cursor-pointer text-outline-sm"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            SHOP
          </button>

          <button
            type="button"
            onClick={() => setModal('settings')}
            className="py-2.5 rounded-xl hud-stone-bar border-2 border-slate-500/90 text-slate-200 font-display font-bold text-xs tracking-wider hover:border-slate-300 active:scale-[0.98] transition flex items-center justify-center gap-1.5 cursor-pointer text-outline-sm"
          >
            <Settings className="w-4 h-4 text-slate-300" />
            CONFIG.
          </button>
        </div>
      </div>

      {/* Modals */}
      {modal === 'campaign' && (
        <div className="absolute inset-0 z-40 bg-slate-950/88 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-xs rounded-2xl bg-slate-900 border-2 border-sky-500/70 p-4 space-y-3 shadow-2xl text-center">
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-sky-300 text-sm">
                Modo Campanha
              </span>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1 rounded bg-slate-800 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              O mapa de fases e chefes da Campanha será implementado na próxima
              etapa, conectado ao banco de dados no Supabase.
            </p>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="w-full py-2 rounded-lg bg-sky-600 text-white font-bold text-xs cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {modal === 'shop' && (
        <div className="absolute inset-0 z-40 bg-slate-950/88 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-xs rounded-2xl bg-slate-900 border-2 border-amber-500/70 p-4 space-y-3 shadow-2xl text-center">
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-amber-300 text-sm">
                Shop Rúnico
              </span>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1 rounded bg-slate-800 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Aqui ficarão pacotes de cartas, skins de heróis e terrenos
              especiais gerenciados pelo Painel Web Admin.
            </p>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="w-full py-2 rounded-lg bg-amber-500 text-slate-950 font-black text-xs cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {modal === 'settings' && (
        <div className="absolute inset-0 z-40 bg-slate-950/88 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-xs rounded-2xl bg-slate-900 border-2 border-slate-500 p-4 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-amber-300 text-sm">
                Configurações
              </span>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1 rounded bg-slate-800 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Terreno da Arena (Teste)
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectTerrain('random')}
                  className={[
                    'rounded-lg border p-1.5 flex flex-col items-center justify-center gap-1 text-[9px] font-bold transition cursor-pointer',
                    selectedTerrainId === 'random'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                      : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500',
                  ].join(' ')}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Auto</span>
                </button>

                {terrains.map((t) => {
                  const active = selectedTerrainId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onSelectTerrain(t.id)}
                      className={[
                        'relative rounded-lg border overflow-hidden h-12 transition cursor-pointer',
                        active
                          ? 'border-amber-400 ring-2 ring-amber-400/50'
                          : 'border-slate-700 opacity-75 hover:opacity-100',
                      ].join(' ')}
                    >
                      <img
                        src={t.imageUrl}
                        alt={t.biome}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-bold text-white py-0.5">
                        {t.biome}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModal(null)}
              className="w-full py-2.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs cursor-pointer"
            >
              Salvar e Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
