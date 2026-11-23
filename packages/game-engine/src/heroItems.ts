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
  | 'tempestade'
  | 'solar'
  | 'sombras'
  | 'tita'
  | 'amazonico'
  | 'templaria';

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
  tempestade: {
    id: 'tempestade',
    name: 'Tempestade Rúnica',
    themeColor: 'text-indigo-300',
    badgeBg: 'bg-indigo-500/20 border-indigo-400/60 text-indigo-200',
    lore: 'Raios que aceleram aliados e atingem o campo inimigo.',
    tiers: [
      {
        requiredPieces: 2,
        name: 'Passo Relâmpago',
        description: 'No início do jogo, +12 VEL para todos os aliados.',
        effects: [
          {
            stat: 'vel',
            value: 12,
            trigger: 'start_of_match',
            label: 'Passo Relâmpago',
          },
        ],
      },
      {
        requiredPieces: 4,
        name: 'Trovão Inicial',
        description:
          'No início do jogo, causa 24 de dano a todos os inimigos.',
        effects: [
          {
            stat: 'damage_enemies',
            value: 24,
            trigger: 'start_of_match',
            label: 'Trovão Inicial',
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
  sombras: {
    id: 'sombras',
    name: 'Sombras do Abismo',
    themeColor: 'text-violet-300',
    badgeBg: 'bg-violet-500/20 border-violet-400/60 text-violet-200',
    lore: 'Emboscada sombria que enfraquece adversários desde o início.',
    tiers: [
      {
        requiredPieces: 2,
        name: 'Golpe das Sombras',
        description:
          'No início do jogo, causa 20 de dano a todos os inimigos.',
        effects: [
          {
            stat: 'damage_enemies',
            value: 20,
            trigger: 'start_of_match',
            label: 'Golpe das Sombras',
          },
        ],
      },
      {
        requiredPieces: 3,
        name: 'Sussurro Sombrio',
        description: 'No início do turno, +10 ATK para todos os aliados.',
        effects: [
          {
            stat: 'atk',
            value: 10,
            trigger: 'start_of_turn',
            label: 'Sussurro Sombrio',
          },
        ],
      },
    ],
  },
  tita: {
    id: 'tita',
    name: 'Titã de Pedra',
    themeColor: 'text-stone-300',
    badgeBg: 'bg-stone-500/25 border-stone-400/60 text-stone-200',
    lore: 'Vitalidade colossal e escudos renovados ao fim do turno.',
    tiers: [
      {
        requiredPieces: 2,
        name: 'Corpo Colossal',
        description: 'No início do jogo, +35 HP para todos os aliados.',
        effects: [
          {
            stat: 'hp',
            value: 35,
            trigger: 'start_of_match',
            label: 'Corpo Colossal',
          },
        ],
      },
      {
        requiredPieces: 4,
        name: 'Bastião Eterno',
        description: 'No fim do turno, +25 de Escudo para todos os aliados.',
        effects: [
          {
            stat: 'shield',
            value: 25,
            trigger: 'end_of_turn',
            label: 'Bastião Eterno',
          },
        ],
      },
    ],
  },
  amazonico: {
    id: 'amazonico',
    name: 'Espírito Amazônico',
    themeColor: 'text-teal-300',
    badgeBg: 'bg-teal-500/20 border-teal-400/60 text-teal-200',
    lore: 'Proteção espiritual das águas e florestas antigas.',
    tiers: [
      {
        requiredPieces: 2,
        name: 'Canto de Cura',
        description: 'No fim do turno, recupera +15 HP de todos os aliados.',
        effects: [
          {
            stat: 'heal',
            value: 15,
            trigger: 'end_of_turn',
            label: 'Canto de Cura',
          },
        ],
      },
      {
        requiredPieces: 3,
        name: 'Sopro dos Espíritos',
        description:
          'No início do jogo, +12 VEL para aliados de Astúcia e Arcano.',
        effects: [
          {
            stat: 'vel',
            value: 12,
            trigger: 'start_of_match',
            targetPrecedence: ['astucia', 'arcano'],
            label: 'Sopro dos Espíritos',
          },
        ],
      },
    ],
  },
  templaria: {
    id: 'templaria',
    name: 'Ordem Templária',
    themeColor: 'text-yellow-200',
    badgeBg: 'bg-yellow-500/20 border-yellow-400/60 text-yellow-100',
    lore: 'Disciplina sagrada que une ataque, defesa e regeneração.',
    tiers: [
      {
        requiredPieces: 2,
        name: 'Voto Sagrado',
        description:
          'No início do jogo, +20 Escudo e +10 ATK para todos os aliados.',
        effects: [
          {
            stat: 'shield',
            value: 20,
            trigger: 'start_of_match',
            label: 'Voto Sagrado',
          },
          {
            stat: 'atk',
            value: 10,
            trigger: 'start_of_match',
            label: 'Espada Consagrada',
          },
        ],
      },
      {
        requiredPieces: 4,
        name: 'Luz Redentora',
        description: 'No fim do turno, recupera +20 HP de todos os aliados.',
        effects: [
          {
            stat: 'heal',
            value: 20,
            trigger: 'end_of_turn',
            label: 'Luz Redentora',
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
    imageUrl: '/UI/hud_portrait_frame_enemy.png',
    ringColor: 'border-orange-400',
    glowClass: 'shadow-[0_0_20px_rgba(249,115,22,0.7)]',
    price: 450,
    unlockHint: 'Mercado / Eventos',
  },
  {
    id: 'frame_arcano',
    name: 'Coroa Arcana',
    imageUrl: '/UI/hud_portrait_frame_ally.png',
    ringColor: 'border-cyan-400',
    glowClass: 'shadow-[0_0_20px_rgba(34,211,238,0.65)]',
    price: 450,
    unlockHint: 'Mercado / Eventos',
  },
  {
    id: 'frame_lendario',
    name: 'Relíquia Dourada',
    imageUrl: '/UI/hud_portrait_frame_ally.png',
    ringColor: 'border-yellow-300',
    glowClass: 'shadow-[0_0_24px_rgba(250,204,21,0.8)]',
    price: 900,
    unlockHint: 'Lendária',
  },
];

export function formatItemEffect(item: HeroItem): string {
  const statLabel = STAT_LABELS[item.stat];
  const sign = item.stat === 'damage_enemies' || item.stat === 'damage_allies' ? '' : '+';
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
    .filter((item): item is HeroItem => Boolean(item && item.remainingDurability > 0));
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

export function createStarterHeroItems(): HeroItem[] {
  return [
    {
      id: 'starter-arma-chamas',
      name: 'Espada das Chamas',
      slotType: 'arma',
      collectionId: 'chamas',
      rarity: 'basico',
      stat: 'atk',
      value: 5,
      trigger: 'start_of_turn',
      maxDurability: 50,
      remainingDurability: 50,
      price: 150,
    },
    {
      id: 'starter-elmo-chamas',
      name: 'Elmo das Chamas',
      slotType: 'elmo',
      collectionId: 'chamas',
      rarity: 'basico',
      stat: 'hp',
      value: 20,
      trigger: 'start_of_match',
      maxDurability: 50,
      remainingDurability: 50,
      price: 150,
    },
    {
      id: 'starter-botas-vento',
      name: 'Botas do Vento',
      slotType: 'botas',
      collectionId: 'vento',
      rarity: 'basico',
      stat: 'vel',
      value: 6,
      trigger: 'start_of_match',
      maxDurability: 45,
      remainingDurability: 45,
      price: 150,
    },
    {
      id: 'starter-amuleto-ferro',
      name: 'Amuleto do Bastião',
      slotType: 'amuleto',
      collectionId: 'ferro',
      rarity: 'basico',
      stat: 'shield',
      value: 18,
      trigger: 'start_of_match',
      maxDurability: 50,
      remainingDurability: 50,
      price: 150,
    },
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

export function generateHeroShopCatalog(): Omit<
  HeroItem,
  'id' | 'remainingDurability'
>[] {
  const items: Omit<HeroItem, 'id' | 'remainingDurability'>[] = [
    // Chamas
    {
      name: 'Lâmina das Chamas',
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
      name: 'Machado Vulcânico',
      slotType: 'arma',
      collectionId: 'chamas',
      rarity: 'epico',
      stat: 'atk',
      value: 12,
      trigger: 'start_of_match',
      maxDurability: 50,
      price: 380,
    },
    {
      name: 'Amuleto da Brasa',
      slotType: 'amuleto',
      collectionId: 'chamas',
      rarity: 'lendario',
      stat: 'damage_enemies',
      value: 20,
      trigger: 'end_of_turn',
      maxDurability: 65,
      price: 850,
    },
    // Bastião de Ferro
    {
      name: 'Elmo de Ferro',
      slotType: 'elmo',
      collectionId: 'ferro',
      rarity: 'basico',
      stat: 'hp',
      value: 20,
      trigger: 'start_of_match',
      maxDurability: 50,
      price: 150,
    },
    {
      name: 'Coroa do Bastião',
      slotType: 'elmo',
      collectionId: 'ferro',
      rarity: 'epico',
      stat: 'hp',
      value: 38,
      trigger: 'start_of_match',
      maxDurability: 55,
      price: 380,
    },
    {
      name: 'Amuleto Égide',
      slotType: 'amuleto',
      collectionId: 'ferro',
      rarity: 'lendario',
      stat: 'shield',
      value: 40,
      trigger: 'start_of_match',
      maxDurability: 65,
      price: 850,
    },
    // Vento Cortante
    {
      name: 'Botas Aladas',
      slotType: 'botas',
      collectionId: 'vento',
      rarity: 'basico',
      stat: 'vel',
      value: 6,
      trigger: 'start_of_match',
      maxDurability: 45,
      price: 150,
    },
    {
      name: 'Grevas da Brisa',
      slotType: 'botas',
      collectionId: 'vento',
      rarity: 'epico',
      stat: 'vel',
      value: 12,
      trigger: 'start_of_match',
      maxDurability: 50,
      price: 380,
    },
    {
      name: 'Talismã do Furacão',
      slotType: 'amuleto',
      collectionId: 'vento',
      rarity: 'lendario',
      stat: 'vel',
      value: 18,
      trigger: 'start_of_match',
      maxDurability: 65,
      price: 850,
    },
    // Raiz Ancestral
    {
      name: 'Elmo de Musgo',
      slotType: 'elmo',
      collectionId: 'raiz',
      rarity: 'basico',
      stat: 'hp',
      value: 22,
      trigger: 'start_of_match',
      maxDurability: 50,
      price: 150,
    },
    {
      name: 'Amuleto da Seiva',
      slotType: 'amuleto',
      collectionId: 'raiz',
      rarity: 'epico',
      stat: 'heal',
      value: 16,
      trigger: 'end_of_turn',
      maxDurability: 50,
      price: 380,
    },
    // Éter Arcano
    {
      name: 'Cajado de Éter',
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
    // Fúria Nórdica
    {
      name: 'Machado de Asgard',
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
      name: 'Botas do Berserker',
      slotType: 'botas',
      collectionId: 'nordica',
      rarity: 'epico',
      stat: 'vel',
      value: 11,
      trigger: 'start_of_match',
      maxDurability: 50,
      price: 380,
    },
    // Pacto Carmesim
    {
      name: 'Espada Carmesim',
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
      name: 'Cálice de Sangue',
      slotType: 'amuleto',
      collectionId: 'sangue',
      rarity: 'lendario',
      stat: 'damage_enemies',
      value: 25,
      trigger: 'start_of_match',
      maxDurability: 60,
      price: 850,
    },
    // Gelo Eterno
    {
      name: 'Elmo Glacial',
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
      slotType: 'botas',
      collectionId: 'gelo',
      rarity: 'basico',
      stat: 'vel',
      value: 7,
      trigger: 'start_of_match',
      maxDurability: 45,
      price: 150,
    },
    // Ouro Solar
    {
      name: 'Coroa Solar',
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
      slotType: 'botas',
      collectionId: 'solar',
      rarity: 'lendario',
      stat: 'vel',
      value: 16,
      trigger: 'start_of_match',
      maxDurability: 65,
      price: 850,
    },
    // Sombras do Abismo
    {
      name: 'Adaga Abissal',
      slotType: 'arma',
      collectionId: 'sombras',
      rarity: 'epico',
      stat: 'atk',
      value: 13,
      trigger: 'start_of_match',
      maxDurability: 50,
      price: 380,
    },
    // Titã de Pedra
    {
      name: 'Elmo do Titã',
      slotType: 'elmo',
      collectionId: 'tita',
      rarity: 'lendario',
      stat: 'hp',
      value: 65,
      trigger: 'start_of_match',
      maxDurability: 65,
      price: 850,
    },
    // Espírito Amazônico
    {
      name: 'Amuleto da Floresta',
      slotType: 'amuleto',
      collectionId: 'amazonico',
      rarity: 'epico',
      stat: 'heal',
      value: 15,
      trigger: 'end_of_turn',
      maxDurability: 50,
      price: 380,
    },
    // Ordem Templária
    {
      name: 'Espada Templária',
      slotType: 'arma',
      collectionId: 'templaria',
      rarity: 'epico',
      stat: 'atk',
      value: 12,
      trigger: 'start_of_match',
      maxDurability: 50,
      price: 380,
    },
    // Astúcia da Selva
    {
      name: 'Botas da Pantera',
      slotType: 'botas',
      collectionId: 'selva',
      rarity: 'epico',
      stat: 'vel',
      value: 12,
      trigger: 'start_of_match',
      targetPrecedence: 'astucia',
      maxDurability: 50,
      price: 380,
    },
    // Tempestade Rúnica
    {
      name: 'Lança do Trovão',
      slotType: 'arma',
      collectionId: 'tempestade',
      rarity: 'lendario',
      stat: 'atk',
      value: 20,
      trigger: 'start_of_match',
      maxDurability: 65,
      price: 850,
    },
  ];
  return items;
}
