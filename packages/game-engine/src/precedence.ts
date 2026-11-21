import type { Precedence } from './types.ts';

export type PrecedenceRelation = 'advantage' | 'disadvantage' | 'neutral';

/**
 * Ciclo de Precedência (GDD 2.2):
 * Fúria (Vermelho) vence Astúcia (Verde), perde para Arcano (Azul)
 * Astúcia (Verde) vence Arcano (Azul), perde para Fúria (Vermelho)
 * Arcano (Azul) vence Fúria (Vermelho), perde para Astúcia (Verde)
 */
export function getPrecedenceRelation(
  attacker: Precedence,
  defender: Precedence
): PrecedenceRelation {
  if (attacker === defender) return 'neutral';
  if (
    (attacker === 'furia' && defender === 'astucia') ||
    (attacker === 'astucia' && defender === 'arcano') ||
    (attacker === 'arcano' && defender === 'furia')
  ) {
    return 'advantage';
  }
  return 'disadvantage';
}

/**
 * Vantagem: +50% arredondado para cima.
 * Desvantagem: -25% (arredondado, mínimo 1).
 */
export function calculatePrecedenceDamage(
  baseDamage: number,
  attacker: Precedence,
  defender: Precedence
): { damage: number; relation: PrecedenceRelation } {
  const relation = getPrecedenceRelation(attacker, defender);
  if (relation === 'advantage') {
    return { damage: Math.ceil(baseDamage * 1.5), relation };
  }
  if (relation === 'disadvantage') {
    return { damage: Math.max(1, Math.round(baseDamage * 0.75)), relation };
  }
  return { damage: baseDamage, relation };
}

export const PRECEDENCE_META: Record<
  Precedence,
  { label: string; colorHex: string; beats: Precedence }
> = {
  furia: { label: 'Fúria', colorHex: '#dc2626', beats: 'astucia' },
  astucia: { label: 'Astúcia', colorHex: '#16a34a', beats: 'arcano' },
  arcano: { label: 'Arcano', colorHex: '#2563eb', beats: 'furia' },
};
