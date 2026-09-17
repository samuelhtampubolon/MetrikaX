/**
 * P09: the five grouping modes for the formula tree, and the search filter.
 *
 * The grouping is the taxonomy made navigable. A learner who groups by stratum sees the ladder of
 * difficulty; one who groups by phase sees the marketing workflow; one who groups by structural
 * class sees that CTR and churn are the same operation on different nouns. That last view is the
 * one the taxonomy exists for, so it is offered on the same footing as the others.
 */

import { RELATION_LIST, type Relation } from '@metrika/engine';
import type { TreeNode } from '@metrika/ui';
import type { Grouping } from '../state/calculator.ts';
import type { Locale } from '../locale/index.ts';

export interface TreeContext {
  readonly locale: Locale;
  readonly t: (key: string) => string;
  readonly search: string;
}

/** Matches the symbol, the Indonesian name and the English name, as SCR-CALC requires. */
export function matchesSearch(relation: Relation, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (needle === '') return true;
  return (
    relation.symbol.toLowerCase().includes(needle) ||
    relation.formulaId.toLowerCase().includes(needle) ||
    relation.name.id.toLowerCase().includes(needle) ||
    relation.name.en.toLowerCase().includes(needle)
  );
}

export function filterRelations(search: string): Relation[] {
  return RELATION_LIST.filter((relation) => matchesSearch(relation, search));
}

const GROUP_OF: Readonly<
  Record<Exclude<Grouping, 'alphabetical'>, (relation: Relation) => string>
> = {
  stratum: (relation) => relation.taxonomy.stratum,
  phase: (relation) => relation.taxonomy.phase,
  class: (relation) => relation.taxonomy.structuralClass,
  domain: (relation) => relation.taxonomy.decisionDomain,
};

/** Roman numerals sort as text in the wrong order, so the stratum order is stated. */
const STRATUM_ORDER = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

function groupOrder(grouping: Grouping, code: string): number {
  if (grouping === 'stratum') {
    const index = STRATUM_ORDER.indexOf(code);
    return index === -1 ? STRATUM_ORDER.length : index;
  }
  const digits = code.replace(/\D/g, '');
  return digits === '' ? 0 : Number(digits);
}

export function buildTree(grouping: Grouping, context: TreeContext): TreeNode[] {
  const relations = filterRelations(context.search);
  const leafLabel = (relation: Relation): string =>
    `${relation.symbol}  ${context.t(`formula.${relation.formulaId}.name`)}`;

  if (grouping === 'alphabetical') {
    return [...relations]
      .sort((a, b) => a.symbol.localeCompare(b.symbol))
      .map((relation) => ({ kind: 'leaf', id: relation.formulaId, label: leafLabel(relation) }));
  }

  const key = GROUP_OF[grouping];
  const buckets = new Map<string, Relation[]>();
  for (const relation of relations) {
    const code = key(relation);
    const existing = buckets.get(code);
    if (existing) existing.push(relation);
    else buckets.set(code, [relation]);
  }

  return [...buckets.entries()]
    .sort((a, b) => groupOrder(grouping, a[0]) - groupOrder(grouping, b[0]))
    .map(([code, members]) => ({
      kind: 'branch' as const,
      id: `group:${code}`,
      label: `${code}  (${members.length})`,
      children: members
        .sort((a, b) => a.symbol.localeCompare(b.symbol))
        .map((relation) => ({
          kind: 'leaf' as const,
          id: relation.formulaId,
          label: leafLabel(relation),
        })),
    }));
}
