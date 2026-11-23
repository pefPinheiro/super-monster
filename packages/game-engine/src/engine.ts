import {
  getActiveSetBonuses,
  getEquippedItemsList,
  type HeroBuild,
  type HeroEffectRule,
  type HeroEffectTrigger,
} from './heroItems.ts';
import { calculatePrecedenceDamage } from './precedence.ts';
import type {
  BoardMonster,
  CardDefinition,
  CombatLogEntry,
  GameCatalog,
  MatchState,
  PlayerState,
  Side,
  SkillDefinition,
  SlotModifierDefinition,
  VisualEvent,
} from './types.ts';

export const MAX_ROUNDS = 30;

let idCounter = 1;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function opponentOf(side: Side): Side {
  return side === 'player' ? 'enemy' : 'player';
}

function cloneState(state: MatchState): MatchState {
  return structuredClone(state);
}

function addLog(
  state: MatchState,
  text: string,
  kind: CombatLogEntry['kind'] = 'info'
): void {
  state.log.unshift({
    id: nextId('log'),
    round: state.round,
    text,
    kind,
  });
  if (state.log.length > 60) {
    state.log.length = 60;
  }
}

function rollSlotModifiers(
  modifiers: SlotModifierDefinition[]
): [SlotModifierDefinition, SlotModifierDefinition, SlotModifierDefinition] {
  const pool = modifiers.length >= 3 ? shuffle(modifiers) : [...modifiers];
  const picked: SlotModifierDefinition[] = [];
  for (let i = 0; i < 3; i += 1) {
    picked.push(pool[i % pool.length]);
  }
  return [picked[0], picked[1], picked[2]];
}

function getCardActionsPerRound(card: CardDefinition): number {
  return card.skills.some((s) => s.effect === 'double_attack') ? 2 : 1;
}

function createMonsterInstance(
  card: CardDefinition,
  slotIndex: 0 | 1 | 2,
  status: BoardMonster['status']
): BoardMonster {
  return {
    instanceId: nextId('mon'),
    card,
    slotIndex,
    currentHp: card.hp,
    maxHp: card.hp,
    shield: 0,
    bonusAtk: 0,
    bonusVel: 0,
    status,
    actionsLeft: getCardActionsPerRound(card),
    activeCooldown: 0,
    reviveUsed: false,
  };
}

function scaleCardForDifficulty(
  card: CardDefinition,
  multiplier = 1
): CardDefinition {
  if (multiplier === 1) return card;
  return {
    ...card,
    atk: Math.max(10, Math.round(card.atk * multiplier)),
    hp: Math.max(50, Math.round(card.hp * multiplier)),
    vel: Math.max(5, Math.round(card.vel * (1 + (multiplier - 1) * 0.5))),
  };
}

function resolveFixedModifiers(
  catalog: GameCatalog,
  modifierIds?: [string, string, string]
): [SlotModifierDefinition, SlotModifierDefinition, SlotModifierDefinition] {
  if (!modifierIds) return rollSlotModifiers(catalog.slotModifiers);
  const picked = modifierIds.map(
    (id, idx) =>
      catalog.slotModifiers.find((m) => m.id === id) ??
      catalog.slotModifiers[idx % catalog.slotModifiers.length]
  );
  return [picked[0], picked[1], picked[2]];
}

function buildInitialPlayer(
  side: Side,
  heroName: string,
  catalog: GameCatalog,
  customDeckIds?: string[],
  fixedModifierIds?: [string, string, string],
  statMultiplier = 1,
  preserveDeckOrder = false,
  heroBuild?: HeroBuild
): PlayerState {
  let pool: CardDefinition[];
  if (customDeckIds && customDeckIds.length >= 5) {
    const mapped = customDeckIds
      .map((id) => catalog.cards.find((c) => c.id === id))
      .filter((c): c is CardDefinition => Boolean(c));
    pool =
      mapped.length >= 5
        ? mapped
        : catalog.cards.filter((c) => c.inDefaultDeck);
  } else {
    pool = shuffle(catalog.cards.filter((c) => c.inDefaultDeck)).slice(0, 9);
  }

  const scaledPool = pool.map((c) => scaleCardForDifficulty(c, statMultiplier));
  const deckCards = preserveDeckOrder ? scaledPool : shuffle(scaledPool);
  const draftOptions = deckCards.slice(0, 5);
  const remainingDeck = deckCards.slice(5);

  return {
    side,
    heroName,
    heroBuild: heroBuild ? structuredClone(heroBuild) : undefined,
    slots: [null, null, null],
    slotModifiers: resolveFixedModifiers(catalog, fixedModifierIds),
    deck: remainingDeck,
    hand: [],
    draftOptions,
    extrasPlayed: 0,
    maxExtras: 2,
    extrasDrawn: 0,
    passedThisRound: false,
  };
}

export interface CreateMatchOptions {
  terrainId?: string;
  playerName?: string;
  enemyName?: string;
  playerDeckIds?: string[];
  enemyDeckIds?: string[];
  slotModifierIds?: [string, string, string];
  enemyStatMultiplier?: number;
  playerHeroBuild?: HeroBuild;
  enemyHeroBuild?: HeroBuild;
}

export function createMatch(
  catalog: GameCatalog,
  options: CreateMatchOptions = {}
): MatchState {
  const terrain =
    catalog.terrains.find((t) => t.id === options.terrainId) ??
    catalog.terrains[Math.floor(Math.random() * catalog.terrains.length)];

  const resolvedPlayerName =
    options.playerHeroBuild?.heroName?.trim() ||
    options.playerName ||
    'Herói Rúnico';

  const state: MatchState = {
    phase: 'draft',
    round: 1,
    terrain,
    players: {
      player: buildInitialPlayer(
        'player',
        resolvedPlayerName,
        catalog,
        options.playerDeckIds,
        options.slotModifierIds,
        1,
        false,
        options.playerHeroBuild
      ),
      enemy: buildInitialPlayer(
        'enemy',
        options.enemyName ?? 'Lorde Glacial',
        catalog,
        options.enemyDeckIds,
        options.slotModifierIds,
        options.enemyStatMultiplier ?? 1,
        Boolean(options.enemyDeckIds),
        options.enemyHeroBuild
      ),
    },
    activeSide: 'player',
    initiativeSide: 'player',
    winner: null,
    log: [],
    lastEvent: null,
  };

  addLog(
    state,
    `Terreno sorteado: ${terrain.name} (${terrain.biome}). Escolha 3 de 5 cartas para iniciar!`,
    'round'
  );
  return state;
}

