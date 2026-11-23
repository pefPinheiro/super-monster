import type { Precedence } from './types.ts';

export type HeroSlotType = 'arma' | 'elmo' | 'botas' | 'amuleto';

export type ItemRarity = 'basico' | 'epico' | 'lendario';

export type HeroEffectTrigger =
  | 'start_of_match'
  | 'start_of_turn'
  | 'end_of_turn';

export type HeroEffectStat =
  | 'atk'
  | 'hp'
  | 'vel'
  | 'shield'
  | 'heal'
  | 'damage_enemies'
  | 'damage_allies';

export type HeroCollectionId =
  | 'chamas'
  | 'ferro'
  | 'vento'
  | 'raiz'
  | 'arcano'
  | 'nordica'
  | 'selva'
  | 'sangue'
  | 'gelo'
  | 'solar';

export interface HeroEffectRule {
  stat: HeroEffectStat;
  value: number;
  trigger: HeroEffectTrigger;
  targetPrecedence?: Precedence | Precedence[];
  label: string;
}

export interface HeroSetBonusTier {
  requiredPieces: 2 | 3 | 4;
  name: string;
  description: string;
  effects: HeroEffectRule[];
}

export interface HeroCollectionDefinition {
  id: HeroCollectionId;
  name: string;
  themeColor: string;
  badgeBg: string;
  lore: string;
  tiers: HeroSetBonusTier[];
}

export interface HeroItem {
  id: string;
  name: string;
  imageUrl: string;
  slotType: HeroSlotType;
  collectionId: HeroCollectionId;
  rarity: ItemRarity;
  stat: HeroEffectStat;
  value: number;
  trigger: HeroEffectTrigger;
  targetPrecedence?: Precedence;
  maxDurability: number;
  remainingDurability: number;
  price: number;
}

export interface HeroSkinDefinition {
  id: string;
  name: string;
  imageUrl: string;
  subtitle: string;
}

export interface HeroFrameDefinition {
  id: string;
  name: string;
  imageUrl: string;
  ringColor: string;
  glowClass: string;
  price: number;
  unlockHint: string;
}

export interface HeroBuild {
  heroName: string;
  skinId: string;
  frameId: string;
  equipped: Partial<Record<HeroSlotType, HeroItem>>;
}

export function getEquipmentImageUrl(
  collectionId: HeroCollectionId,
  slotType: HeroSlotType
): string {
  return `/Equipamentos/${collectionId}_${slotType}.png`;
}

export const HERO_SLOT_META: Record<
  HeroSlotType,
  { label: string; statHint: string; description: string }
> = {
  arma: {
    label: 'Arma',
    statHint: 'ATK',
    description: 'Modifica o Ataque (ATK) dos aliados',
  },
  elmo: {
    label: 'Elmo',
    statHint: 'HP',
    description: 'Modifica a Vida (HP) dos aliados',
  },
  botas: {
    label: 'Botas',
    statHint: 'VEL',
    description: 'Modifica a Velocidade (VEL) dos aliados',
  },
  amuleto: {
    label: 'Amuleto',
    statHint: 'EXTRA',
    description: 'Modifica qualquer atributo ou concede efeito especial',
  },
};

export const ITEM_RARITY_META: Record<
  ItemRarity,
  {
    label: string;
    colorClass: string;
    borderClass: string;
    bgClass: string;
    durability: number;
    price: number;
  }
> = {
  basico: {
    label: 'Básico',
    colorClass: 'text-slate-200',
    borderClass: 'border-slate-400/60',
    bgClass: 'bg-slate-800/70',
    durability: 35,
    price: 150,
  },
  epico: {
    label: 'Épico',
    colorClass: 'text-purple-200',
    borderClass: 'border-purple-400/80',
    bgClass: 'bg-purple-950/60',
    durability: 50,
    price: 380,
  },
  lendario: {
    label: 'Lendário',
    colorClass: 'text-amber-200',
    borderClass: 'border-amber-400/90',
    bgClass: 'bg-amber-950/55',
    durability: 65,
    price: 850,
  },
};

export const TRIGGER_LABELS: Record<HeroEffectTrigger, string> = {
  start_of_match: 'No início do jogo',
  start_of_turn: 'No início do turno',
  end_of_turn: 'No fim do turno',
};

export const STAT_LABELS: Record<HeroEffectStat, string> = {
  atk: 'ATK',
  hp: 'HP',
  vel: 'VEL',
  shield: 'Escudo',
  heal: 'Cura HP',
  damage_enemies: 'Dano nos inimigos',
  damage_allies: 'Dano nos aliados',
};

export const HERO_COLLECTIONS: Record<
  HeroCollectionId,
  HeroCollectionDefinition
