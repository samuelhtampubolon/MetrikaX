/**
 * P06: the bipartite relation graph.
 *
 * Nodes are variables and relations. An edge joins a relation to every variable it can read and to
 * every variable it can write. Building the indexes once turns propagation from a scan over all 76
 * relations per round into a lookup, and it is what the underdetermination analysis walks
 * backwards.
 */

import { RELATION_LIST } from '../formulas/generated/index.ts';
import type { FormulaId, Relation, VariableId } from '../types.ts';

export interface RelationGraph {
  readonly relations: readonly Relation[];
  /** Every relation that reads this variable, in any direction. */
  readonly consumers: ReadonlyMap<VariableId, readonly Relation[]>;
  /** Every relation that can write this variable, forwards or through an inverse. */
  readonly producers: ReadonlyMap<VariableId, readonly Relation[]>;
  /** Every variable this relation can write. */
  readonly writable: ReadonlyMap<FormulaId, readonly VariableId[]>;
  readonly variableIds: readonly VariableId[];
}

export function buildGraph(relations: readonly Relation[] = RELATION_LIST): RelationGraph {
  const consumers = new Map<VariableId, Relation[]>();
  const producers = new Map<VariableId, Relation[]>();
  const writable = new Map<FormulaId, VariableId[]>();
  const variableIds = new Set<VariableId>();

  const push = (index: Map<VariableId, Relation[]>, key: VariableId, relation: Relation): void => {
    const existing = index.get(key);
    if (existing) existing.push(relation);
    else index.set(key, [relation]);
  };

  for (const relation of relations) {
    const writes: VariableId[] = [];

    for (const variableId of relation.inputs) {
      variableIds.add(variableId);
      push(consumers, variableId, relation);
    }

    if (relation.output !== null) {
      variableIds.add(relation.output);
      push(consumers, relation.output, relation);
      push(producers, relation.output, relation);
      writes.push(relation.output);
    }

    for (const target of Object.keys(relation.inverses)) {
      variableIds.add(target);
      push(producers, target, relation);
      if (!writes.includes(target)) writes.push(target);
    }

    writable.set(relation.formulaId, writes);
  }

  return {
    relations,
    consumers,
    producers,
    writable,
    variableIds: [...variableIds].sort(),
  };
}

/**
 * The variables a relation must already know to write `target`.
 *
 * Forwards that is every input. Backwards it is the output plus every input except the target
 * itself, which is exactly what the inverse expression reads.
 */
export function requirementsFor(relation: Relation, target: VariableId): VariableId[] | null {
  if (relation.output === target) return [...relation.inputs];
  if (!(target in relation.inverses)) return null;
  const needed: VariableId[] = relation.inputs.filter((variableId) => variableId !== target);
  if (relation.output !== null) needed.push(relation.output);
  return needed;
}