function matchesFilter(monster: BoardMonster, skill: SkillDefinition): boolean {
  if (skill.filterType && monster.card.monsterType !== skill.filterType) {
    return false;
  }
  if (skill.filterFaction && monster.card.faction !== skill.filterFaction) {
    return false;
  }
  if (
    skill.filterPrecedence &&
    monster.card.precedence !== skill.filterPrecedence
  ) {
    return false;
  }
  return true;
}

function getAllyIndicesForScope(
  sourceSlot: 0 | 1 | 2,
  scope: SkillDefinition['scope']
): (0 | 1 | 2)[] {
  if (scope === 'self') return [sourceSlot];
  if (scope === 'ally_left') {
    return sourceSlot > 0 ? [(sourceSlot - 1) as 0 | 1 | 2] : [];
  }
  if (scope === 'ally_right') {
    return sourceSlot < 2 ? [(sourceSlot + 1) as 0 | 1 | 2] : [];
  }
  if (scope === 'ally_adjacent') {
    const res: (0 | 1 | 2)[] = [];
    if (sourceSlot > 0) res.push((sourceSlot - 1) as 0 | 1 | 2);
    if (sourceSlot < 2) res.push((sourceSlot + 1) as 0 | 1 | 2);
    return res;
  }
  if (scope === 'all_allies') return [0, 1, 2];
  return [];
}

export function getEffectiveStats(
  state: MatchState,
  side: Side,
  slotIndex: 0 | 1 | 2
): { atk: number; vel: number } {
  const player = state.players[side];
  const monster = player.slots[slotIndex];
  if (!monster) return { atk: 0, vel: 0 };

  let atk = monster.card.atk + monster.bonusAtk;
  let vel = monster.card.vel + monster.bonusVel;

  // Continuous slot modifier on own slot
  const mod = player.slotModifiers[slotIndex];
  if (mod && mod.timing === 'continuous') {
    if (mod.effect === 'buff_atk') atk += mod.value;
    if (mod.effect === 'buff_vel') vel += mod.value;
    if (mod.effect === 'hybrid_atk_vel') {
      atk += mod.value;
      vel += Math.round(mod.value * 0.8);
    }
  }

  // Continuous weaken_opposite from opposing slot
  const enemy = state.players[opponentOf(side)];
  const oppMod = enemy.slotModifiers[slotIndex];
  if (enemy.slots[slotIndex] && oppMod && oppMod.effect === 'weaken_opposite') {
    atk -= oppMod.value;
  }

  // Continuous aura passives from alive allies
  for (const idx of [0, 1, 2] as const) {
    const ally = player.slots[idx];
    if (!ally) continue;
    for (const skill of ally.card.skills) {
      if (skill.modality !== 'passive' || skill.trigger !== 'aura') continue;
      const affected = getAllyIndicesForScope(idx, skill.scope);
      if (!affected.includes(slotIndex)) continue;
      if (!matchesFilter(monster, skill)) continue;
      if (skill.effect === 'buff_atk') atk += skill.value;
      if (skill.effect === 'buff_vel') vel += skill.value;
    }
  }

  return {
    atk: Math.max(5, atk),
    vel: Math.max(1, vel),
  };
}

export function getDraftPreviewStats(
  slots: readonly [CardDefinition | null, CardDefinition | null, CardDefinition | null],
  slotModifiers: readonly [
    SlotModifierDefinition,
    SlotModifierDefinition,
    SlotModifierDefinition,
  ]
): {
  perSlot: [
    { atk: number; hp: number; vel: number; shield: number } | null,
    { atk: number; hp: number; vel: number; shield: number } | null,
    { atk: number; hp: number; vel: number; shield: number } | null,
  ];
  totalVel: number;
  totalAtk: number;
  totalHp: number;
} {
  const perSlot: [
    { atk: number; hp: number; vel: number; shield: number } | null,
    { atk: number; hp: number; vel: number; shield: number } | null,
    { atk: number; hp: number; vel: number; shield: number } | null,
  ] = [null, null, null];

  for (const idx of [0, 1, 2] as const) {
    const card = slots[idx];
    if (!card) continue;

    let atk = card.atk;
    let vel = card.vel;
    let hp = card.hp;
    let shield = 0;

    // 1. Continuous slot modifier on own slot
    const mod = slotModifiers[idx];
    if (mod && mod.timing === 'continuous') {
      if (mod.effect === 'buff_atk') atk += mod.value;
      if (mod.effect === 'buff_vel') vel += mod.value;
      if (mod.effect === 'hybrid_atk_vel') {
        atk += mod.value;
        vel += Math.round(mod.value * 0.8);
      }
    }

    // 2. Aura & on_enter passives from all slotted allies
    for (const allyIdx of [0, 1, 2] as const) {
      const allyCard = slots[allyIdx];
      if (!allyCard) continue;
      for (const skill of allyCard.skills) {
        if (skill.modality !== 'passive') continue;
        if (skill.trigger !== 'aura' && skill.trigger !== 'on_enter') continue;
        const affected = getAllyIndicesForScope(allyIdx, skill.scope);
        if (!affected.includes(idx)) continue;
        if (skill.filterType && card.monsterType !== skill.filterType) continue;
        if (skill.filterFaction && card.faction !== skill.filterFaction) continue;
        if (
          skill.filterPrecedence &&
          card.precedence !== skill.filterPrecedence
        )
          continue;

        if (skill.effect === 'buff_atk') atk += skill.value;
        if (skill.effect === 'buff_vel') vel += skill.value;
        if (skill.effect === 'shield') shield += skill.value;
        if (skill.effect === 'heal') hp += skill.value;
      }
    }

    perSlot[idx] = {
      atk: Math.max(5, atk),
      hp,
      vel: Math.max(1, vel),
      shield,
    };
  }

  const totalVel = perSlot.reduce((sum, s) => sum + (s?.vel ?? 0), 0);
  const totalAtk = perSlot.reduce((sum, s) => sum + (s?.atk ?? 0), 0);
  const totalHp = perSlot.reduce((sum, s) => sum + (s?.hp ?? 0) + (s?.shield ?? 0), 0);

  return { perSlot, totalVel, totalAtk, totalHp };
}

export function getSideTotalVel(state: MatchState, side: Side): number {
  let total = 0;
  for (const idx of [0, 1, 2] as const) {
    if (state.players[side].slots[idx]) {
      total += getEffectiveStats(state, side, idx).vel;
    }
  }
  return total;
}