> = {
  chamas: {
    id: 'chamas',
    name: 'Chamas',
    themeColor: 'text-orange-300',
    badgeBg: 'bg-orange-500/20 border-orange-400/60 text-orange-200',
    lore: 'Forja vulcânica que incinera o campo adversário.',
    tiers: [
      {
        requiredPieces: 2,
        name: 'Queima das Chamas',
        description:
          'No fim do turno, causa 25 de dano a todos os adversários.',
        effects: [
          {
            stat: 'damage_enemies',
            value: 25,
            trigger: 'end_of_turn',
            label: 'Queima das Chamas',
          },
        ],
      },
      {
        requiredPieces: 4,
        name: 'Fornalha Suprema',
        description: 'No início do jogo, +15 ATK para todos os aliados.',
        effects: [
          {
            stat: 'atk',
            value: 15,
            trigger: 'start_of_match',
            label: 'Fornalha Suprema',
          },
        ],
      },
    ],
  },
  ferro: {
    id: 'ferro',
    name: 'Bastião de Ferro',
    themeColor: 'text-slate-200',
    badgeBg: 'bg-slate-500/25 border-slate-400/60 text-slate-100',
    lore: 'Armaduras impenetráveis para resistir às primeiras investidas.',
    tiers: [
      {
        requiredPieces: 2,
        name: 'Muralha Inicial',
        description: 'No início do jogo, +30 de Escudo para todos os aliados.',
        effects: [
          {
            stat: 'shield',
            value: 30,
            trigger: 'start_of_match',
            label: 'Muralha Inicial',
          },
        ],
      },
      {
        requiredPieces: 4,
        name: 'Aço Inquebrável',
        description: 'No início do jogo, +25 HP para todos os aliados.',
        effects: [
          {
            stat: 'hp',
            value: 25,
            trigger: 'start_of_match',
            label: 'Aço Inquebrável',
          },
        ],
      },
    ],
  },
  vento: {
    id: 'vento',
    name: 'Vento Cortante',
    themeColor: 'text-cyan-300',
    badgeBg: 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200',
    lore: 'Velocidade implacável para conquistar a iniciativa.',
    tiers: [
      {
        requiredPieces: 2,
        name: 'Brisa Veloz',
        description: 'No início do jogo, +10 VEL para todos os aliados.',
        effects: [
          {
            stat: 'vel',
            value: 10,
            trigger: 'start_of_match',
            label: 'Brisa Veloz',
          },
        ],
      },
      {
        requiredPieces: 3,
        name: 'Vendaval Contínuo',
        description: 'No início do turno, +6 VEL para todos os aliados.',
        effects: [
          {
            stat: 'vel',
            value: 6,
            trigger: 'start_of_turn',
            label: 'Vendaval Contínuo',
          },
        ],
      },
    ],
  },
  raiz: {
    id: 'raiz',
    name: 'Raiz Ancestral',
    themeColor: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200',
    lore: 'Seiva viva que regenera os combatentes ao fim de cada turno.',
    tiers: [
      {
        requiredPieces: 2,
        name: 'Seiva Restauradora',
        description: 'No fim do turno, recupera +18 HP de todos os aliados.',
        effects: [
          {
            stat: 'heal',
            value: 18,
            trigger: 'end_of_turn',
            label: 'Seiva Restauradora',
          },
        ],
      },
      {
        requiredPieces: 4,
        name: 'Casca Milenar',
        description: 'No início do jogo, +20 Escudo para todos os aliados.',
        effects: [
          {
            stat: 'shield',
            value: 20,
            trigger: 'start_of_match',
            label: 'Casca Milenar',
          },
        ],
      },
    ],
  },
  arcano: {
    id: 'arcano',
    name: 'Éter Arcano',
    themeColor: 'text-sky-300',
    badgeBg: 'bg-sky-500/20 border-sky-400/60 text-sky-200',
    lore: 'Potencializa conjuradores Arcano com descargas mágicas.',
    tiers: [
      {
        requiredPieces: 2,
        name: 'Selo Arcano',
        description: 'No início do jogo, +18 ATK para aliados de Arcano.',
        effects: [
          {
            stat: 'atk',
            value: 18,
            trigger: 'start_of_match',
            targetPrecedence: 'arcano',
            label: 'Selo Arcano',
          },
        ],
      },
      {
        requiredPieces: 3,
        name: 'Pulso de Mana',
        description:
          'No início do jogo, causa 18 de dano a todos os inimigos.',
        effects: [
          {
            stat: 'damage_enemies',
            value: 18,
            trigger: 'start_of_match',
            label: 'Pulso de Mana',
          },
        ],
      },
    ],
  },
  nordica: {
    id: 'nordica',
    name: 'Fúria Nórdica',
    themeColor: 'text-rose-300',
    badgeBg: 'bg-rose-500/20 border-rose-400/60 text-rose-200',
    lore: 'Runas de guerra forjadas para guerreiros de Fúria.',
    tiers: [
      {
        requiredPieces: 2,
        name: 'Grito de Valhalla',
        description: 'No início do jogo, +18 ATK para aliados de Fúria.',
        effects: [
          {
            stat: 'atk',
            value: 18,
            trigger: 'start_of_match',
            targetPrecedence: 'furia',
            label: 'Grito de Valhalla',
          },
        ],
      },
      {
        requiredPieces: 4,
        name: 'Ira Crescente',
        description: 'No início do turno, +8 ATK para todos os aliados.',
        effects: [
          {
            stat: 'atk',
            value: 8,
            trigger: 'start_of_turn',
            label: 'Ira Crescente',
          },
        ],
      },
    ],
  },
  selva: {
    id: 'selva',
    name: 'Astúcia da Selva',
    themeColor: 'text-lime-300',
    badgeBg: 'bg-lime-500/20 border-lime-400/60 text-lime-200',
    lore: 'Instinto predatório para aliados de Astúcia.',
    tiers: [
      {
        requiredPieces: 2,
        name: 'Bote Silencioso',
        description: 'No início do jogo, +14 VEL para aliados de Astúcia.',
        effects: [
          {
            stat: 'vel',
            value: 14,
            trigger: 'start_of_match',
            targetPrecedence: 'astucia',
            label: 'Bote Silencioso',
          },
        ],
      },
      {
        requiredPieces: 3,
        name: 'Vigor da Mata',
        description:
          'No fim do turno, recupera +14 HP para aliados de Astúcia.',
        effects: [
          {
            stat: 'heal',
            value: 14,
            trigger: 'end_of_turn',
            targetPrecedence: 'astucia',
            label: 'Vigor da Mata',
          },
        ],
      },
    ],
  },
  sangue: {
    id: 'sangue',
    name: 'Pacto Carmesim',
    themeColor: 'text-red-300',
    badgeBg: 'bg-red-500/20 border-red-400/60 text-red-200',
    lore: 'Sacrifício brutal em troca de dano devastador.',
    tiers: [
      {
        requiredPieces: 2,
        name: 'Lâmina Rubra',
        description: 'No início do jogo, +14 ATK para todos os aliados.',
        effects: [
          {
            stat: 'atk',
            value: 14,
            trigger: 'start_of_match',
            label: 'Lâmina Rubra',
          },
        ],
      },
      {
        requiredPieces: 4,
        name: 'Ritual de Sangue',
        description:
          'No início do turno, causa 22 de dano nos inimigos e 6 de dano aos aliados.',
        effects: [
          {
            stat: 'damage_enemies',
            value: 22,
            trigger: 'start_of_turn',
            label: 'Ritual de Sangue',
          },
          {
            stat: 'damage_allies',
            value: 6,
            trigger: 'start_of_turn',
            label: 'Custo do Pacto',
          },
        ],
      },
    ],
  },
  gelo: {
    id: 'gelo',
    name: 'Gelo Eterno',
    themeColor: 'text-blue-200',
    badgeBg: 'bg-blue-500/20 border-blue-400/60 text-blue-200',
    lore: 'Armadura glacial que castiga inimigos ao fim do turno.',
    tiers: [
      {
        requiredPieces: 2,
        name: 'Égide Glacial',
        description: 'No início do jogo, +24 de Escudo para todos os aliados.',
        effects: [
          {
            stat: 'shield',
            value: 24,
            trigger: 'start_of_match',
            label: 'Égide Glacial',
          },
        ],
      },
      {
        requiredPieces: 3,
        name: 'Nevasca Cortante',
        description: 'No fim do turno, causa 18 de dano a todos os inimigos.',
        effects: [
          {
            stat: 'damage_enemies',
            value: 18,
            trigger: 'end_of_turn',
            label: 'Nevasca Cortante',
          },
        ],
      },
    ],
  },
  solar: {
    id: 'solar',
    name: 'Ouro Solar',
    themeColor: 'text-amber-300',
    badgeBg: 'bg-amber-500/20 border-amber-400/60 text-amber-200',
    lore: 'Relíquias douradas que fortalecem corpo e proteção.',
    tiers: [
      {
        requiredPieces: 2,
        name: 'Bênção do Sol',
        description:
          'No início do jogo, +15 HP e +15 Escudo para todos os aliados.',
        effects: [
          {
            stat: 'hp',
            value: 15,
            trigger: 'start_of_match',
            label: 'Bênção do Sol',
          },
          {
            stat: 'shield',
            value: 15,
            trigger: 'start_of_match',
            label: 'Escudo Solar',
          },
        ],
      },
      {
        requiredPieces: 4,
        name: 'Glória Dourada',
        description: 'No início do jogo, +16 ATK e +16 HP para todos.',
        effects: [
          {
            stat: 'atk',
            value: 16,
            trigger: 'start_of_match',
            label: 'Glória Dourada',
          },
          {
            stat: 'hp',
            value: 16,
            trigger: 'start_of_match',
            label: 'Glória Dourada',
          },
        ],
      },
    ],
  },
};

