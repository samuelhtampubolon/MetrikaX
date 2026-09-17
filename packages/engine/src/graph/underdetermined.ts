/**
 * P06: underdetermination analysis.
 *
 * engine.underdetermination: when the user asks for a target that propagation cannot reach, do not
 * return an error code. Compute the minimal set of additional variables that would unlock it and
 * name them.
 *
 * The algorithm runs reverse reachability from the target, recursing to a depth of three, ranks the
 * candidate frontiers by how few variables each asks for and then by how much each would unlock,
 * and returns the best three as sentences a person can act on.
 */

import { VARIABLES } from '../variables/generated/registry.ts';
import { buildGraph, requirementsFor, type RelationGraph } from './build.ts';
import type { LocalisedText } from '../errors.ts';
import type { VariableId } from '../types.ts';

const MAX_DEPTH = 3;
const MAX_FRONTIERS = 3;

export interface Frontier {
  /** The variables the user would have to supply. */
  readonly missing: readonly VariableId[];
  /** The relations that would fire once they are supplied. */
  readonly via: readonly string[];
  /** How many further variables this frontier would unlock, the target included. */
  readonly unlocks: number;
  readonly sentence: LocalisedText;
}

export interface UnderdeterminationReport {
  readonly target: VariableId;
  readonly reachable: boolean;
  readonly frontiers: readonly Frontier[];
  readonly message: LocalisedText;
}

export function analyseUnderdetermination(
  target: VariableId,
  known: ReadonlySet<VariableId>,
  options: { graph?: RelationGraph } = {},
): UnderdeterminationReport {
  const graph = options.graph ?? buildGraph();

  if (known.has(target)) {
    return {
      target,
      reachable: true,
      frontiers: [],
      message: sentenceForReachable(target),
    };
  }

  const candidates = collect(target, known, graph, MAX_DEPTH, new Set([target]));

  // Rank by cardinality first, then by how many other variables each frontier would also unlock.
  const ranked = dedupe(candidates)
    .map((candidate) => ({
      ...candidate,
      unlocks: countUnlocked(candidate.missing, known, graph),
    }))
    .sort((a, b) => a.missing.length - b.missing.length || b.unlocks - a.unlocks)
    .slice(0, MAX_FRONTIERS)
    .map(
      (candidate): Frontier => ({
        missing: candidate.missing,
        via: candidate.via,
        unlocks: candidate.unlocks,
        sentence: sentenceForFrontier(candidate.missing),
      }),
    );

  return {
    target,
    reachable: false,
    frontiers: ranked,
    message: sentenceForReport(target, ranked),
  };
}

interface Candidate {
  readonly missing: readonly VariableId[];
  readonly via: readonly string[];
}

function collect(
  target: VariableId,
  known: ReadonlySet<VariableId>,
  graph: RelationGraph,
  depth: number,
  visiting: ReadonlySet<VariableId>,
): Candidate[] {
  if (depth <= 0) return [];
  const producers = graph.producers.get(target) ?? [];
  const found: Candidate[] = [];

  for (const relation of producers) {
    const needed = requirementsFor(relation, target);
    if (needed === null) continue;

    const missing = needed.filter((variableId) => !known.has(variableId));
    if (missing.length === 0) continue; // already reachable through this relation
    found.push({ missing: [...missing].sort(), via: [relation.formulaId] });

    // Recurse: each missing input might itself be derivable from something else the user could
    // supply, which can produce a smaller frontier than asking for the input directly.
    if (depth > 1 && missing.length <= 3) {
      for (const step of missing) {
        if (visiting.has(step)) continue;
        const nested = collect(step, known, graph, depth - 1, new Set([...visiting, step]));
        for (const candidate of nested) {
          const combined = new Set(missing.filter((variableId) => variableId !== step));
          for (const variableId of candidate.missing) combined.add(variableId);
          if (combined.size === 0 || combined.size > 4) continue;
          found.push({
            missing: [...combined].sort(),
            via: [relation.formulaId, ...candidate.via],
          });
        }
      }
    }
  }

  return found;
}

function dedupe(candidates: readonly Candidate[]): Candidate[] {
  const seen = new Map<string, Candidate>();
  for (const candidate of candidates) {
    const key = candidate.missing.join('|');
    const existing = seen.get(key);
    if (existing === undefined || candidate.via.length < existing.via.length) {
      seen.set(key, candidate);
    }
  }
  return [...seen.values()];
}

/** How many variables the graph would reach if this frontier were supplied. */
function countUnlocked(
  frontier: readonly VariableId[],
  known: ReadonlySet<VariableId>,
  graph: RelationGraph,
): number {
  const available = new Set<VariableId>([...known, ...frontier]);
  let added = 0;

  for (let round = 0; round < MAX_DEPTH; round += 1) {
    let producedThisRound = 0;
    for (const relation of graph.relations) {
      const writes = graph.writable.get(relation.formulaId) ?? [];
      for (const write of writes) {
        if (available.has(write)) continue;
        const needed = requirementsFor(relation, write);
        if (needed === null) continue;
        if (!needed.every((variableId) => available.has(variableId))) continue;
        available.add(write);
        producedThisRound += 1;
        added += 1;
      }
    }
    if (producedThisRound === 0) break;
  }
  return added;
}

function labelOf(variableId: VariableId): LocalisedText {
  return VARIABLES.get(variableId)?.label ?? { id: variableId, en: variableId };
}

function joinLabels(variableIds: readonly VariableId[], locale: 'id' | 'en'): string {
  const labels = variableIds.map((variableId) => labelOf(variableId)[locale]);
  if (labels.length === 1) return labels[0] as string;
  const last = labels[labels.length - 1] as string;
  const rest = labels.slice(0, -1).join(', ');
  return locale === 'id' ? `${rest} dan ${last}` : `${rest} and ${last}`;
}

function sentenceForFrontier(missing: readonly VariableId[]): LocalisedText {
  return {
    id: joinLabels(missing, 'id'),
    en: joinLabels(missing, 'en'),
  };
}

function sentenceForReachable(target: VariableId): LocalisedText {
  const label = labelOf(target);
  return {
    id: `${label.id} sudah tersedia.`,
    en: `${label.en} is already available.`,
  };
}

function sentenceForReport(target: VariableId, frontiers: readonly Frontier[]): LocalisedText {
  const label = labelOf(target);
  if (frontiers.length === 0) {
    return {
      id:
        `${label.id} belum dapat dihitung, dan tidak ada rumus pada korpus ini yang menghasilkannya ` +
        `dari nilai yang sudah ada.`,
      en:
        `${label.en} cannot be computed yet, and no relation in this corpus produces it from the ` +
        `values already entered.`,
    };
  }

  const options = (locale: 'id' | 'en'): string =>
    frontiers
      .map((frontier, index) => `(${index + 1}) ${frontier.sentence[locale]}`)
      .join(locale === 'id' ? '; ' : '; ');

  return {
    id: `${label.id} belum dapat dihitung. Tambahkan salah satu dari: ${options('id')}.`,
    en: `${label.en} cannot be computed yet. Add one of: ${options('en')}.`,
  };
}