export function getActiveSkill(monster: BoardMonster): SkillDefinition | null {
  return monster.card.skills.find((s) => s.modality === 'active') ?? null;
}

export function canUseActiveSkill(monster: BoardMonster): boolean {
  const active = getActiveSkill(monster);
  return Boolean(active && monster.status === 'ready' && monster.activeCooldown === 0);
}

export function hasAliveMonsters(state: MatchState, side: Side): boolean {
  return state.players[side].slots.some((m) => m !== null);
}

export function getRemainingMonsters(state: MatchState, side: Side): {
  onBoard: number;
  reinforcementsLeft: number;
  total: number;
  maxTotal: number;
} {
  const p = state.players[side];
  const onBoard = p.slots.filter((m) => m !== null).length;
  const budgetLeft = Math.max(0, p.maxExtras - p.extrasPlayed);
  const cardsAvailable = p.hand.length + p.deck.length;
  const reinforcementsLeft = Math.min(budgetLeft, cardsAvailable);
  return {
    onBoard,
    reinforcementsLeft,
    total: onBoard + reinforcementsLeft,
    maxTotal: 3 + p.maxExtras,
  };
}

function checkVictoryByElimination(state: MatchState): boolean {
  if (state.phase === 'game_over') return true;
  const enemyRem = getRemainingMonsters(state, 'enemy');
  const playerRem = getRemainingMonsters(state, 'player');

  if (enemyRem.total === 0) {
    state.phase = 'game_over';
    state.winner = 'player';
    addLog(
      state,
      'VITÓRIA! Todas as cartas adversárias foram destruídas!',
      'victory'
    );
    return true;
  }

  if (playerRem.total === 0) {
    state.phase = 'game_over';
    state.winner = 'enemy';
    addLog(
      state,
      'DERROTA! Todas as suas cartas foram destruídas!',
      'victory'
    );
    return true;
  }

  return false;
}

export function getReadySlots(state: MatchState, side: Side): (0 | 1 | 2)[] {
  const res: (0 | 1 | 2)[] = [];
  for (const idx of [0, 1, 2] as const) {
    const mon = state.players[side].slots[idx];
    if (mon && mon.status === 'ready' && mon.actionsLeft > 0) res.push(idx);
  }
  return res;
}

/**
 * Card Heroes + Velocity Turn Order for a single side:
 * Sorts ready slots by highest effective VEL; ties break Left -> Center -> Right (0 -> 1 -> 2).
 */
export function getTurnQueueForSide(
  state: MatchState,
  side: Side
): (0 | 1 | 2)[] {
  const ready = getReadySlots(state, side);
  return ready.sort((a, b) => {
    const velA = getEffectiveStats(state, side, a).vel;
    const velB = getEffectiveStats(state, side, b).vel;
    if (velB !== velA) return velB - velA;
    return a - b;
  });
}

export interface TimelineTurnItem {
  side: Side;
  slotIndex: 0 | 1 | 2;
  cardName: string;
  vel: number;
}

/**
 * Builds the remaining turn timeline for the current round alternating 1-on-1
 * starting from `state.activeSide`, ordered by Card Heroes + Velocity.
 */
export function getRoundTurnTimeline(state: MatchState): TimelineTurnItem[] {
  if (state.phase !== 'round_active') return [];
  const first = state.activeSide;
  const second = opponentOf(first);

  const expand = (side: Side): TimelineTurnItem[] => {
    const queue = getTurnQueueForSide(state, side);
    const items: TimelineTurnItem[] = [];
    for (const slotIndex of queue) {
      const mon = state.players[side].slots[slotIndex];
      if (!mon) continue;
      const vel = getEffectiveStats(state, side, slotIndex).vel;
      for (let i = 0; i < mon.actionsLeft; i += 1) {
        items.push({ side, slotIndex, cardName: mon.card.name, vel });
      }
    }
    return items;
  };

  const q1 = state.players[first].passedThisRound ? [] : expand(first);
  const q2 = state.players[second].passedThisRound ? [] : expand(second);

  const timeline: TimelineTurnItem[] = [];
  const maxLen = Math.max(q1.length, q2.length);
  for (let i = 0; i < maxLen; i += 1) {
    if (i < q1.length) timeline.push(q1[i]);
    if (i < q2.length) timeline.push(q2[i]);
  }
  return timeline;
}

function applyDamageToMonster(
  state: MatchState,
  targetSide: Side,
  targetSlot: 0 | 1 | 2,
  rawDamage: number
): { dealt: number; died: boolean } {
  const target = state.players[targetSide].slots[targetSlot];
  if (!target) return { dealt: 0, died: false };

  let remaining = Math.max(0, rawDamage);
  if (target.shield > 0) {
    const absorbed = Math.min(target.shield, remaining);
    target.shield -= absorbed;
    remaining -= absorbed;
  }

  target.currentHp = Math.max(0, target.currentHp - remaining);
  const died = target.currentHp <= 0;

  if (died) {
    state.players[targetSide].slots[targetSlot] = null;
    addLog(state, `${target.card.name} foi derrotado!`, 'death');
    triggerPassiveByTrigger(state, targetSide, target, 'on_death');

    // Special passive: revive_to_hand (Fênix Solar) — returns to hand once to be played again
    const hasRevive = target.card.skills.some(
      (s) => s.effect === 'revive_to_hand'
    );
    const owner = state.players[targetSide];
    if (hasRevive && !target.reviveUsed && owner.hand.length < 4) {
      const revivedCard: CardDefinition = {
        ...target.card,
        // Mark via skills or track: card returns cleanly, and we refund 1 extra slot play if used
      };
      owner.hand.push(revivedCard);
      if (owner.extrasPlayed > 0) {
        owner.extrasPlayed -= 1;
      }
      addLog(
        state,
        `🔥 ${target.card.name} renasceu das cinzas e voltou para a mão de ${
          targetSide === 'player' ? 'Você' : 'Adversário'
        }!`,
        'skill'
      );
    }
  } else if (rawDamage > 0) {
    // Trigger on_damaged passives (e.g., Oni Carmesim, Draugr Rúnico)
    triggerPassiveByTrigger(state, targetSide, target, 'on_damaged');
  }

  return { dealt: rawDamage, died };
}

