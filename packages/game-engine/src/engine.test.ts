import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_CATALOG,
  calculatePrecedenceDamage,
  chooseAiDraft,
  confirmDraft,
  createMatch,
  executeStandardAttack,
  passTurn,
  playReinforcement,
} from './index.ts';

test('Precedence triangle: +50% ceil advantage, -25% disadvantage', () => {
  const adv = calculatePrecedenceDamage(75, 'furia', 'astucia');
  assert.equal(adv.relation, 'advantage');
  assert.equal(adv.damage, Math.ceil(75 * 1.5)); // 113

  const disadv = calculatePrecedenceDamage(75, 'furia', 'arcano');
  assert.equal(disadv.relation, 'disadvantage');
  assert.equal(disadv.damage, Math.round(75 * 0.75)); // 56

  const neutral = calculatePrecedenceDamage(75, 'arcano', 'arcano');
  assert.equal(neutral.relation, 'neutral');
  assert.equal(neutral.damage, 75);
});

test('Draft 5->3 returns 2 cards to deck and starts Round 1', () => {
  let state = createMatch(DEFAULT_CATALOG, { terrainId: 'terrain-ice' });
  assert.equal(state.phase, 'draft');
  assert.equal(state.players.player.draftOptions.length, 5);
  const initialDeckLen = state.players.player.deck.length;

  const pChoices = state.players.player.draftOptions
    .slice(0, 3)
    .map((c) => c.id) as [string, string, string];
  const eChoices = chooseAiDraft(state, 'enemy');

  state = confirmDraft(state, pChoices, eChoices);
  assert.equal(state.phase, 'round_active');
  assert.equal(state.round, 1);
  assert.equal(state.players.player.slots.filter(Boolean).length, 3);
  assert.equal(state.players.player.deck.length, initialDeckLen + 2);
});

test('Strict 1-on-1 alternation and no repeating monster in the same round', () => {
  let state = createMatch(DEFAULT_CATALOG);
  const pChoices = state.players.player.draftOptions
    .slice(0, 3)
    .map((c) => c.id) as [string, string, string];
  state = confirmDraft(state, pChoices, chooseAiDraft(state, 'enemy'));

  const first = state.activeSide;
  const second = first === 'player' ? 'enemy' : 'player';

  state = executeStandardAttack(state, first, 0, { type: 'monster', slotIndex: 0 });
  assert.equal(state.players[first].slots[0]?.status, 'acted');
  assert.equal(state.activeSide, second);

  // Trying to act again with the same side before opponent acts is ignored
  const unchanged = executeStandardAttack(state, first, 1, {
    type: 'monster',
    slotIndex: 0,
  });
  assert.equal(unchanged.activeSide, second);
});

test('End of round draws +1 card (max 4) and reinforcement waits until next round', () => {
  let state = createMatch(DEFAULT_CATALOG);
  const pChoices = state.players.player.draftOptions
    .slice(0, 3)
    .map((c) => c.id) as [string, string, string];
  state = confirmDraft(state, pChoices, chooseAiDraft(state, 'enemy'));

  // Both pass -> finishes round 1 -> draws 1 card -> starts round 2
  const first = state.activeSide;
  const second = first === 'player' ? 'enemy' : 'player';
  state = passTurn(state, first);
  state = passTurn(state, second);

  assert.equal(state.round, 2);
  assert.equal(state.players.player.hand.length, 1);

  // Simulate an empty slot on player side and place a reinforcement
  state.players.player.slots[0] = null;
  state.activeSide = 'player';
  state = playReinforcement(state, 'player', 0, 0);
  assert.equal(state.players.player.extrasPlayed, 1);
  assert.equal(state.players.player.slots[0]?.status, 'waiting');
});

test('Game ends immediately when all enemy cards are destroyed (no player HP)', () => {
  let state = createMatch(DEFAULT_CATALOG);
  const pChoices = state.players.player.draftOptions
    .slice(0, 3)
    .map((c) => c.id) as [string, string, string];
  state = confirmDraft(state, pChoices, chooseAiDraft(state, 'enemy'));

  // Leave enemy with 1 monster at 1 HP and 0 reinforcements left
  state.players.enemy.slots[1] = null;
  state.players.enemy.slots[2] = null;
  state.players.enemy.slots[0]!.currentHp = 1;
  state.players.enemy.slots[0]!.shield = 0;
  state.players.enemy.extrasPlayed = state.players.enemy.maxExtras;
  state.activeSide = 'player';

  state = executeStandardAttack(state, 'player', 0, {
    type: 'monster',
    slotIndex: 0,
  });
  assert.equal(state.phase, 'game_over');
  assert.equal(state.winner, 'player');
});