export const HERO_COLLECTION_LIST: HeroCollectionDefinition[] =
  Object.values(HERO_COLLECTIONS);

export const HERO_SKINS: HeroSkinDefinition[] = [
  {
    id: 'guardiao_runico',
    name: 'Guardião Rúnico',
    imageUrl: '/Herois/hero_ally.jpg',
    subtitle: 'Campeão clássico da Ordem',
  },
  {
    id: 'senhor_abismo',
    name: 'Senhor do Abismo',
    imageUrl: '/Herois/hero_enemy.png',
    subtitle: 'Conjurador das trevas antigas',
  },
  {
    id: 'guerreiro_valhalla',
    name: 'Guerreiro de Valhalla',
    imageUrl: '/Cards/card_valquiria.png',
    subtitle: 'Lenda nórdica dos campos gelados',
  },
  {
    id: 'guardiao_amazonia',
    name: 'Espírito da Floresta',
    imageUrl: '/Cards/card_curupira.png',
    subtitle: 'Protetor místico da Amazônia',
  },
];

export const HERO_FRAMES: HeroFrameDefinition[] = [
  {
    id: 'frame_aliado',
    name: 'Pedra Rúnica',
    imageUrl: '/UI/hud_portrait_frame_ally.png',
    ringColor: 'border-amber-400/80',
    glowClass: 'shadow-[0_0_14px_rgba(251,191,36,0.4)]',
    price: 0,
    unlockHint: 'Inicial',
  },
  {
    id: 'frame_inimigo',
    name: 'Garra Carmesim',
    imageUrl: '/UI/hud_portrait_frame_enemy.png',
    ringColor: 'border-rose-500/85',
    glowClass: 'shadow-[0_0_16px_rgba(244,63,94,0.55)]',
    price: 300,
    unlockHint: 'Mercado / Eventos',
  },
  {
    id: 'frame_chamas',
    name: 'Forja das Chamas',
    imageUrl: '/UI/frame_chamas.png',
    ringColor: 'border-orange-400',
    glowClass: 'shadow-[0_0_20px_rgba(249,115,22,0.7)]',
    price: 450,
    unlockHint: 'Mercado / Eventos',
  },
  {
    id: 'frame_gelo',
    name: 'Gelo Eterno',
    imageUrl: '/UI/frame_gelo.png',
    ringColor: 'border-sky-300',
    glowClass: 'shadow-[0_0_20px_rgba(125,211,252,0.7)]',
    price: 450,
    unlockHint: 'Mercado / Eventos',
  },
  {
    id: 'frame_arcano',
    name: 'Éter Arcano',
    imageUrl: '/UI/frame_arcano.png',
    ringColor: 'border-cyan-400',
    glowClass: 'shadow-[0_0_20px_rgba(34,211,238,0.65)]',
    price: 450,
    unlockHint: 'Mercado / Eventos',
  },
  {
    id: 'frame_floresta',
    name: 'Espírito da Floresta',
    imageUrl: '/UI/frame_floresta.png',
    ringColor: 'border-emerald-400',
    glowClass: 'shadow-[0_0_20px_rgba(52,211,153,0.65)]',
    price: 500,
    unlockHint: 'Mercado / Eventos',
  },
  {
    id: 'frame_sombras',
    name: 'Sombras do Abismo',
    imageUrl: '/UI/frame_sombras.png',
    ringColor: 'border-violet-400',
    glowClass: 'shadow-[0_0_20px_rgba(167,139,250,0.7)]',
    price: 600,
    unlockHint: 'Mercado / Eventos',
  },
  {
    id: 'frame_lendario',
    name: 'Relíquia Dourada',
    imageUrl: '/UI/frame_lendario.png',
    ringColor: 'border-yellow-300',
    glowClass: 'shadow-[0_0_24px_rgba(250,204,21,0.8)]',
    price: 900,
    unlockHint: 'Lendária',
  },
];