function triggerPassiveByTrigger(
  state: MatchState,
  ownerSide: Side,
  source: BoardMonster,
  trigger: 'on_enter' | 'on_death' | 'on_attack' | 'on_damaged'
): void {
  const enemySide = opponentOf(ownerSide);
  for (const skill of source.card.skills) {
    if (skill.modality !== 'passive' || skill.trigger !== trigger) continue;

    if (skill.scope === 'self') {
      if (skill.effect === 'shield') {
        source.shield += skill.value;
        addLog(
          state,
          `${source.card.name} ativou ${skill.name}: +${skill.value} Escudo.`,
          'skill'
        );
      } else if (skill.effect === 'heal') {
        source.currentHp = Math.min(source.maxHp, source.currentHp + skill.value);
        addLog(
          state,
          `${source.card.name} ativou ${skill.name}: +${skill.value} HP.`,
          'heal'
        );
      } else if (skill.effect === 'buff_atk') {
        source.bonusAtk += skill.value;
        addLog(
          state,
          `${source.card.name} ativou ${skill.name}: +${skill.value} ATK!`,
          'skill'
        );
      } else if (skill.effect === 'self_recoil') {
        addLog(
          state,
          `${source.card.name} sofreu -${skill.value} HP de recuo (${skill.name}).`,
          'attack'
        );
        applyDamageToMonster(state, ownerSide, source.slotIndex, skill.value);
      }
    } else if (skill.scope === 'opposite_enemy') {
      let targetSlot: 0 | 1 | 2 | null = state.players[enemySide].slots[source.slotIndex]
        ? source.slotIndex
        : null;
      // Fallback: if opposite slot is empty, hit the lowest-HP alive enemy so on_death is never wasted
      if (targetSlot === null) {
        let lowestHp = Infinity;
        for (const idx of [0, 1, 2] as const) {
          const cand = state.players[enemySide].slots[idx];
          if (cand && cand.currentHp < lowestHp) {
            lowestHp = cand.currentHp;
            targetSlot = idx;
          }
        }
      }
      if (targetSlot !== null && skill.effect === 'damage') {
        const opp = state.players[enemySide].slots[targetSlot]!;
        addLog(
          state,
          `${source.card.name} ativou ${skill.name}: ${skill.value} de dano em ${opp.card.name}!`,
          'skill'
        );
        applyDamageToMonster(state, enemySide, targetSlot, skill.value);
      }
    } else if (
      skill.scope === 'ally_adjacent' ||
      skill.scope === 'ally_left' ||
      skill.scope === 'ally_right' ||
      skill.scope === 'all_allies'
    ) {
      const indices = getAllyIndicesForScope(source.slotIndex, skill.scope);
      for (const idx of indices) {
        const ally = state.players[ownerSide].slots[idx];
        if (!ally || !matchesFilter(ally, skill)) continue;
        if (skill.effect === 'shield') ally.shield += skill.value;
        if (skill.effect === 'heal') {
          ally.currentHp = Math.min(ally.maxHp, ally.currentHp + skill.value);
        }
        if (skill.effect === 'buff_atk') ally.bonusAtk += skill.value;
        if (skill.effect === 'buff_vel') ally.bonusVel += skill.value;
      }
      addLog(state, `${source.card.name} ativou ${skill.name}!`, 'skill');
    }
  }
}

function matchesHeroTarget(
  mon: BoardMonster,
  targetPrecedence?: HeroEffectRule['targetPrecedence']
): boolean {
  if (!targetPrecedence) return true;
  if (Array.isArray(targetPrecedence)) {
    return targetPrecedence.includes(mon.card.precedence);
  }
  return mon.card.precedence === targetPrecedence;
}

function applyHeroEffectRule(
  state: MatchState,
  side: Side,
  rule: HeroEffectRule
): void {
  const p = state.players[side];
  const oppSide = opponentOf(side);

  if (rule.stat === 'damage_enemies') {
    let hitCount = 0;
    for (const slotIdx of [0, 1, 2] as const) {
      const oppMon = state.players[oppSide].slots[slotIdx];
      if (!oppMon) continue;
      applyDamageToMonster(state, oppSide, slotIdx, rule.value);
      hitCount += 1;
    }
    if (hitCount > 0) {
      addLog(
        state,
        `${p.heroName} (${rule.label}): causou ${rule.value} de dano em todos os adversários!`,
        'attack'
      );
    }
    return;
  }

  if (rule.stat === 'damage_allies') {
    let hitCount = 0;
    for (const slotIdx of [0, 1, 2] as const) {
      const ally = p.slots[slotIdx];
      if (!ally || !matchesHeroTarget(ally, rule.targetPrecedence)) continue;
      applyDamageToMonster(state, side, slotIdx, rule.value);
      hitCount += 1;
    }
    if (hitCount > 0) {
      addLog(
        state,
        `${p.heroName} (${rule.label}): aliados sofreram ${rule.value} de dano.`,
        'info'
      );
    }
    return;
  }

  let affected = 0;
  for (const slotIdx of [0, 1, 2] as const) {
    const ally = p.slots[slotIdx];
    if (!ally || !matchesHeroTarget(ally, rule.targetPrecedence)) continue;
    affected += 1;
    if (rule.stat === 'atk') {
      ally.bonusAtk += rule.value;
    } else if (rule.stat === 'hp') {
      ally.maxHp += rule.value;
      ally.currentHp += rule.value;
    } else if (rule.stat === 'vel') {
      ally.bonusVel += rule.value;
    } else if (rule.stat === 'shield') {
      ally.shield += rule.value;
    } else if (rule.stat === 'heal') {
      ally.currentHp = Math.min(ally.maxHp, ally.currentHp + rule.value);
    }
  }

  if (affected > 0) {
    const statText =
      rule.stat === 'atk'
        ? `+${rule.value} ATK`
        : rule.stat === 'hp'
          ? `+${rule.value} HP`
          : rule.stat === 'vel'
            ? `+${rule.value} VEL`
            : rule.stat === 'shield'
              ? `+${rule.value} Escudo`
              : `+${rule.value} HP curado`;
    addLog(
      state,
      `${p.heroName} (${rule.label}): ${statText} nos aliados.`,
      rule.stat === 'heal' ? 'heal' : 'skill'
    );
  }
}

