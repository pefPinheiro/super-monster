import {
  canUseActiveSkill,
  executeActiveSkill,
  executeStandardAttack,
  getActiveSkill,
  getEffectiveStats,
  getTurnQueueForSide,
  hasAliveMonsters,
  opponentOf,
  passTurn,
  playReinforcement,
} from './engine.ts';
import { calculatePrecedenceDamage, getPrecedenceRelation } from './precedence.ts';
import type { MatchState, Side } from './types.ts';

/**
 * Picks 3 cards for the initial draft, prioritizing middle-slot auras (slot 1),
 * high ATK on +ATK slots, high VEL on +VEL slots, and high HP on HEAL slots.
 */
export function chooseAiDraft(state: MatchState, side: Side = 'enemy'): [string, string, string] {
  const player = state.players[side];
  const pool = [...player.draftOptions];
  const chosen: string[] = ['', '', ''];

  // Place slot 1 (center) first if there is an adjacent-aura card in the pool
  for (const slotIdx of [1, 0, 2] as const) {
    const mod = player.slotModifiers[slotIdx];
    pool.sort((a, b) => {
      if (slotIdx === 1) {
        const aAura = a.skills.some((s) => s.scope === 'ally_adjacent') ? 1 : 0;
        const bAura = b.skills.some((s) => s.scope === 'ally_adjacent') ? 1 : 0;
        if (bAura !== aAura) return bAura - aAura;
      }
      if (mod?.effect === 'buff_atk') return b.atk - a.atk;
      if (mod?.effect === 'buff_vel') return b.vel - a.vel;
      if (mod?.effect === 'heal') return b.hp - a.hp;
      return b.atk + b.hp - (a.atk + a.hp);
    });
    const best = pool.shift();
    if (best) chosen[slotIdx] = best.id;
  }

  return [chosen[0], chosen[1], chosen[2]];
}

/**
 * Performs 1 tactical turn for `side` (used for Enemy AI and Player AUTO mode).
 */
export function performAiTurn(prevState: MatchState, side: Side): MatchState {
  if (prevState.phase !== 'round_active' || prevState.activeSide !== side) {
    return prevState;
  }

  let state = prevState;
  const self = state.players[side];
  const oppSide = opponentOf(side);

  // 1. Optional reinforcement if an empty slot exists and we have cards & budget
  if (self.extrasPlayed < self.maxExtras && self.hand.length > 0) {
    const emptySlot = ([0, 1, 2] as const).find((idx) => self.slots[idx] === null);
    if (emptySlot !== undefined) {
      state = playReinforcement(state, side, 0, emptySlot);
    }
  }

  const readySlots = getTurnQueueForSide(state, side);
  if (readySlots.length === 0) {
    return passTurn(state, side);
  }

  const allySlots = ([0, 1, 2] as const).filter(
    (idx) => state.players[side].slots[idx] !== null
  );
  const enemySlots = ([0, 1, 2] as const).filter(
    (idx) => state.players[oppSide].slots[idx] !== null
  );

  // 2. If enemy board is empty (no targets left to attack this round), pass to finish round
  if (!hasAliveMonsters(state, oppSide)) {
    return passTurn(state, side);
  }

  // 3. Check if any ready monster has a high-value Active Skill ready (in Card Heroes + Velocity order)
  for (const slot of readySlots) {
    const mon = state.players[side].slots[slot]!;
    if (!canUseActiveSkill(mon)) continue;
    const skill = getActiveSkill(mon)!;

    if (skill.scope === 'chosen_ally' && allySlots.length > 0) {
      // Give shield to lowest-HP ally
      const bestAlly = allySlots.reduce((best, curr) => {
        const b = state.players[side].slots[best]!;
        const c = state.players[side].slots[curr]!;
        return c.currentHp < b.currentHp ? curr : best;
      }, allySlots[0]);
      return executeActiveSkill(state, side, slot, bestAlly);
    } else if (skill.scope === 'all_allies' && skill.effect === 'heal') {
      const needsHeal = ([0, 1, 2] as const).some((idx) => {
        const ally = state.players[side].slots[idx];
        return ally && ally.currentHp < ally.maxHp * 0.8;
      });
      if (needsHeal) {
        return executeActiveSkill(state, side, slot);
      }
    } else if (skill.scope === 'all_enemies' && enemySlots.length >= 2) {
      return executeActiveSkill(state, side, slot);
    } else if (skill.scope === 'ally_adjacent' && skill.effect === 'shield') {
      return executeActiveSkill(state, side, slot);
    } else if (skill.scope === 'chosen_enemy') {
      if (skill.effect === 'self_destruct_damage' && mon.currentHp > mon.maxHp * 0.55) {
        continue; // Save self-destruct until low HP
      }
      // Pick best target (advantage or lowest HP)
      const bestTarget = enemySlots.reduce((best, curr) => {
        const bestMon = state.players[oppSide].slots[best]!;
        const currMon = state.players[oppSide].slots[curr]!;
        return currMon.currentHp < bestMon.currentHp ? curr : best;
      }, enemySlots[0]);
      return executeActiveSkill(state, side, slot, bestTarget);
    }
  }

  // 4. Otherwise pick the best (attacker, target) pair using effective stats, shields & modifiers
  let bestScore = -Infinity;
  let bestAttacker = readySlots[0];
  let bestTarget = enemySlots[0];

  for (const aSlot of readySlots) {
    const attacker = state.players[side].slots[aSlot]!;
    const effAtk = getEffectiveStats(state, side, aSlot).atk;
    for (const tSlot of enemySlots) {
      const target = state.players[oppSide].slots[tSlot]!;
      const { damage: precDmg, relation } = calculatePrecedenceDamage(
        effAtk,
        attacker.card.precedence,
        target.card.precedence
      );
      const defMod = state.players[oppSide].slotModifiers[tSlot];
      const expectedDmg =
        defMod?.effect === 'damage_reduction'
          ? Math.max(1, Math.round(precDmg * (1 - defMod.value / 100)))
          : precDmg;

      let score = expectedDmg * 0.6;
      if (relation === 'advantage') score += 35;
      if (relation === 'disadvantage') score -= 25;
      if (defMod?.effect === 'thorns') score -= defMod.value * 0.7;
      // Prefer finishing off low-HP enemies (counting shield)
      if (expectedDmg >= target.currentHp + target.shield) score += 65;
      score += Math.max(0, 90 - target.currentHp / 3);
      if (score > bestScore) {
        bestScore = score;
        bestAttacker = aSlot;
        bestTarget = tSlot;
      }
    }
  }

  return executeStandardAttack(state, side, bestAttacker, {
    type: 'monster',
    slotIndex: bestTarget,
  });
}