export function formatItemEffect(item: HeroItem): string {
  const statLabel = STAT_LABELS[item.stat];
  const sign =
    item.stat === 'damage_enemies' || item.stat === 'damage_allies' ? '' : '+';
  const target = item.targetPrecedence
    ? ` (${item.targetPrecedence.toUpperCase()})`
    : ' (todos aliados)';
  const scope =
    item.stat === 'damage_enemies' ? ' nos adversários' : target;
  return `${sign}${item.value} ${statLabel}${scope} · ${TRIGGER_LABELS[item.trigger]}`;
}

export interface ActiveHeroSetBonus {
  collection: HeroCollectionDefinition;
  equippedCount: number;
  tier: HeroSetBonusTier;
}

export function getEquippedItemsList(build?: HeroBuild | null): HeroItem[] {
  if (!build) return [];
  return (['arma', 'elmo', 'botas', 'amuleto'] as HeroSlotType[])
    .map((slot) => build.equipped[slot])
    .filter(
      (item): item is HeroItem => Boolean(item && item.remainingDurability > 0)
    );
}

export function getCollectionCounts(
  build?: HeroBuild | null
): Partial<Record<HeroCollectionId, number>> {
  const counts: Partial<Record<HeroCollectionId, number>> = {};
  for (const item of getEquippedItemsList(build)) {
    counts[item.collectionId] = (counts[item.collectionId] ?? 0) + 1;
  }
  return counts;
}