function applyHeroEffectsForTrigger(
  state: MatchState,
  trigger: HeroEffectTrigger
): void {
  for (const side of ['player', 'enemy'] as const) {
    const build = state.players[side].heroBuild;
    if (!build) continue;

    // 1. Individual equipped item bonuses
    for (const item of getEquippedItemsList(build)) {
      if (item.trigger !== trigger) continue;
      applyHeroEffectRule(state, side, {
        stat: item.stat,
        value: item.value,
        trigger: item.trigger,
        targetPrecedence: item.targetPrecedence,
        label: item.name,
      });
    }

    // 2. Active Collection Set Bonuses (2, 3 or 4 pieces)
    for (const bonus of getActiveSetBonuses(build)) {
      for (const eff of bonus.tier.effects) {
        if (eff.trigger !== trigger) continue;
        applyHeroEffectRule(state, side, eff);
      }
    }
  }
}

function resolveInitiative(state: MatchState): void {
  const playerVel = getSideTotalVel(state, 'player');
  const enemyVel = getSideTotalVel(state, 'enemy');

  let first: Side;
  if (playerVel > enemyVel) {
    first = 'player';
  } else if (enemyVel > playerVel) {
    first = 'enemy';
  } else {
    // Fair tie-breaker: alternate initiative after round 1, 50/50 on round 1
    first =
      state.round === 1
        ? Math.random() < 0.5
          ? 'player'
          : 'enemy'
        : opponentOf(state.initiativeSide);
  }
  state.initiativeSide = first;
  state.activeSide = first;

  // Ensure active side actually has ready monsters if the other side does
  const firstReady = getReadySlots(state, first).length > 0;
  const other = opponentOf(first);
  const otherReady = getReadySlots(state, other).length > 0;
  if (!firstReady && otherReady) {
    state.activeSide = other;
  }

  addLog(
    state,
    `Rodada ${state.round} — Iniciativa: ${
      first === 'player' ? 'Você' : 'Adversário'
    } (VEL ${playerVel} vs ${enemyVel}).`,
    'round'
  );
}

/**
 * Confirms the initial 5->3 draft for both sides and starts Round 1.
 * `playerSlotCardIds`: [slot0CardId, slot1CardId, slot2CardId]
 */
export function confirmDraft(
  prevState: MatchState,
  playerSlotCardIds: [string, string, string],
  enemySlotCardIds?: [string, string, string]
): MatchState {
  if (prevState.phase !== 'draft') return prevState;
  const state = cloneState(prevState);

  const placeDraftFor = (side: Side, chosenIds: [string, string, string]) => {
    const p = state.players[side];
    const remaining: CardDefinition[] = [...p.draftOptions];
    for (const slotIdx of [0, 1, 2] as const) {
      const cardId = chosenIds[slotIdx];
      const foundIdx = remaining.findIndex((c) => c.id === cardId);
      const card = foundIdx >= 0 ? remaining.splice(foundIdx, 1)[0] : remaining.shift();
      if (card) {
        const mon = createMonsterInstance(card, slotIdx, 'ready');
        p.slots[slotIdx] = mon;
      }
    }
    // 2 unchosen cards return to deck & shuffle
    p.deck = shuffle([...p.deck, ...remaining]);
    p.draftOptions = [];

    // Immediately deal the 2 reinforcement cards at the start of battle
    const startingExtras = p.deck.splice(0, p.maxExtras);
    p.hand = [...startingExtras];
    p.extrasDrawn = startingExtras.length;
  };

  // Enemy auto-draft if not explicitly provided
  const enemyIds: [string, string, string] =
    enemySlotCardIds ??
    ([
      state.players.enemy.draftOptions[0]?.id ?? '',
      state.players.enemy.draftOptions[1]?.id ?? '',
      state.players.enemy.draftOptions[2]?.id ?? '',
    ] as [string, string, string]);

  placeDraftFor('player', playerSlotCardIds);
  placeDraftFor('enemy', enemyIds);

  // Trigger on_enter passives
  for (const side of ['player', 'enemy'] as const) {
    for (const slotIdx of [0, 1, 2] as const) {
      const mon = state.players[side].slots[slotIdx];
      if (mon) {
        triggerPassiveByTrigger(state, side, mon, 'on_enter');
      }
    }
  }

  // Trigger hero items & set bonuses for start_of_match and round 1 start_of_turn
  applyHeroEffectsForTrigger(state, 'start_of_match');
  applyHeroEffectsForTrigger(state, 'start_of_turn');

  state.phase = 'round_active';
  if (checkVictoryByElimination(state)) return state;

  resolveInitiative(state);
  return state;
}

function advanceTurnOrEndRound(state: MatchState): void {
  if (checkVictoryByElimination(state)) return;

  const current = state.activeSide;
  const other = opponentOf(current);

  const otherHasTargets = hasAliveMonsters(state, current);
  const currentHasTargets = hasAliveMonsters(state, other);

  const otherCanAct =
    !state.players[other].passedThisRound &&
    getReadySlots(state, other).length > 0 &&
    otherHasTargets;
  const currentCanAct =
    !state.players[current].passedThisRound &&
    getReadySlots(state, current).length > 0 &&
    currentHasTargets;

  // If a side has 0 monsters on board but CAN reinforce right now from hand, give them the turn to deploy!
  const otherNeedsReinforce =
    !hasAliveMonsters(state, other) &&
    state.players[other].extrasPlayed < state.players[other].maxExtras &&
    state.players[other].hand.length > 0 &&
    !state.players[other].passedThisRound;

  if (otherCanAct || otherNeedsReinforce) {
    state.activeSide = other;
    return;
  }

  if (currentCanAct) {
    state.activeSide = current;
    return;
  }

  // Neither side has remaining valid actions -> End of Round!
  finishRound(state);
}

