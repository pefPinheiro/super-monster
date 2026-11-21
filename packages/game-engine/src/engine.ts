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
    activeCooldown: 0,
  };
}

function buildInitialPlayer(
  side: Side,
  heroName: string,
  catalog: GameCatalog
): PlayerState {
  const deckCards = shuffle(
    catalog.cards.filter((c) => c.inDefaultDeck)
  );
  const draftOptions = deckCards.slice(0, 5);
  const remainingDeck = deckCards.slice(5);

  return {
    side,
    heroName,
    slots: [null, null, null],
    slotModifiers: rollSlotModifiers(catalog.slotModifiers),
    deck: remainingDeck,
    hand: [],
    draftOptions,
    extrasPlayed: 0,
    maxExtras: 2,
    passedThisRound: false,
  };
}

export interface CreateMatchOptions {
  terrainId?: string;
  playerName?: string;
  enemyName?: string;
}

export function createMatch(
  catalog: GameCatalog,
  options: CreateMatchOptions = {}
): MatchState {
  const terrain =
    catalog.terrains.find((t) => t.id === options.terrainId) ??
    catalog.terrains[Math.floor(Math.random() * catalog.terrains.length)];

  const state: MatchState = {
    phase: 'draft',
    round: 1,
    terrain,
    players: {
      player: buildInitialPlayer(
        'player',
        options.playerName ?? 'Herói Rúnico',
        catalog
      ),
      enemy: buildInitialPlayer(
        'enemy',
        options.enemyName ?? 'Lorde Glacial',
        catalog
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
    if (mon && mon.status === 'ready') res.push(idx);
  }
  return res;
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
  }

  return { dealt: rawDamage, died };
}

function triggerPassiveByTrigger(
  state: MatchState,
  ownerSide: Side,
  source: BoardMonster,
  trigger: 'on_enter' | 'on_death' | 'on_attack'
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
      }
    } else if (skill.scope === 'opposite_enemy') {
      const opp = state.players[enemySide].slots[source.slotIndex];
      if (opp && skill.effect === 'damage') {
        addLog(
          state,
          `${source.card.name} ativou ${skill.name}: ${skill.value} de dano em ${opp.card.name}!`,
          'skill'
        );
        applyDamageToMonster(state, enemySide, source.slotIndex, skill.value);
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

function resolveInitiative(state: MatchState): void {
  const playerVel = getSideTotalVel(state, 'player');
  const enemyVel = getSideTotalVel(state, 'enemy');

  const first: Side = playerVel >= enemyVel ? 'player' : 'enemy';
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

  state.phase = 'round_active';
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

  if (checkVictoryByElimination(state)) return;

  // 2. Each player draws +1 card (max 4 in hand)
  for (const side of ['player', 'enemy'] as const) {
    const p = state.players[side];
    if (p.hand.length < 4 && p.deck.length > 0) {
      const drawn = p.deck.shift();
      if (drawn) {
        p.hand.push(drawn);
        if (side === 'player') {
          addLog(state, `Você comprou ${drawn.name} (${p.hand.length}/4 na mão).`, 'info');
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
      if (mon.activeCooldown > 0) {
        mon.activeCooldown = Math.max(0, mon.activeCooldown - 1);
      }
    }
  }

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
  const monster = createMonsterInstance(card, slotIndex, 'waiting');
  p.slots[slotIndex] = monster;
  p.extrasPlayed += 1;

  state.lastEvent = {
    id: nextId('evt'),
    type: 'reinforce',
    targetSide: side,
    targetSlot: slotIndex,
    label: 'Reforço!',
  };

  addLog(
    state,
    `${side === 'player' ? 'Você' : 'Adversário'} posicionou ${card.name} (reforço ${p.extrasPlayed}/${p.maxExtras} — age na próxima rodada).`,
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
    targetSide: enemySide,
    targetSlot: target.slotIndex,
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
    attacker.status = 'acted';
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

  const state = cloneState(prevState);
  const caster = state.players[side].slots[casterSlot]!;

  let visualTargetSide: Side = side;
  let visualTargetSlot: 0 | 1 | 2 | 'all' = casterSlot;

  if (skill.scope === 'chosen_enemy' && chosenEnemySlot !== undefined) {
    const target = state.players[enemySide].slots[chosenEnemySlot]!;
    visualTargetSide = enemySide;
    visualTargetSlot = chosenEnemySlot;

    if (skill.effect === 'damage') {
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
        targetSide: enemySide,
        targetSlot: chosenEnemySlot,
        amount: damage,
        precedenceResult: relation,
        label: `${skill.name} -${damage}`,
      };
    } else if (skill.effect === 'debuff_atk') {
      target.bonusAtk -= skill.value;
      const bonusDmg = 60;
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
        targetSide: enemySide,
        targetSlot: chosenEnemySlot,
        amount: bonusDmg,
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
        applyDamageToMonster(state, enemySide, idx, skill.value);
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
      targetSide: visualTargetSide,
      targetSlot: visualTargetSlot,
      amount: skill.value,
      label: `${skill.name}!`,
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
      targetSide: side,
      targetSlot: casterSlot,
      amount: skill.value,
      label: `${skill.name} +${skill.value}`,
    };
  }

  caster.activeCooldown = skill.cooldown;
  caster.status = 'acted';
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
