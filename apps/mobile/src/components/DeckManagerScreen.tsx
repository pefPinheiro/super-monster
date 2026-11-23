import {
  DEFAULT_CARDS,
  type CardDefinition,
  type Precedence,
} from '@super-monster/game-engine';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Info,
  LayoutGrid,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { CRYSTAL_ASSETS, UI_ASSETS } from '../assets/assetPaths';
import {
  DECK_SIZE,
  MAX_SAVED_DECKS,
  createDeckId,
  type DeckLibraryState,
  type SavedDeck,
} from '../utils/decks';
import { sfx } from '../utils/sfx';
import { AssetImg } from './AssetImg';
import { CardInspectModal } from './CardInspectModal';

interface DeckManagerScreenProps {
  library: DeckLibraryState;
  onChangeLibrary: (next: DeckLibraryState) => void;
  onBack: () => void;
}

type FilterTab = Precedence | 'all' | 'in_deck';
type SortMode = 'default' | 'atk' | 'hp' | 'vel';

const PRECEDENCE_META: Record<
  Precedence,
  { label: string; badgeClass: string; textClass: string }
> = {
  furia: {
    label: 'Fúria',
    badgeClass: 'bg-rose-500/20 border-rose-400/50 text-rose-200',
    textClass: 'text-rose-300',
  },
  astucia: {
    label: 'Astúcia',
    badgeClass: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200',
    textClass: 'text-emerald-300',
  },
  arcano: {
    label: 'Arcano',
    badgeClass: 'bg-sky-500/20 border-sky-400/50 text-sky-200',
    textClass: 'text-sky-300',
  },
};