function finishRound(state: MatchState): void {
  // 1. End-of-round slot modifiers (HEAL, SHIELD, BURN)
  for (const side of ['player', 'enemy'] as const) {
    const p = state.players[side];
    const oppSide = opponentOf(side);
    for (const slotIdx of [0, 1, 2] as const) {
      const mon = p.slots[slotIdx];
      const mod = p.slotModifiers[slotIdx];
      if (!mon || !mod || mod.timing !== 'end_of_round') continue;
      if (mod.effect === 'heal' && mon.currentHp < mon.maxHp) {
        const before = mon.currentHp;
        mon.currentHp = Math.min(mon.maxHp, mon.currentHp + mod.value);
        const healed = mon.currentHp - before;
        if (healed > 0) {
          addLog(
            state,
            `Lugar ${mod.label}: ${mon.card.name} recuperou +${healed} HP.`,
            'heal'
          );
        }
      } else if (mod.effect === 'shield') {
        mon.shield += mod.value;
        addLog(
          state,
          `Lugar ${mod.label}: ${mon.card.name} ganhou +${mod.value} Escudo.`,
          'skill'
        );
      } else if (mod.effect === 'burn_opposite') {
        const oppMon = state.players[oppSide].slots[slotIdx];
        if (oppMon) {
          addLog(
            state,
            `Lugar ${mod.label}: ${oppMon.card.name} sofreu ${mod.value} de queimadura!`,
            'attack'
          );
          applyDamageToMonster(state, oppSide, slotIdx, mod.value);
        }
      }
    }
  }

  // 1a. End-of-round hero items & set bonuses (e.g., Chamas Burn / Raiz Heal)
  applyHeroEffectsForTrigger(state, 'end_of_turn');

  if (checkVictoryByElimination(state)) return;

  // 1b. Max 30 rounds limit: whoever has more remaining cards wins; equal cards = draw
  if (state.round >= MAX_ROUNDS) {
    const playerRem = getRemainingMonsters(state, 'player').total;
    const enemyRem = getRemainingMonsters(state, 'enemy').total;
    state.phase = 'game_over';

    if (playerRem > enemyRem) {
      state.winner = 'player';
      addLog(
        state,
        `LIMITE DE ${MAX_ROUNDS} TURNOS! VITÓRIA por maioria de cartas (${playerRem} × ${enemyRem})!`,
        'victory'
      );
    } else if (enemyRem > playerRem) {
      state.winner = 'enemy';
      addLog(
        state,
        `LIMITE DE ${MAX_ROUNDS} TURNOS! DERROTA por número de cartas (${playerRem} × ${enemyRem}).`,
        'victory'
      );
    } else {
      state.winner = 'draw';
      addLog(
        state,
        `LIMITE DE ${MAX_ROUNDS} TURNOS! EMPATE (${playerRem} × ${enemyRem} cartas)!`,
        'victory'
      );
    }
    return;
  }

  // 2. Each player draws +1 card (max 2 extras drawn in the entire match)
  for (const side of ['player', 'enemy'] as const) {
    const p = state.players[side];
    if (p.extrasDrawn < p.maxExtras && p.hand.length < 4 && p.deck.length > 0) {
      const drawn = p.deck.shift();
      if (drawn) {
        p.hand.push(drawn);
        p.extrasDrawn += 1;
        if (side === 'player') {
          addLog(
            state,
            `Você recebeu o reforço ${p.extrasDrawn}/${p.maxExtras}: ${drawn.name}.`,
            'info'
          );
        }
      }
    }
  }

  // 3. Prepare next round
  state.round += 1;
  for (const side of ['player', 'enemy'] as const) {
    const p = state.players[side];
    p.passedThisRound = false;
    for (const slotIdx of [0, 1, 2] as const) {
      const mon = p.slots[slotIdx];
      if (!mon) continue;
      mon.status = 'ready';
      mon.actionsLeft = getCardActionsPerRound(mon.card);
      if (mon.activeCooldown > 0) {
        mon.activeCooldown = Math.max(0, mon.activeCooldown - 1);
      }
    }
  }

  applyHeroEffectsForTrigger(state, 'start_of_turn');
  if (checkVictoryByElimination(state)) return;

  resolveInitiative(state);
}

/**
 * Optional reinforcement into an empty slot (max 2 extras per match).
 * Newly placed monster enters in 'waiting' state and only acts next round.
 */
export function playReinforcement(
  prevState: MatchState,
  side: Side,
  handIndex: number,
  slotIndex: 0 | 1 | 2
): MatchState {
  if (prevState.phase !== 'round_active') return prevState;
  const pPrev = prevState.players[side];
  if (pPrev.extrasPlayed >= pPrev.maxExtras) return prevState;
  if (pPrev.slots[slotIndex] !== null) return prevState;
  if (handIndex < 0 || handIndex >= pPrev.hand.length) return prevState;

  const state = cloneState(prevState);
  const p = state.players[side];
  const [card] = p.hand.splice(handIndex, 1);
  const hasRush = card.skills.some((s) => s.effect === 'rush_reinforce');
  const monster = createMonsterInstance(
    card,
    slotIndex,
    hasRush ? 'ready' : 'waiting'
  );
  // Prevent infinite loop if a revived Fenix dies again
  if (card.skills.some((s) => s.effect === 'revive_to_hand')) {
    monster.reviveUsed = true;
  }
  p.slots[slotIndex] = monster;
  p.extrasPlayed += 1;

  state.lastEvent = {
    id: nextId('evt'),
    type: 'reinforce',
    targetSide: side,
    targetSlot: slotIndex,
    targetName: card.name,
    label: hasRush ? 'ÍMPETO!' : `Reforço (${p.extrasPlayed}/${p.maxExtras})!`,
  };

  addLog(
    state,
    `${side === 'player' ? 'Você' : 'Adversário'} posicionou ${card.name} (${
      hasRush
        ? 'ÍMPETO — já pode agir neste turno!'
        : `reforço ${p.extrasPlayed}/${p.maxExtras} — age na próxima rodada`
    }).`,
    'info'
  );

  triggerPassiveByTrigger(state, side, monster, 'on_enter');
  return state;
}

export type AttackTarget = { type: 'monster'; slotIndex: 0 | 1 | 2 };