export function getActiveSetBonuses(
  build?: HeroBuild | null
): ActiveHeroSetBonus[] {
  const counts = getCollectionCounts(build);
  const active: ActiveHeroSetBonus[] = [];
  for (const [colId, count] of Object.entries(counts) as [
    HeroCollectionId,
    number,
  ][]) {
    const col = HERO_COLLECTIONS[colId];
    if (!col || !count) continue;
    for (const tier of col.tiers) {
      if (count >= tier.requiredPieces) {
        active.push({ collection: col, equippedCount: count, tier });
      }
    }
  }
  return active;
}

export type HeroItemTemplate = Omit<HeroItem, 'id' | 'remainingDurability'>;

/**
 * All 40 equipment pieces (10 Collections × 4 Slots), each with its own dedicated imageUrl.
 */
export const HERO_SHOP_CATALOG: HeroItemTemplate[] = [
  // 1. Chamas
  {
    name: 'Lâmina das Chamas',
    imageUrl: getEquipmentImageUrl('chamas', 'arma'),
    slotType: 'arma',
    collectionId: 'chamas',
    rarity: 'basico',
    stat: 'atk',
    value: 5,
    trigger: 'start_of_turn',
    maxDurability: 50,
    price: 150,
  },
  {
    name: 'Elmo das Chamas',
    imageUrl: getEquipmentImageUrl('chamas', 'elmo'),
    slotType: 'elmo',
    collectionId: 'chamas',
    rarity: 'basico',
    stat: 'hp',
    value: 20,
    trigger: 'start_of_match',
    maxDurability: 50,
    price: 150,
  },
  {
    name: 'Botas da Fornalha',
    imageUrl: getEquipmentImageUrl('chamas', 'botas'),
    slotType: 'botas',
    collectionId: 'chamas',
    rarity: 'epico',
    stat: 'vel',
    value: 11,
    trigger: 'start_of_match',
    maxDurability: 50,
    price: 380,
  },
  {
    name: 'Amuleto da Brasa',
    imageUrl: getEquipmentImageUrl('chamas', 'amuleto'),
    slotType: 'amuleto',
    collectionId: 'chamas',
    rarity: 'lendario',
    stat: 'damage_enemies',
    value: 20,
    trigger: 'end_of_turn',
    maxDurability: 65,
    price: 850,
  },

  // 2. Bastião de Ferro
  {
    name: 'Martelo de Ferro',
    imageUrl: getEquipmentImageUrl('ferro', 'arma'),
    slotType: 'arma',
    collectionId: 'ferro',
    rarity: 'epico',
    stat: 'atk',
    value: 12,
    trigger: 'start_of_match',
    maxDurability: 50,
    price: 380,
  },
  {
    name: 'Elmo de Ferro',
    imageUrl: getEquipmentImageUrl('ferro', 'elmo'),
    slotType: 'elmo',
    collectionId: 'ferro',
    rarity: 'basico',
    stat: 'hp',
    value: 22,
    trigger: 'start_of_match',
    maxDurability: 50,
    price: 150,
  },
  {
    name: 'Grevas do Bastião',
    imageUrl: getEquipmentImageUrl('ferro', 'botas'),
    slotType: 'botas',
    collectionId: 'ferro',
    rarity: 'basico',
    stat: 'vel',
    value: 6,
    trigger: 'start_of_match',
    maxDurability: 45,
    price: 150,
  },
  {
    name: 'Amuleto Égide',
    imageUrl: getEquipmentImageUrl('ferro', 'amuleto'),
    slotType: 'amuleto',
    collectionId: 'ferro',
    rarity: 'lendario',
    stat: 'shield',
    value: 40,
    trigger: 'start_of_match',
    maxDurability: 65,
    price: 850,
  },

  // 3. Vento Cortante
  {
    name: 'Sabre do Vendaval',
    imageUrl: getEquipmentImageUrl('vento', 'arma'),
    slotType: 'arma',
    collectionId: 'vento',
    rarity: 'epico',
    stat: 'atk',
    value: 11,
    trigger: 'start_of_match',
    maxDurability: 50,
    price: 380,
  },
  {
    name: 'Capuz da Brisa',
    imageUrl: getEquipmentImageUrl('vento', 'elmo'),
    slotType: 'elmo',
    collectionId: 'vento',
    rarity: 'basico',
    stat: 'hp',
    value: 18,
    trigger: 'start_of_match',
    maxDurability: 45,
    price: 150,
  },
  {
    name: 'Botas do Vento',
    imageUrl: getEquipmentImageUrl('vento', 'botas'),
    slotType: 'botas',
    collectionId: 'vento',
    rarity: 'basico',
    stat: 'vel',
    value: 7,
    trigger: 'start_of_match',
    maxDurability: 45,
    price: 150,
  },
  {
    name: 'Talismã do Furacão',
    imageUrl: getEquipmentImageUrl('vento', 'amuleto'),
    slotType: 'amuleto',
    collectionId: 'vento',
    rarity: 'lendario',
    stat: 'vel',
    value: 18,
    trigger: 'start_of_match',
    maxDurability: 65,
    price: 850,
  },

  // 4. Raiz Ancestral
  {
    name: 'Cajado da Raiz',
    imageUrl: getEquipmentImageUrl('raiz', 'arma'),
    slotType: 'arma',
    collectionId: 'raiz',
    rarity: 'basico',
    stat: 'atk',
    value: 7,
    trigger: 'start_of_match',
    maxDurability: 45,
    price: 150,
  },
  {
    name: 'Elmo de Musgo',
    imageUrl: getEquipmentImageUrl('raiz', 'elmo'),
    slotType: 'elmo',
    collectionId: 'raiz',
    rarity: 'basico',
    stat: 'hp',
    value: 24,
    trigger: 'start_of_match',
    maxDurability: 50,
    price: 150,
  },
  {
    name: 'Botas da Floresta',
    imageUrl: getEquipmentImageUrl('raiz', 'botas'),
    slotType: 'botas',
    collectionId: 'raiz',
    rarity: 'epico',
    stat: 'vel',
    value: 10,
    trigger: 'start_of_match',
    maxDurability: 50,
    price: 380,
  },
  {
    name: 'Amuleto da Seiva',
    imageUrl: getEquipmentImageUrl('raiz', 'amuleto'),
    slotType: 'amuleto',
    collectionId: 'raiz',
    rarity: 'epico',
    stat: 'heal',
    value: 16,
    trigger: 'end_of_turn',
    maxDurability: 50,
    price: 380,
  },

  // 5. Éter Arcano
  {
    name: 'Cajado de Éter',
    imageUrl: getEquipmentImageUrl('arcano', 'arma'),
    slotType: 'arma',
    collectionId: 'arcano',
    rarity: 'epico',
    stat: 'atk',
    value: 15,
    trigger: 'start_of_match',
    targetPrecedence: 'arcano',
    maxDurability: 50,
    price: 380,
  },
  {
    name: 'Diadema Arcano',
    imageUrl: getEquipmentImageUrl('arcano', 'elmo'),
    slotType: 'elmo',
    collectionId: 'arcano',
    rarity: 'lendario',
    stat: 'hp',
    value: 55,
    trigger: 'start_of_match',
    targetPrecedence: 'arcano',
    maxDurability: 65,
    price: 850,
  },
  {
    name: 'Botas de Mana',
    imageUrl: getEquipmentImageUrl('arcano', 'botas'),
    slotType: 'botas',
    collectionId: 'arcano',
    rarity: 'epico',
    stat: 'vel',
    value: 12,
    trigger: 'start_of_match',
    maxDurability: 50,
    price: 380,
  },
  {
    name: 'Orbe do Éter',
    imageUrl: getEquipmentImageUrl('arcano', 'amuleto'),
    slotType: 'amuleto',
    collectionId: 'arcano',
    rarity: 'lendario',
    stat: 'damage_enemies',
    value: 22,
    trigger: 'start_of_match',
    maxDurability: 65,
    price: 850,
  },

  // 6. Fúria Nórdica
  {
    name: 'Machado de Asgard',
    imageUrl: getEquipmentImageUrl('nordica', 'arma'),
    slotType: 'arma',
    collectionId: 'nordica',
    rarity: 'lendario',
    stat: 'atk',
    value: 22,
    trigger: 'start_of_match',
    targetPrecedence: 'furia',
    maxDurability: 65,
    price: 850,
  },
  {
    name: 'Elmo de Valhalla',
    imageUrl: getEquipmentImageUrl('nordica', 'elmo'),
    slotType: 'elmo',
    collectionId: 'nordica',
    rarity: 'epico',
    stat: 'hp',
    value: 38,
    trigger: 'start_of_match',
    maxDurability: 50,
    price: 380,
  },
  {
    name: 'Botas do Berserker',
    imageUrl: getEquipmentImageUrl('nordica', 'botas'),
    slotType: 'botas',
    collectionId: 'nordica',
    rarity: 'epico',
    stat: 'vel',
    value: 11,
    trigger: 'start_of_match',
    maxDurability: 50,
    price: 380,
  },
  {
    name: 'Runa da Fúria',
    imageUrl: getEquipmentImageUrl('nordica', 'amuleto'),
    slotType: 'amuleto',
    collectionId: 'nordica',
    rarity: 'basico',
    stat: 'atk',
    value: 8,
    trigger: 'start_of_match',
    targetPrecedence: 'furia',
    maxDurability: 45,
    price: 150,
  },

  // 7. Astúcia da Selva
  {
    name: 'Garras da Selva',
    imageUrl: getEquipmentImageUrl('selva', 'arma'),
    slotType: 'arma',
    collectionId: 'selva',
    rarity: 'epico',
    stat: 'atk',
    value: 13,
    trigger: 'start_of_match',
    targetPrecedence: 'astucia',
    maxDurability: 50,
    price: 380,
  },
  {
    name: 'Máscara Tribal',
    imageUrl: getEquipmentImageUrl('selva', 'elmo'),
    slotType: 'elmo',
    collectionId: 'selva',
    rarity: 'basico',
    stat: 'hp',
    value: 22,
    trigger: 'start_of_match',
    maxDurability: 45,
    price: 150,
  },
  {
    name: 'Botas da Pantera',
    imageUrl: getEquipmentImageUrl('selva', 'botas'),
    slotType: 'botas',
    collectionId: 'selva',
    rarity: 'epico',
    stat: 'vel',
    value: 14,
    trigger: 'start_of_match',
    targetPrecedence: 'astucia',
    maxDurability: 50,
    price: 380,
  },
  {
    name: 'Totem da Mata',
    imageUrl: getEquipmentImageUrl('selva', 'amuleto'),
    slotType: 'amuleto',
    collectionId: 'selva',
    rarity: 'lendario',
    stat: 'heal',
    value: 20,
    trigger: 'end_of_turn',
    maxDurability: 65,
    price: 850,
  },

  // 8. Pacto Carmesim
  {
    name: 'Espada Carmesim',
    imageUrl: getEquipmentImageUrl('sangue', 'arma'),
    slotType: 'arma',
    collectionId: 'sangue',
    rarity: 'epico',
    stat: 'atk',
    value: 14,
    trigger: 'start_of_match',
    maxDurability: 50,
    price: 380,
  },
  {
    name: 'Elmo Rubro',
    imageUrl: getEquipmentImageUrl('sangue', 'elmo'),
    slotType: 'elmo',
    collectionId: 'sangue',
    rarity: 'epico',
    stat: 'hp',
    value: 34,
    trigger: 'start_of_match',
    maxDurability: 50,
    price: 380,
  },
  {
    name: 'Botas de Sangue',
    imageUrl: getEquipmentImageUrl('sangue', 'botas'),
    slotType: 'botas',
    collectionId: 'sangue',
    rarity: 'basico',
    stat: 'vel',
    value: 6,
    trigger: 'start_of_match',
    maxDurability: 45,
    price: 150,
  },
  {
    name: 'Cálice de Sangue',
    imageUrl: getEquipmentImageUrl('sangue', 'amuleto'),
    slotType: 'amuleto',
    collectionId: 'sangue',
    rarity: 'lendario',
    stat: 'damage_enemies',
    value: 25,
    trigger: 'start_of_match',
    maxDurability: 60,
    price: 850,
  },

  // 9. Gelo Eterno
  {
    name: 'Lança Glacial',
    imageUrl: getEquipmentImageUrl('gelo', 'arma'),
    slotType: 'arma',
    collectionId: 'gelo',
    rarity: 'basico',
    stat: 'atk',
    value: 7,
    trigger: 'start_of_match',
    maxDurability: 45,
    price: 150,
  },
  {
    name: 'Elmo Glacial',
    imageUrl: getEquipmentImageUrl('gelo', 'elmo'),
    slotType: 'elmo',
    collectionId: 'gelo',
    rarity: 'epico',
    stat: 'hp',
    value: 35,
    trigger: 'start_of_match',
    maxDurability: 50,
    price: 380,
  },
  {
    name: 'Botas da Geada',
    imageUrl: getEquipmentImageUrl('gelo', 'botas'),
    slotType: 'botas',
    collectionId: 'gelo',
    rarity: 'basico',
    stat: 'vel',
    value: 7,
    trigger: 'start_of_match',
    maxDurability: 45,
    price: 150,
  },
  {
    name: 'Amuleto Invernal',
    imageUrl: getEquipmentImageUrl('gelo', 'amuleto'),
    slotType: 'amuleto',
    collectionId: 'gelo',
    rarity: 'lendario',
    stat: 'shield',
    value: 35,
    trigger: 'start_of_match',
    maxDurability: 65,
    price: 850,
  },

  // 10. Ouro Solar
  {
    name: 'Espada Solar',
    imageUrl: getEquipmentImageUrl('solar', 'arma'),
    slotType: 'arma',
    collectionId: 'solar',
    rarity: 'lendario',
    stat: 'atk',
    value: 20,
    trigger: 'start_of_match',
    maxDurability: 65,
    price: 850,
  },
  {
    name: 'Coroa Solar',
    imageUrl: getEquipmentImageUrl('solar', 'elmo'),
    slotType: 'elmo',
    collectionId: 'solar',
    rarity: 'lendario',
    stat: 'hp',
    value: 60,
    trigger: 'start_of_match',
    maxDurability: 65,
    price: 850,
  },
  {
    name: 'Botas Douradas',
    imageUrl: getEquipmentImageUrl('solar', 'botas'),
    slotType: 'botas',
    collectionId: 'solar',
    rarity: 'lendario',
    stat: 'vel',
    value: 16,
    trigger: 'start_of_match',
    maxDurability: 65,
    price: 850,
  },
  {
    name: 'Medalhão do Sol',
    imageUrl: getEquipmentImageUrl('solar', 'amuleto'),
    slotType: 'amuleto',
    collectionId: 'solar',
    rarity: 'epico',
    stat: 'shield',
    value: 28,
    trigger: 'start_of_match',
    maxDurability: 50,
    price: 380,
  },
];