export function DeckManagerScreen({
  library,
  onChangeLibrary,
  onBack,
}: DeckManagerScreenProps) {
  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    library.activeDeckId
  );
  const [inspectedCard, setInspectedCard] = useState<CardDefinition | null>(
    null
  );
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [columns, setColumns] = useState<2 | 3>(2);
  const [trayExpanded, setTrayExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');

  const currentDeck: SavedDeck =
    library.decks.find((d) => d.id === selectedDeckId) ?? library.decks[0];

  const isBattleActive = currentDeck.id === library.activeDeckId;
  const isComplete = currentDeck.cardIds.length === DECK_SIZE;

  const updateCurrentDeck = (
    updater: (deck: SavedDeck) => SavedDeck,
    activateIfComplete = true
  ) => {
    const nextDecks = library.decks.map((d) =>
      d.id === currentDeck.id
        ? { ...updater(d), updatedAt: new Date().toISOString() }
        : d
    );
    const updated = nextDecks.find((d) => d.id === currentDeck.id);
    const nextActiveId =
      activateIfComplete && updated && updated.cardIds.length === DECK_SIZE
        ? updated.id
        : library.activeDeckId;

    onChangeLibrary({
      decks: nextDecks,
      activeDeckId: nextActiveId,
    });
  };

  const handleSelectDeck = (deck: SavedDeck) => {
    sfx.click();
    setIsRenaming(false);
    setSelectedDeckId(deck.id);
    if (deck.cardIds.length === DECK_SIZE && deck.id !== library.activeDeckId) {
      onChangeLibrary({
        ...library,
        activeDeckId: deck.id,
      });
    }
  };

  const handleCreateDeck = () => {
    if (library.decks.length >= MAX_SAVED_DECKS) return;
    sfx.click();
    const newId = createDeckId();
    const newDeck: SavedDeck = {
      id: newId,
      name: `Deck ${library.decks.length + 1}`,
      cardIds: [],
      updatedAt: new Date().toISOString(),
    };
    onChangeLibrary({
      ...library,
      decks: [...library.decks, newDeck],
    });
    setSelectedDeckId(newId);
    setTrayExpanded(true);
  };

  const handleDuplicateDeck = () => {
    if (library.decks.length >= MAX_SAVED_DECKS) return;
    sfx.click();
    const newId = createDeckId();
    const copyName = `${currentDeck.name.slice(0, 18)} (2)`;
    const newDeck: SavedDeck = {
      id: newId,
      name: copyName,
      cardIds: [...currentDeck.cardIds],
      updatedAt: new Date().toISOString(),
    };
    onChangeLibrary({
      decks: [...library.decks, newDeck],
      activeDeckId:
        newDeck.cardIds.length === DECK_SIZE ? newId : library.activeDeckId,
    });
    setSelectedDeckId(newId);
  };

  const handleDeleteDeck = () => {
    if (library.decks.length <= 1) return;
    sfx.click();
    const remaining = library.decks.filter((d) => d.id !== currentDeck.id);
    const fallbackComplete =
      remaining.find((d) => d.cardIds.length === DECK_SIZE) ?? remaining[0];
    const nextActiveId =
      library.activeDeckId === currentDeck.id
        ? fallbackComplete.id
        : library.activeDeckId;

    onChangeLibrary({
      decks: remaining,
      activeDeckId: nextActiveId,
    });
    setSelectedDeckId(remaining[0].id);
    setIsRenaming(false);
  };

  const handleStartRename = () => {
    sfx.click();
    setRenameDraft(currentDeck.name);
    setIsRenaming(true);
  };

  const handleCommitRename = () => {
    const cleaned = renameDraft.trim().slice(0, 24);
    if (cleaned) {
      updateCurrentDeck((d) => ({ ...d, name: cleaned }), false);
    }
    setIsRenaming(false);
  };

  const handleToggleCard = (cardId: string) => {
    sfx.click();
    if (currentDeck.cardIds.includes(cardId)) {
      updateCurrentDeck(
        (d) => ({
          ...d,
          cardIds: d.cardIds.filter((id) => id !== cardId),
        }),
        false
      );
      return;
    }
    if (currentDeck.cardIds.length >= DECK_SIZE) return;
    updateCurrentDeck((d) => ({
      ...d,
      cardIds: [...d.cardIds, cardId],
    }));
  };

  const handleClearDeck = () => {
    if (currentDeck.cardIds.length === 0) return;
    sfx.click();
    updateCurrentDeck((d) => ({ ...d, cardIds: [] }), false);
  };

  const handleAutoFill = () => {
    if (currentDeck.cardIds.length >= DECK_SIZE) return;
    sfx.click();
    const existing = new Set(currentDeck.cardIds);
    const candidates = DEFAULT_CARDS.filter((c) => !existing.has(c.id));

    // Balance precedences as we fill remaining slots
    const counts: Record<Precedence, number> = {
      furia: 0,
      astucia: 0,
      arcano: 0,
    };
    for (const id of currentDeck.cardIds) {
      const card = DEFAULT_CARDS.find((c) => c.id === id);
      if (card) counts[card.precedence] += 1;
    }

    const nextIds = [...currentDeck.cardIds];
    while (nextIds.length < DECK_SIZE && candidates.length > 0) {
      const targetPrec = (['furia', 'astucia', 'arcano'] as Precedence[]).sort(
        (a, b) => counts[a] - counts[b]
      )[0];
      let idx = candidates.findIndex((c) => c.precedence === targetPrec);
      if (idx === -1) idx = 0;
      const [picked] = candidates.splice(idx, 1);
      nextIds.push(picked.id);
      counts[picked.precedence] += 1;
    }

    updateCurrentDeck((d) => ({ ...d, cardIds: nextIds }));
  };

  const deckCards = useMemo(
    () =>
      currentDeck.cardIds
        .map((id) => DEFAULT_CARDS.find((c) => c.id === id))
        .filter((c): c is CardDefinition => Boolean(c)),
    [currentDeck.cardIds]
  );

  const deckStats = useMemo(() => {
    const counts: Record<Precedence, number> = {
      furia: 0,
      astucia: 0,
      arcano: 0,
    };
    let atk = 0;
    let hp = 0;
    let vel = 0;
    for (const c of deckCards) {
      counts[c.precedence] += 1;
      atk += c.atk;
      hp += c.hp;
      vel += c.vel;
    }
    const len = deckCards.length || 1;
    return {
      counts,
      avgAtk: deckCards.length ? Math.round(atk / len) : 0,
      avgHp: deckCards.length ? Math.round(hp / len) : 0,
      avgVel: deckCards.length ? Math.round(vel / len) : 0,
    };
  }, [deckCards]);

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = DEFAULT_CARDS.filter((card) => {
      if (filterTab === 'in_deck') {
        if (!currentDeck.cardIds.includes(card.id)) return false;
      } else if (filterTab !== 'all' && card.precedence !== filterTab) {
        return false;
      }

      if (!q) return true;
      const skillMatch = card.skills.some(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
      return (
        card.name.toLowerCase().includes(q) ||
        card.faction.toLowerCase().includes(q) ||
        card.monsterType.toLowerCase().includes(q) ||
        skillMatch
      );
    });

    if (sortMode === 'atk') return [...list].sort((a, b) => b.atk - a.atk);
    if (sortMode === 'hp') return [...list].sort((a, b) => b.hp - a.hp);
    if (sortMode === 'vel') return [...list].sort((a, b) => b.vel - a.vel);
    return list;
  }, [filterTab, sortMode, searchQuery, currentDeck.cardIds]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#090c14] text-slate-100 select-none">
      {/* Background Layer (optional custom art + atmospheric gradient) */}
      <AssetImg
        src={UI_ASSETS.bgDeckArmory}
        alt=""
        className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-35"
        fallback={null}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(217,119,6,0.16), rgba(9,12,20,0.92) 60%, #07090f 100%)',
        }}
      />

      {/* TOP BAR (leaves center top clear for global FullscreenButton) */}
      <header className="relative z-20 shrink-0 px-3 pt-2.5 pb-2 border-b border-amber-500/20 bg-slate-950/85 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              sfx.click();
              onBack();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hud-stone-bar border border-slate-600/80 hover:border-amber-400 text-xs font-runic text-slate-100 cursor-pointer active:scale-95 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-300" />
            <span>Voltar</span>
          </button>

          <div
            className={[
              'px-2.5 py-1 rounded-full border text-[10px] font-runic tracking-wider flex items-center gap-1',
              isComplete
                ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-200'
                : 'bg-rose-500/15 border-rose-400/60 text-rose-200',
            ].join(' ')}
          >
            {isComplete ? (
              <>
                <Check className="w-3 h-3" />
                <span>{DECK_SIZE}/{DECK_SIZE} PRONTO</span>
              </>
            ) : (
              <span>
                {currentDeck.cardIds.length}/{DECK_SIZE} CARTAS
              </span>
            )}
          </div>
        </div>

        {/* Saved Decks Switcher Strip */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {library.decks.map((deck) => {
            const selected = deck.id === currentDeck.id;
            const active = deck.id === library.activeDeckId;
            const ready = deck.cardIds.length === DECK_SIZE;
            return (
              <button
                key={deck.id}
                type="button"
                onClick={() => handleSelectDeck(deck)}
                className={[
                  'shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-runic transition cursor-pointer',
                  selected
                    ? 'bg-gradient-to-b from-amber-500/30 to-amber-700/25 border-amber-400 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-slate-500',
                ].join(' ')}
              >
                {active && (
                  <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                )}
                <span className="max-w-[110px] truncate">{deck.name}</span>
                <span
                  className={[
                    'text-[9px] px-1 py-0.2 rounded',
                    ready
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400',
                  ].join(' ')}
                >
                  {deck.cardIds.length}/9
                </span>
              </button>
            );
          })}

          {library.decks.length < MAX_SAVED_DECKS && (
            <button
              type="button"
              onClick={handleCreateDeck}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-amber-400/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 text-[11px] font-runic cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Deck</span>
            </button>
          )}
        </div>

        {/* Active Deck Title + Rename & Deck Actions */}
        <div className="mt-2 flex items-center justify-between gap-2">
          {isRenaming ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCommitRename();
              }}
              className="flex-1 flex items-center gap-1.5"
            >
              <input
                type="text"
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                maxLength={24}
                autoFocus
                placeholder="Nome do deck..."
                className="flex-1 min-w-0 bg-slate-900 border border-amber-400/70 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsRenaming(false)}
                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="font-display text-sm sm:text-base text-amber-200 truncate">
                {currentDeck.name}
              </h1>
              <button
                type="button"
                onClick={handleStartRename}
                title="Renomear deck"
                className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800/70 cursor-pointer transition"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {isBattleActive && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[9px] font-runic text-amber-200 shrink-0">
                  EM USO
                </span>
              )}
            </div>
          )}

          {!isRenaming && (
            <div className="flex items-center gap-1 shrink-0">
              {!isComplete && (
                <button
                  type="button"
                  onClick={handleAutoFill}
                  title="Completar deck automaticamente"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600/30 border border-indigo-400/50 text-indigo-200 hover:bg-indigo-600/45 text-[10px] font-runic cursor-pointer transition"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Auto</span>
                </button>
              )}
              {library.decks.length < MAX_SAVED_DECKS && (
                <button
                  type="button"
                  onClick={handleDuplicateDeck}
                  title="Duplicar deck"
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:border-amber-400/60 hover:text-amber-200 cursor-pointer transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handleClearDeck}
                disabled={currentDeck.cardIds.length === 0}
                title="Limpar cartas do deck"
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:border-rose-400/60 hover:text-rose-200 disabled:opacity-40 cursor-pointer transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              {library.decks.length > 1 && (
                <button
                  type="button"
                  onClick={handleDeleteDeck}
                  title="Excluir deck"
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-rose-300 hover:bg-rose-950/60 hover:border-rose-400/60 cursor-pointer transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* COLLAPSIBLE 9-SLOT DECK DOCK */}
      <section className="relative z-10 shrink-0 mx-3 mt-2 rounded-2xl border border-amber-500/30 bg-slate-900/80 backdrop-blur-md shadow-lg overflow-hidden">
        <button
          type="button"
          onClick={() => {
            sfx.click();
            setTrayExpanded((v) => !v);
          }}
          className="w-full px-3 py-2 flex items-center justify-between gap-2 bg-slate-950/50 hover:bg-slate-900/70 transition cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-runic text-amber-200 tracking-wide shrink-0">
              SLOTS ({currentDeck.cardIds.length}/{DECK_SIZE})
            </span>
            <div className="flex items-center gap-1 text-[9.5px] font-bold">
              <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                F:{deckStats.counts.furia}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                A:{deckStats.counts.astucia}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                M:{deckStats.counts.arcano}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-[9.5px] text-slate-300">
            {deckCards.length > 0 && (
              <span className="hidden xs:inline text-slate-400">
                Média: <b className="text-red-300">{deckStats.avgAtk}</b>/
                <b className="text-emerald-300">{deckStats.avgHp}</b>/
                <b className="text-sky-300">{deckStats.avgVel}</b>
              </span>
            )}
            {trayExpanded ? (
              <ChevronUp className="w-4 h-4 text-amber-300" />
            ) : (
              <ChevronDown className="w-4 h-4 text-amber-300" />
            )}
          </div>
        </button>

        {trayExpanded && (
          <div className="p-2.5 pt-2">
            {!isComplete && (
              <div className="mb-2 text-[10px] text-amber-200/90 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1 flex items-center justify-between gap-2">
                <span>
                  Selecione mais <b>{DECK_SIZE - currentDeck.cardIds.length}</b>{' '}
                  carta(s) para ativar este deck.
                </span>
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="text-indigo-200 underline font-semibold cursor-pointer shrink-0"
                >
                  Completar
                </button>
              </div>
            )}

            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: DECK_SIZE }).map((_, idx) => {
                const id = currentDeck.cardIds[idx];
                const card = id
                  ? DEFAULT_CARDS.find((c) => c.id === id)
                  : null;
                return (
                  <div
                    key={idx}
                    className={[
                      'relative aspect-[3/3.5] rounded-xl border overflow-hidden flex items-center justify-center transition',
                      card
                        ? 'border-amber-400/80 bg-slate-950 shadow-[0_4px_12px_rgba(0,0,0,0.6)]'
                        : 'border-dashed border-slate-700 bg-slate-950/60',
                    ].join(' ')}
                  >
                    {card ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            sfx.click();
                            setInspectedCard(card);
                          }}
                          className="w-full h-full cursor-pointer group"
                        >
                          <AssetImg
                            src={card.artUrl}
                            alt={card.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                            fallback={
                              <div className="w-full h-full flex items-center justify-center text-lg">
                                {card.emojiFallback}
                              </div>
                            }
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/20" />
                          <AssetImg
                            src={CRYSTAL_ASSETS[card.precedence]}
                            alt=""
                            className="absolute top-0.5 left-0.5 w-3.5 h-3.5 object-contain"
                            fallback={null}
                          />
                          <div className="absolute inset-x-0 bottom-0 px-1 py-0.5 text-[7.5px] font-bold text-white truncate text-left">
                            {card.name.split(',')[0]}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleCard(card.id)}
                          title="Remover do Deck"
                          className="absolute top-0 right-0 w-4 h-4 rounded-bl-lg bg-rose-600/95 hover:bg-rose-500 text-white flex items-center justify-center cursor-pointer shadow"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </>
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <AssetImg
                          src={UI_ASSETS.deckSlotEmpty}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover opacity-35"
                          fallback={null}
                        />
                        <span className="relative text-[10px] font-runic text-slate-500">
                          {idx + 1}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 10th Cell: Confirm / Use Deck */}
              <button
                type="button"
                disabled={!isComplete}
                onClick={() => {
                  sfx.click();
                  if (isComplete) {
                    onChangeLibrary({
                      ...library,
                      activeDeckId: currentDeck.id,
                    });
                    onBack();
                  }
                }}
                className={[
                  'aspect-[3/3.5] rounded-xl border flex flex-col items-center justify-center text-center p-1 font-runic text-[8.5px] leading-tight transition',
                  isComplete
                    ? 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-200 text-slate-950 cursor-pointer hover:brightness-110 shadow-[0_0_16px_rgba(245,158,11,0.4)]'
                    : 'bg-slate-800/70 border-slate-700 text-slate-500 cursor-not-allowed',
                ].join(' ')}
              >
                <Check className="w-4 h-4 mb-0.5 stroke-[2.5]" />
                <span>{isComplete ? 'USAR' : '9/9'}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SEARCH, FILTER & SORT TOOLBAR */}
      <section className="relative z-10 shrink-0 px-3 pt-2.5 pb-2 space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar carta, lenda ou habilidade..."
              className="w-full bg-slate-900/90 border border-slate-700/90 focus:border-amber-400/80 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={sortMode}
            onChange={(e) => {
              sfx.click();
              setSortMode(e.target.value as SortMode);
            }}
            aria-label="Ordenar cartas"
            className="bg-slate-900/90 border border-slate-700/90 rounded-xl px-2 py-1.5 text-[11px] font-runic text-amber-200 focus:outline-none cursor-pointer"
          >
            <option value="default">Padrão</option>
            <option value="atk">ATK ↓</option>
            <option value="hp">HP ↓</option>
            <option value="vel">VEL ↓</option>
          </select>

          <button
            type="button"
            onClick={() => {
              sfx.click();
              setColumns((c) => (c === 2 ? 3 : 2));
            }}
            title={columns === 2 ? 'Visualizar 3 colunas' : 'Visualizar 2 colunas'}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/90 hover:border-amber-400/70 text-[11px] font-runic text-slate-200 cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-amber-300" />
            <span>{columns}c</span>
          </button>
        </div>

        {/* Precedence Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: `Todas (${DEFAULT_CARDS.length})` },
              { id: 'furia', label: 'Fúria' },
              { id: 'astucia', label: 'Astúcia' },
              { id: 'arcano', label: 'Arcano' },
              { id: 'in_deck', label: `No Deck (${currentDeck.cardIds.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                sfx.click();
                setFilterTab(tab.id);
              }}
              className={[
                'shrink-0 px-2.5 py-1 rounded-xl border font-runic text-[10px] transition cursor-pointer flex items-center gap-1',
                filterTab === tab.id
                  ? 'bg-amber-500/25 border-amber-400 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900/70 border-slate-700/80 text-slate-300 hover:border-slate-500',
              ].join(' ')}
            >
              {(tab.id === 'furia' ||
                tab.id === 'astucia' ||
                tab.id === 'arcano') && (
                <AssetImg
                  src={CRYSTAL_ASSETS[tab.id]}
                  alt=""
                  className="w-3 h-3 object-contain"
                  fallback={null}
                />
              )}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* FLUID COLLECTION GRID */}
      <main className="relative z-10 flex-1 overflow-y-auto px-3 pb-5">
        {filteredCards.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
            <Search className="w-7 h-7 text-slate-600" />
            <p className="text-xs">Nenhuma carta encontrada com esses filtros.</p>
          </div>
        ) : (
          <div
            className={[
              'grid gap-2.5',
              columns === 2 ? 'grid-cols-2' : 'grid-cols-3 gap-1.5',
            ].join(' ')}
          >
            {filteredCards.map((card) => {
              const inDeck = currentDeck.cardIds.includes(card.id);
              const deckFull = currentDeck.cardIds.length >= DECK_SIZE;
              const pMeta = PRECEDENCE_META[card.precedence];
              const mainSkill = card.skills[0];

              return (
                <article
                  key={card.id}
                  className={[
                    'relative rounded-2xl border bg-slate-900/85 backdrop-blur-sm flex flex-col justify-between overflow-hidden transition',
                    inDeck
                      ? 'border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.28)]'
                      : 'border-slate-700/85 hover:border-slate-500',
                  ].join(' ')}
                >
                  {/* Card Artwork (Click = Full 3D Holo View) */}
                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setInspectedCard(card);
                    }}
                    className="relative aspect-[4/4.2] w-full overflow-hidden cursor-pointer group bg-slate-950"
                  >
                    <AssetImg
                      src={card.artUrl}
                      alt={card.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      fallback={
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          {card.emojiFallback}
                        </div>
                      }
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/15 to-black/35" />

                    {/* Top Left Precedence Crystal */}
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/70 border border-white/15 backdrop-blur-sm">
                      <AssetImg
                        src={CRYSTAL_ASSETS[card.precedence]}
                        alt={pMeta.label}
                        className="w-3.5 h-3.5 object-contain"
                        fallback={null}
                      />
                      {columns === 2 && (
                        <span
                          className={`text-[9px] font-runic ${pMeta.textClass}`}
                        >
                          {pMeta.label}
                        </span>
                      )}
                    </div>

                    {/* Top Right In-Deck Badge + Info Button */}
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                      {inDeck && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[8.5px] font-black tracking-wide shadow">
                          NO DECK
                        </span>
                      )}
                      <span className="w-5 h-5 rounded-full bg-black/75 border border-slate-400/70 flex items-center justify-center text-slate-100">
                        <Info className="w-3 h-3" />
                      </span>
                    </div>

                    {/* Name & Faction overlay */}
                    <div className="absolute bottom-1.5 inset-x-2 text-left">
                      <div
                        className={[
                          'font-display font-black text-white truncate text-outline-sm',
                          columns === 2 ? 'text-xs' : 'text-[9.5px]',
                        ].join(' ')}
                      >
                        {card.name}
                      </div>
                      {columns === 2 && (
                        <div className="text-[9.5px] text-amber-200/80 truncate">
                          {card.faction} · {card.monsterType}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Body: Stats + Skill + Action */}
                  <div
                    className={[
                      'flex flex-col gap-1.5',
                      columns === 2 ? 'p-2' : 'p-1.5',
                    ].join(' ')}
                  >
                    {/* Stats Row */}
                    <div
                      className={[
                        'grid grid-cols-3 gap-1 text-center font-black',
                        columns === 2 ? 'text-[10.5px]' : 'text-[8.5px]',
                      ].join(' ')}
                    >
                      <div className="rounded-lg bg-red-950/45 border border-red-500/30 py-0.5 text-red-300">
                        ATK {card.atk}
                      </div>
                      <div className="rounded-lg bg-emerald-950/45 border border-emerald-500/30 py-0.5 text-emerald-300">
                        HP {card.hp}
                      </div>
                      <div className="rounded-lg bg-sky-950/45 border border-sky-500/30 py-0.5 text-sky-300">
                        VEL {card.vel}
                      </div>
                    </div>

                    {/* Skill Preview (2-col mode) */}
                    {columns === 2 && (
                      <div className="min-h-[30px] text-[10px] leading-snug text-slate-300 bg-black/35 border border-slate-800 rounded-lg px-2 py-1">
                        {mainSkill ? (
                          <div className="line-clamp-2">
                            <span className="text-amber-300 font-bold">
                              {mainSkill.modality === 'active'
                                ? 'Extra: '
                                : 'Padrão: '}
                              {mainSkill.name}
                            </span>{' '}
                            <span className="text-slate-400">
                              — {mainSkill.description}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">
                            Sem habilidade (Atributos puros)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Add / Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleCard(card.id)}
                      disabled={!inDeck && deckFull}
                      className={[
                        'w-full py-1.5 rounded-xl border font-runic flex items-center justify-center gap-1 transition cursor-pointer',
                        columns === 2 ? 'text-[10.5px]' : 'text-[8.5px]',
                        inDeck
                          ? 'bg-amber-400 border-amber-200 text-slate-950 font-black hover:bg-amber-300'
                          : deckFull
                            ? 'bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600/90 border-emerald-400/70 text-white hover:bg-emerald-500',
                      ].join(' ')}
                    >
                      {inDeck ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{columns === 2 ? 'NO DECK' : 'OK'}</span>
                        </>
                      ) : deckFull ? (
                        <span>CHEIO</span>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{columns === 2 ? 'ADICIONAR' : 'ADD'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* FULL 3D HOLOGRAPHIC CARD INSPECTOR */}
      {inspectedCard && (
        <CardInspectModal
          card={inspectedCard}
          onClose={() => setInspectedCard(null)}
        />
      )}
    </div>
  );
}