export function executeStandardAttack(
  prevState: MatchState,
  side: Side,
  attackerSlot: 0 | 1 | 2,
  target: AttackTarget
): MatchState {
  if (prevState.phase !== 'round_active' || prevState.activeSide !== side) {
    return prevState;
  }
  const attackerPrev = prevState.players[side].slots[attackerSlot];
  if (!attackerPrev || attackerPrev.status !== 'ready') return prevState;

  const enemySide = opponentOf(side);
  if (!prevState.players[enemySide].slots[target.slotIndex]) {
    return prevState;
  }

  const state = cloneState(prevState);
  const attacker = state.players[side].slots[attackerSlot]!;
  const { atk } = getEffectiveStats(state, side, attackerSlot);
  const isAoeAttack = attacker.card.skills.some(
    (s) => s.effect === 'aoe_attack'
  );

  if (isAoeAttack) {
    // Hits ALL alive enemy cards on the board (e.g., Kraken Abissal, Orochi)
    let firstRelation: 'advantage' | 'disadvantage' | 'neutral' = 'neutral';
    for (const eSlot of [0, 1, 2] as const) {
      const def = state.players[enemySide].slots[eSlot];
      if (!def) continue;
      const { damage: rawPrec, relation } = calculatePrecedenceDamage(
        atk,
        attacker.card.precedence,
        def.card.precedence
      );
      if (eSlot === target.slotIndex) firstRelation = relation;
      const dMod = state.players[enemySide].slotModifiers[eSlot];
      const dmg =
        dMod?.effect === 'damage_reduction'
          ? Math.max(1, Math.round(rawPrec * (1 - dMod.value / 100)))
          : rawPrec;
      applyDamageToMonster(state, enemySide, eSlot, dmg);
    }

    addLog(
      state,
      `${attacker.card.name} realizou ataque em área atingindo TODOS os inimigos (${atk} ATK base)!`,
      'attack'
    );

    state.lastEvent = {
      id: nextId('evt'),
      type: 'attack',
      sourceSide: side,
      sourceSlot: attackerSlot,
      sourceName: attacker.card.name,
      targetSide: enemySide,
      targetSlot: 'all',
      targetName: 'Todos os Inimigos',
      amount: atk,
      precedenceResult: firstRelation,
      label: `ATAQUE EM ÁREA!`,
    };
  } else {
    const defender = state.players[enemySide].slots[target.slotIndex]!;
    const { damage: rawPrecDamage, relation } = calculatePrecedenceDamage(
      atk,
      attacker.card.precedence,
      defender.card.precedence
    );

    // Defender slot modifier: damage_reduction (ÉGIDE)
    const defMod = state.players[enemySide].slotModifiers[target.slotIndex];
    const damage =
      defMod?.effect === 'damage_reduction'
        ? Math.max(1, Math.round(rawPrecDamage * (1 - defMod.value / 100)))
        : rawPrecDamage;

    const relText =
      relation === 'advantage'
        ? ' (VANTAGEM +50%!)'
        : relation === 'disadvantage'
          ? ' (Desvantagem -25%)'
          : '';

    addLog(
      state,
      `${attacker.card.name} atacou ${defender.card.name} causando ${damage} de dano${relText}.`,
      'attack'
    );

    state.lastEvent = {
      id: nextId('evt'),
      type: 'attack',
      sourceSide: side,
      sourceSlot: attackerSlot,
      sourceName: attacker.card.name,
      targetSide: enemySide,
      targetSlot: target.slotIndex,
      targetName: defender.card.name,
      amount: damage,
      precedenceResult: relation,
      label:
        relation === 'advantage'
          ? `-${damage} VANTAGEM!`
          : relation === 'disadvantage'
            ? `-${damage} RESIST.`
            : `-${damage}`,
    };

    applyDamageToMonster(state, enemySide, target.slotIndex, damage);

    // Defender slot modifier: thorns (ESPINHO)
    if (defMod?.effect === 'thorns') {
      addLog(
        state,
        `Espinhos devolveram ${defMod.value} de dano em ${attacker.card.name}!`,
        'attack'
      );
      applyDamageToMonster(state, side, attackerSlot, defMod.value);
    }
  }

  // Attacker slot modifier: lifesteal (DRENO)
  const atkMod = state.players[side].slotModifiers[attackerSlot];
  if (
    atkMod?.effect === 'lifesteal' &&
    state.players[side].slots[attackerSlot]
  ) {
    attacker.currentHp = Math.min(
      attacker.maxHp,
      attacker.currentHp + atkMod.value
    );
    addLog(
      state,
      `Dreno curou +${atkMod.value} HP de ${attacker.card.name}.`,
      'heal'
    );
  }

  triggerPassiveByTrigger(state, side, attacker, 'on_attack');
  if (state.players[side].slots[attackerSlot]) {
    attacker.actionsLeft = Math.max(0, attacker.actionsLeft - 1);
    if (attacker.actionsLeft <= 0) {
      attacker.status = 'acted';
    }
  }
  advanceTurnOrEndRound(state);
  return state;
}