export function generateHeroShopCatalog(): HeroItemTemplate[] {
  return HERO_SHOP_CATALOG;
}

function instantiateTemplate(
  tpl: HeroItemTemplate,
  idPrefix: string
): HeroItem {
  return {
    ...tpl,
    id: `${idPrefix}-${tpl.collectionId}-${tpl.slotType}`,
    remainingDurability: tpl.maxDurability,
  };
}

export function createStarterHeroItems(): HeroItem[] {
  const byKey = (col: HeroCollectionId, slot: HeroSlotType) =>
    HERO_SHOP_CATALOG.find(
      (i) => i.collectionId === col && i.slotType === slot
    )!;

  return [
    instantiateTemplate(byKey('chamas', 'arma'), 'starter'),
    instantiateTemplate(byKey('chamas', 'elmo'), 'starter'),
    instantiateTemplate(byKey('vento', 'botas'), 'starter'),
    instantiateTemplate(byKey('ferro', 'amuleto'), 'starter'),
  ];
}

export function createDefaultHeroBuild(): HeroBuild {
  const starters = createStarterHeroItems();
  return {
    heroName: 'Herói Rúnico',
    skinId: HERO_SKINS[0].id,
    frameId: HERO_FRAMES[0].id,
    equipped: {
      arma: starters[0],
      elmo: starters[1],
      botas: starters[2],
      amuleto: starters[3],
    },
  };
}

