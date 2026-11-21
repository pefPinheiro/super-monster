import {
  canUseActiveSkill,
  executeActiveSkill,
  executeStandardAttack,
  getActiveSkill,
  getReadySlots,
  hasAliveMonsters,
  opponentOf,
  passTurn,
  playReinforcement,
} from './engine.ts';
import { getPrecedenceRelation } from './precedence.ts';
import type { MatchState, Side } from './types.ts';

/**
 * Picks 3 cards for the initial draft, prioritizing high ATK on +ATK slots,
 * high VEL on +VEL slots, and high HP on HEAL slots.
 */
export function chooseAiDraft(state: MatchState, side: Side = 'enemy'): [string, string, string] {
  const player = state.players[side];
  const pool = [...player.draftOptions];
  const chosen: string[] = ['', '', ''];

  for (const slotIdx of [0, 1, 2] as const) {
    const mod = player.slotModifiers[slotIdx];
    pool.sort((a, b) => {
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

  const readySlots = getReadySlots(state, side);
  if (readySlots.length === 0) {
    return passTurn(state, side);
  }

  const enemySlots = ([0, 1, 2] as const).filter(
    (idx) => state.players[oppSide].slots[idx] !== null
  );

  // 2. If enemy board is empty (no targets left to attack this round), pass to finish round
  if (!hasAliveMonsters(state, oppSide)) {
    return passTurn(state, side);
  }

  // 3. Check if any ready monster has a high-value Active Skill ready
  for (const slot of readySlots) {
    const mon = state.players[side].slots[slot]!;
    if (!canUseActiveSkill(mon)) continue;
    const skill = getActiveSkill(mon)!;

    if (skill.scope === 'all_allies' && skill.effect === 'heal') {
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
      // Pick best target (advantage or lowest HP)
      const bestTarget = enemySlots.reduce((best, curr) => {
        const bestMon = state.players[oppSide].slots[best]!;
        const currMon = state.players[oppSide].slots[curr]!;
        return currMon.currentHp < bestMon.currentHp ? curr : best;
      }, enemySlots[0]);
      return executeActiveSkill(state, side, slot, bestTarget);
    }
  }

  // 4. Otherwise pick the best (attacker, target) pair prioritizing precedence advantage & kills
  let bestScore = -Infinity;
  let bestAttacker = readySlots[0];
  let bestTarget = enemySlots[0];

  for (const aSlot of readySlots) {
    const attacker = state.players[side].slots[aSlot]!;
    for (const tSlot of enemySlots) {
      const target = state.players[oppSide].slots[tSlot]!;
      const rel = getPrecedenceRelation(
        attacker.card.precedence,
        target.card.precedence
      );
      let score = 0;
      if (rel === 'advantage') score += 40;
      if (rel === 'disadvantage') score -= 25;
      // Prefer finishing off low-HP enemies
      if (attacker.card.atk >= target.currentHp) score += 50;
      score += Math.max(0, 100 - target.currentHp / 3);
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
