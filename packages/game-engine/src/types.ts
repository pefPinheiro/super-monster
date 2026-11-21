export type Side = 'player' | 'enemy';

export type Precedence = 'furia' | 'astucia' | 'arcano';

export type SkillModality = 'passive' | 'active';

export type SkillTrigger =
  | 'aura'
  | 'on_enter'
  | 'on_death'
  | 'on_attack'
  | 'on_active';

export type SkillScope =
  | 'self'
  | 'ally_left'
  | 'ally_right'
  | 'ally_adjacent'
  | 'all_allies'
  | 'chosen_enemy'
  | 'opposite_enemy'
  | 'enemy_adjacent_to_target'
  | 'all_enemies';

export type SkillEffectType =
  | 'buff_atk'
  | 'buff_vel'
  | 'heal'
  | 'damage'
  | 'debuff_atk'
  | 'shield';

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  modality: SkillModality;
  cooldown: number; // Rounds between uses (0 for passive)
  trigger: SkillTrigger;
  scope: SkillScope;
  filterType?: string;
  filterFaction?: string;
  effect: SkillEffectType;
  value: number;
}

export interface CardDefinition {
  id: string;
  name: string;
  artUrl?: string;
  emojiFallback: string;
  atk: number;
  hp: number;
  vel: number;
  precedence: Precedence;
  monsterType: string;
  faction: string;
  inDefaultDeck: boolean;
  skills: SkillDefinition[];
}

export interface TerrainDefinition {
  id: string;
  name: string;
  biome: string;
  imageUrl: string;
  accentColor: string;
}

export type SlotModifierTiming = 'continuous' | 'end_of_round' | 'on_attack' | 'on_defend';

export type SlotModifierEffect =
  | 'buff_atk'
  | 'buff_vel'
  | 'heal'
  | 'shield'
  | 'burn_opposite'
  | 'thorns'
  | 'lifesteal'
  | 'weaken_opposite'
  | 'hybrid_atk_vel'
  | 'damage_reduction';

export interface SlotModifierDefinition {
  id: string;
  code: string;
  name: string;
  label: string;
  description: string;
  iconUrl: string;
  color: 'red' | 'blue' | 'green' | 'cyan' | 'orange' | 'lime' | 'rose' | 'purple' | 'amber' | 'indigo';
  timing: SlotModifierTiming;
  effect: SlotModifierEffect;
  value: number;
}

export type MonsterActionStatus = 'ready' | 'acted' | 'waiting';

export interface BoardMonster {
  instanceId: string;
  card: CardDefinition;
  slotIndex: 0 | 1 | 2;
  currentHp: number;
  maxHp: number;
  shield: number;
  bonusAtk: number;
  bonusVel: number;
  status: MonsterActionStatus;
  activeCooldown: number;
}

export interface PlayerState {
  side: Side;
  heroName: string;
  slots: [BoardMonster | null, BoardMonster | null, BoardMonster | null];
  slotModifiers: [SlotModifierDefinition, SlotModifierDefinition, SlotModifierDefinition];
  deck: CardDefinition[];
  hand: CardDefinition[];
  draftOptions: CardDefinition[];
  extrasPlayed: number;
  maxExtras: number;
  passedThisRound: boolean;
}

export type MatchPhase = 'draft' | 'round_active' | 'game_over';

export interface CombatLogEntry {
  id: string;
  round: number;
  text: string;
  kind: 'info' | 'attack' | 'skill' | 'heal' | 'death' | 'round' | 'victory';
}

export interface VisualEvent {
  id: string;
  type: 'attack' | 'skill' | 'heal' | 'reinforce';
  sourceSide?: Side;
  sourceSlot?: 0 | 1 | 2;
  targetSide?: Side;
  targetSlot?: 0 | 1 | 2 | 'all';
  amount?: number;
  precedenceResult?: 'advantage' | 'disadvantage' | 'neutral';
  label?: string;
}

export interface MatchState {
  phase: MatchPhase;
  round: number;
  terrain: TerrainDefinition;
  players: Record<Side, PlayerState>;
  activeSide: Side;
  initiativeSide: Side;
  winner: Side | null;
  log: CombatLogEntry[];
  lastEvent: VisualEvent | null;
}

export interface GameCatalog {
  cards: CardDefinition[];
  terrains: TerrainDefinition[];
  slotModifiers: SlotModifierDefinition[];
}