/**
 * Generates a themed Enemy Hero Build for Campaign stages, scaling equipped pieces
 * from 1-2 items on early stages up to a full 4-piece set on Boss stages.
 */
export function createCampaignEnemyHeroBuild(params: {
  enemyName: string;
  collectionId: HeroCollectionId;
  stageNumber: 1 | 2 | 3 | 4 | 5;
  skinId?: string;
  frameId?: string;
}): HeroBuild {
  const colItems = HERO_SHOP_CATALOG.filter(
    (i) => i.collectionId === params.collectionId
  );
  const slotOrder: HeroSlotType[] = ['arma', 'elmo', 'botas', 'amuleto'];
  const count =
    params.stageNumber === 1
      ? 1
      : params.stageNumber === 2
        ? 2
        : params.stageNumber <= 4
          ? 3
          : 4;

  const equipped: Partial<Record<HeroSlotType, HeroItem>> = {};
  for (let idx = 0; idx < count; idx += 1) {
    const slot = slotOrder[idx];
    const tpl = colItems.find((i) => i.slotType === slot);
    if (tpl) {
      equipped[slot] = instantiateTemplate(
        tpl,
        `camp-s${params.stageNumber}`
      );
    }
  }

  return {
    heroName: params.enemyName,
    skinId: params.skinId ?? 'senhor_abismo',
    frameId:
      params.frameId ??
      (params.stageNumber === 5 ? 'frame_lendario' : 'frame_inimigo'),
    equipped,
  };
}