export function executeActiveSkill(
  prevState: MatchState,
  side: Side,
  casterSlot: 0 | 1 | 2,
  chosenEnemySlot?: 0 | 1 | 2
): MatchState {
  if (prevState.phase !== 'round_active' || prevState.activeSide !== side) {
    return prevState;
  }
  const casterPrev = prevState.players[side].slots[casterSlot];
  if (!casterPrev || !canUseActiveSkill(casterPrev)) return prevState;

  const skill = getActiveSkill(casterPrev)!;
  const enemySide = opponentOf(side);

  if (
    skill.scope === 'chosen_enemy' &&
    (chosenEnemySlot === undefined ||
      !prevState.players[enemySide].slots[chosenEnemySlot])
  ) {
    return prevState;
  }

  if (
    skill.scope === 'chosen_ally' &&
    (chosenEnemySlot === undefined ||
      !prevState.players[side].slots[chosenEnemySlot])
  ) {
    return prevState;
  }

  const state = cloneState(prevState);
  const caster = state.players[side].slots[casterSlot]!;

  let visualTargetSide: Side = side;
  let visualTargetSlot: 0 | 1 | 2 | 'all' = casterSlot;

  if (skill.scope === 'chosen_ally' && chosenEnemySlot !== undefined) {
    const allyTarget = state.players[side].slots[chosenEnemySlot]!;
    visualTargetSide = side;
    visualTargetSlot = chosenEnemySlot;
    if (skill.effect === 'shield') {
      allyTarget.shield += skill.value;
    } else if (skill.effect === 'heal') {
      allyTarget.currentHp = Math.min(
        allyTarget.maxHp,
        allyTarget.currentHp + skill.value
      );
    }
    addLog(
      state,
      `${caster.card.name} usou ${skill.name} em ${allyTarget.card.name} (+${skill.value} Escudo)!`,
      'skill'
    );
    state.lastEvent = {
      id: nextId('evt'),
      type: 'skill',
      sourceSide: side,
      sourceSlot: casterSlot,
      sourceName: caster.card.name,
      targetSide: side,
      targetSlot: chosenEnemySlot,
      targetName: allyTarget.card.name,
      skillName: skill.name,
      amount: skill.value,
      label: `+${skill.value} ESCUDO`,
    };
  } else if (skill.scope === 'chosen_enemy' && chosenEnemySlot !== undefined) {
    const target = state.players[enemySide].slots[chosenEnemySlot]!;
    visualTargetSide = enemySide;
    visualTargetSlot = chosenEnemySlot;

    if (skill.effect === 'self_destruct_damage') {
      const { damage, relation } = calculatePrecedenceDamage(
        skill.value,
        caster.card.precedence,
        target.card.precedence
      );
      addLog(
        state,
        `💥 ${caster.card.name} se autodestruiu com ${skill.name}, causando ${damage} de dano em ${target.card.name}!`,
        'skill'
      );
      applyDamageToMonster(state, enemySide, chosenEnemySlot, damage);
      state.lastEvent = {
        id: nextId('evt'),
        type: 'skill',
        sourceSide: side,
        sourceSlot: casterSlot,
        sourceName: caster.card.name,
        targetSide: enemySide,
        targetSlot: chosenEnemySlot,
        targetName: target.card.name,
        skillName: skill.name,
        amount: damage,
        precedenceResult: relation,
        label: `EXPLOSÃO -${damage}!`,
      };
      // Destroy self after detonation
      applyDamageToMonster(state, side, casterSlot, caster.currentHp + caster.shield + 999);
    } else if (skill.effect === 'damage') {
      const { damage, relation } = calculatePrecedenceDamage(
        skill.value,
        caster.card.precedence,
        target.card.precedence
      );
      addLog(
        state,
        `${caster.card.name} usou ${skill.name} em ${target.card.name} (${damage} de dano)!`,
        'skill'
      );
      applyDamageToMonster(state, enemySide, chosenEnemySlot, damage);
      state.lastEvent = {
        id: nextId('evt'),
        type: 'skill',
        sourceSide: side,
        sourceSlot: casterSlot,
        sourceName: caster.card.name,
        targetSide: enemySide,
        targetSlot: chosenEnemySlot,
        targetName: target.card.name,
        skillName: skill.name,
        amount: damage,
        precedenceResult: relation,
        label: `${skill.name} -${damage}`,
      };
    } else if (skill.effect === 'debuff_atk') {
      target.bonusAtk -= skill.value;
      const { damage: bonusDmg, relation } = calculatePrecedenceDamage(
        70,
        caster.card.precedence,
        target.card.precedence
      );
      addLog(
        state,
        `${caster.card.name} usou ${skill.name} em ${target.card.name}: -${bonusDmg} HP e -${skill.value} ATK!`,
        'skill'
      );
      applyDamageToMonster(state, enemySide, chosenEnemySlot, bonusDmg);
      state.lastEvent = {
        id: nextId('evt'),
        type: 'skill',
        sourceSide: side,
        sourceSlot: casterSlot,
        sourceName: caster.card.name,
        targetSide: enemySide,
        targetSlot: chosenEnemySlot,
        targetName: target.card.name,
        skillName: skill.name,
        amount: bonusDmg,
        precedenceResult: relation,
        label: `-${bonusDmg} / -${skill.value} ATK`,
      };
    }
  } else if (skill.scope === 'all_enemies') {
    visualTargetSide = enemySide;
    visualTargetSlot = 'all';
    for (const idx of [0, 1, 2] as const) {
      const target = state.players[enemySide].slots[idx];
      if (!target) continue;
      if (skill.effect === 'damage') {
        const { damage } = calculatePrecedenceDamage(
          skill.value,
          caster.card.precedence,
          target.card.precedence
        );
        applyDamageToMonster(state, enemySide, idx, damage);
      } else if (skill.effect === 'debuff_atk') {
        target.bonusAtk -= skill.value;
      }
    }
    addLog(
      state,
      `${caster.card.name} lançou ${skill.name} atingindo todos os inimigos (${skill.value})!`,
      'skill'
    );
    state.lastEvent = {
      id: nextId('evt'),
      type: 'skill',
      sourceSide: side,
      sourceSlot: casterSlot,
      sourceName: caster.card.name,
      targetSide: visualTargetSide,
      targetSlot: visualTargetSlot,
      targetName: 'Todos os Inimigos',
      skillName: skill.name,
      amount: skill.value,
      label: `${skill.name} -${skill.value}`,
    };
  } else if (
    skill.scope === 'all_allies' ||
    skill.scope === 'ally_adjacent' ||
    skill.scope === 'self'
  ) {
    const indices =
      skill.scope === 'ally_adjacent'
        ? ([casterSlot, ...getAllyIndicesForScope(casterSlot, 'ally_adjacent')] as (
            | 0
            | 1
            | 2
          )[])
        : getAllyIndicesForScope(casterSlot, skill.scope);

    for (const idx of indices) {
      const ally = state.players[side].slots[idx];
      if (!ally) continue;
      if (skill.effect === 'heal') {
        ally.currentHp = Math.min(ally.maxHp, ally.currentHp + skill.value);
      } else if (skill.effect === 'shield') {
        ally.shield += skill.value;
      } else if (skill.effect === 'buff_atk') {
        ally.bonusAtk += skill.value;
      } else if (skill.effect === 'buff_vel') {
        ally.bonusVel += skill.value;
      }
    }
    addLog(
      state,
      `${caster.card.name} usou ${skill.name} (+${skill.value})!`,
      skill.effect === 'heal' ? 'heal' : 'skill'
    );
    state.lastEvent = {
      id: nextId('evt'),
      type: skill.effect === 'heal' ? 'heal' : 'skill',
      sourceSide: side,
      sourceSlot: casterSlot,
      sourceName: caster.card.name,
      targetSide: side,
      targetSlot: skill.scope === 'all_allies' ? 'all' : casterSlot,
      targetName:
        skill.scope === 'all_allies'
          ? 'Todos os Aliados'
          : skill.scope === 'ally_adjacent'
            ? 'Aliados Adjacentes'
            : caster.card.name,
      skillName: skill.name,
      amount: skill.value,
      label: `${skill.name} +${skill.value}`,
    };
  }

  if (state.players[side].slots[casterSlot]) {
    caster.activeCooldown = skill.cooldown;
    caster.actionsLeft = Math.max(0, caster.actionsLeft - 1);
    if (caster.actionsLeft <= 0) {
      caster.status = 'acted';
    }
  }
  advanceTurnOrEndRound(state);
  return state;
}

export function passTurn(prevState: MatchState, side: Side): MatchState {
  if (prevState.phase !== 'round_active' || prevState.activeSide !== side) {
    return prevState;
  }
  const state = cloneState(prevState);
  state.players[side].passedThisRound = true;
  addLog(
    state,
    `${side === 'player' ? 'Você' : 'Adversário'} passou o restante das ações da rodada.`,
    'info'
  );
  advanceTurnOrEndRound(state);
  return state;
}