/**
 * Generates a random Enemy Hero Build for Skirmish / Random matches.
 */
export function generateRandomEnemyHeroBuild(
  enemyName = 'Lorde Glacial'
): HeroBuild {
  const skin = HERO_SKINS[Math.floor(Math.random() * HERO_SKINS.length)];
  const frame = HERO_FRAMES[Math.floor(Math.random() * HERO_FRAMES.length)];
  const colIds = Object.keys(HERO_COLLECTIONS) as HeroCollectionId[];
  const primaryCol = colIds[Math.floor(Math.random() * colIds.length)];
  const secondaryCol = colIds[Math.floor(Math.random() * colIds.length)];

  const pickForSlot = (slot: HeroSlotType, col: HeroCollectionId) => {
    const tpl = HERO_SHOP_CATALOG.find(
      (i) => i.collectionId === col && i.slotType === slot
    );
    return tpl ? instantiateTemplate(tpl, 'rand-enemy') : undefined;
  };

  return {
    heroName: enemyName,
    skinId: skin.id,
    frameId: frame.id,
    equipped: {
      arma: pickForSlot('arma', primaryCol),
      elmo: pickForSlot('elmo', primaryCol),
      botas: pickForSlot('botas', secondaryCol),
      amuleto:
        Math.random() > 0.35
          ? pickForSlot('amuleto', secondaryCol)
          : undefined,
    },
  };
}
