/**
 * P06: bounded fixpoint constraint propagation.
 *
 * The loop follows engine.propagation_algorithm.pseudocode. Each round tries every relation in both
 * directions; a round that produces nothing ends the fixpoint. Termination is guaranteed because
 * each round either adds at least one variable to a finite set or breaks.
 *
 * Three rules sit on top of the bare loop, and each exists because a tool meant to produce
 * auditable evidence cannot do otherwise:
 *
 *  - A user value is never overwritten. When a relation derives a value for a variable the user
 *    supplied, the two are compared and a disagreement beyond the tolerance becomes a Conflict for
 *    the user to resolve. Nothing is resolved automatically.
 *  - A relation that combines values stamped with different periods is blocked, not computed. The
 *    blocking reason names both periods.
 *  - Every derived value carries the relation that produced it, the variables it came from, and the
 *    generation it appeared in, so the derivation pane can trace any number back to an input.
 */

import { compute, computeInverse } from '../compute.ts';
import { DomainViolation, type LocalisedText } from '../errors.ts';
import { checkGuards, describeGuardReason } from '../validate/domain.ts';
import { VARIABLES } from '../variables/generated/registry.ts';
import {
  carriesPeriodStamp,
  toleranceFor,
  type Period,
  type UnitClass,
} from '../variables/units.ts';
import { buildGraph, requirementsFor, type RelationGraph } from './build.ts';
import type {
  BlockedRelation,
  Conflict,
  DerivationStep,
  Env,
  Magnitude,
  PropagationResult,
  Relation,
  Value,
  VariableId,
} from '../types.ts';

export interface PropagateOptions {
  /** The bound on the fixpoint. Twelve is far beyond the depth this corpus reaches. */
  readonly maxGenerations?: number;
  readonly graph?: RelationGraph;
  /** The workspace base period, used to stamp derived count and currency values. */
  readonly period?: Period;
  readonly now?: string;
}

const DEFAULT_MAX_GENERATIONS = 12;

export function propagate(
  known: ReadonlyMap<VariableId, Value>,
  options: PropagateOptions = {},
): PropagationResult {
  const graph = options.graph ?? buildGraph();
  const maxGenerations = options.maxGenerations ?? DEFAULT_MAX_GENERATIONS;
  const timestamp = options.now ?? new Date().toISOString();

  const derived = new Map<VariableId, Value>(known);
  const trail: DerivationStep[] = [];
  const blocked: BlockedRelation[] = [];
  const seenBlocks = new Set<string>();
  let generation = 0;

  const note = (entry: BlockedRelation): void => {
    const key = `${entry.formulaId}:${entry.direction}:${entry.target ?? ''}:${entry.reason}`;
    if (seenBlocks.has(key)) return;
    seenBlocks.add(key);
    blocked.push(entry);
  };

  while (generation < maxGenerations) {
    let producedThisRound = 0;

    for (const relation of graph.relations) {
      // Forward: every input known, output unknown, and the output is a single number.
      if (
        relation.output !== null &&
        relation.resultShape === 'scalar' &&
        !derived.has(relation.output) &&
        relation.inputs.every((variableId) => derived.has(variableId))
      ) {
        const produced = attempt(relation, 'forward', relation.output, relation.inputs);
        if (produced) producedThisRound += 1;
      }

      // Inverse: output plus all but one input known.
      for (const target of Object.keys(relation.inverses)) {
        if (derived.has(target)) continue;
        const needed = requirementsFor(relation, target);
        if (needed === null) continue;
        if (!needed.every((variableId) => derived.has(variableId))) continue;
        const produced = attempt(relation, 'inverse', target, needed);
        if (produced) producedThisRound += 1;
      }
    }

    if (producedThisRound === 0) break;
    generation += 1;
  }

  const conflicts = detectConflicts(graph, derived, note);

  return {
    derived,
    trail,
    blocked,
    conflicts,
    generations: generation,
    reachable: derived.size - known.size,
  };

  function attempt(
    relation: Relation,
    direction: 'forward' | 'inverse',
    target: VariableId,
    needed: readonly VariableId[],
  ): boolean {
    const env = envFrom(derived, needed);

    const periodProblem = periodConflict(relation, needed, derived);
    if (periodProblem !== null) {
      note({ formulaId: relation.formulaId, direction, target, ...periodProblem });
      return false;
    }

    const guarded = checkGuards(relation, env);
    if (!guarded.ok) {
      note({
        formulaId: relation.formulaId,
        direction,
        target,
        reason: guarded.reason,
        detail: describeGuardReason(relation, guarded.reason),
      });
      return false;
    }

    let magnitude: number;
    try {
      magnitude =
        direction === 'forward'
          ? (compute(relation, env) as number)
          : computeInverse(relation, target, env);
    } catch (error) {
      note({
        formulaId: relation.formulaId,
        direction,
        target,
        reason: error instanceof DomainViolation ? error.code : 'non_finite',
        detail:
          error instanceof DomainViolation
            ? error.messages
            : describeGuardReason(relation, 'non_finite'),
      });
      return false;
    }

    if (!Number.isFinite(magnitude)) {
      note({
        formulaId: relation.formulaId,
        direction,
        target,
        reason: 'non_finite',
        detail: describeGuardReason(relation, 'non_finite'),
      });
      return false;
    }

    derived.set(
      target,
      makeValue(target, magnitude, relation.formulaId, needed, generation + 1, timestamp, options),
    );
    trail.push({
      formulaId: relation.formulaId,
      direction,
      target,
      inputs: [...needed],
      env,
      magnitude,
      generation: generation + 1,
    });
    return true;
  }
}

function envFrom(values: ReadonlyMap<VariableId, Value>, needed: readonly VariableId[]): Env {
  const env: Record<VariableId, Magnitude> = {};
  for (const variableId of needed) {
    const value = values.get(variableId);
    if (value !== undefined) env[variableId] = value.magnitude;
  }
  return env;
}

function unitClassOf(variableId: VariableId): UnitClass {
  return VARIABLES.get(variableId)?.unitClass ?? 'ratio';
}

function makeValue(
  variableId: VariableId,
  magnitude: number,
  formulaId: string,
  derivedFrom: readonly VariableId[],
  depth: number,
  timestamp: string,
  options: PropagateOptions,
): Value {
  const unitClass = unitClassOf(variableId);
  const base: Value = {
    variableId,
    magnitude,
    unitClass,
    origin: 'derived',
    derivedBy: formulaId,
    derivedFrom: [...derivedFrom],
    confidence: 'exact',
    timestamp,
    depth,
  };
  if (options.period !== undefined && carriesPeriodStamp(unitClass)) {
    return { ...base, period: options.period };
  }
  return base;
}

/**
 * engine.unit_and_period_discipline: a relation that combines values stamped with different periods
 * is blocked, and the message names both periods.
 */
function periodConflict(
  relation: Relation,
  needed: readonly VariableId[],
  values: ReadonlyMap<VariableId, Value>,
): { reason: string; detail: LocalisedText } | null {
  const stamps = new Map<Period, VariableId>();
  for (const variableId of needed) {
    const value = values.get(variableId);
    if (value?.period === undefined) continue;
    if (!carriesPeriodStamp(value.unitClass)) continue;
    if (!stamps.has(value.period)) stamps.set(value.period, variableId);
  }
  if (stamps.size < 2) return null;

  const entries = [...stamps.entries()];
  const [firstPeriod, firstVariable] = entries[0] as [Period, VariableId];
  const [secondPeriod, secondVariable] = entries[1] as [Period, VariableId];
  const firstLabel = VARIABLES.get(firstVariable)?.label ?? {
    id: firstVariable,
    en: firstVariable,
  };
  const secondLabel = VARIABLES.get(secondVariable)?.label ?? {
    id: secondVariable,
    en: secondVariable,
  };

  return {
    reason: `period_mismatch:${firstPeriod}:${secondPeriod}`,
    detail: {
      id:
        `${relation.symbol} menggabungkan ${firstLabel.id} berperiode ${PERIOD_ID[firstPeriod]} ` +
        `dengan ${secondLabel.id} berperiode ${PERIOD_ID[secondPeriod]}. Samakan periodenya ` +
        `terlebih dahulu, dan konversinya akan dicatat pada daftar asumsi.`,
      en:
        `${relation.symbol} combines ${firstLabel.en} stamped ${firstPeriod} with ` +
        `${secondLabel.en} stamped ${secondPeriod}. Convert one of them first, and the conversion ` +
        `will be recorded in the assumption log.`,
    },
  };
}

const PERIOD_ID: Readonly<Record<Period, string>> = Object.freeze({
  daily: 'harian',
  weekly: 'mingguan',
  monthly: 'bulanan',
  quarterly: 'triwulanan',
  annual: 'tahunan',
});

/**
 * engine.conflict_detection: a user value is never overwritten, so a relation that would have
 * produced a different number for a variable the user supplied is reported rather than applied.
 */
function detectConflicts(
  graph: RelationGraph,
  derived: ReadonlyMap<VariableId, Value>,
  note: (entry: BlockedRelation) => void,
): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const relation of graph.relations) {
    if (relation.output === null || relation.resultShape !== 'scalar') continue;
    const stored = derived.get(relation.output);
    if (stored === undefined) continue;
    if (stored.origin !== 'user') continue;
    if (!relation.inputs.every((variableId) => derived.has(variableId))) continue;

    const env = envFrom(derived, relation.inputs);
    if (periodConflict(relation, relation.inputs, derived) !== null) continue;
    if (!checkGuards(relation, env).ok) continue;

    let candidate: number;
    try {
      candidate = compute(relation, env) as number;
    } catch {
      continue;
    }

    const userMagnitude = stored.magnitude;
    if (typeof userMagnitude !== 'number') continue;
    if (agrees(userMagnitude, candidate, stored.unitClass)) continue;

    const label = VARIABLES.get(relation.output)?.label ?? {
      id: relation.output,
      en: relation.output,
    };
    const relativeDifference =
      userMagnitude === 0
        ? Math.abs(candidate)
        : Math.abs((candidate - userMagnitude) / userMagnitude);

    conflicts.push({
      variableId: relation.output,
      userMagnitude,
      derivedMagnitude: candidate,
      formulaId: relation.formulaId,
      inputs: [...relation.inputs],
      relativeDifference,
      detail: {
        id:
          `Nilai ${label.id} yang Anda masukkan adalah ${userMagnitude}, sedangkan ${relation.symbol} ` +
          `menghitung ${candidate} dari ${relation.inputs.join(', ')}. Nilai masukan tidak diubah. ` +
          `Pilih nilai mana yang dipakai.`,
        en:
          `The ${label.en} you entered is ${userMagnitude}, while ${relation.symbol} computes ` +
          `${candidate} from ${relation.inputs.join(', ')}. Your value has not been changed. ` +
          `Choose which one to use.`,
      },
    });
  }

  // A conflict is also a reason a relation did not contribute, so it is visible in both places.
  for (const conflict of conflicts) {
    note({
      formulaId: conflict.formulaId,
      direction: 'forward',
      target: conflict.variableId,
      reason: 'conflict',
      detail: conflict.detail,
    });
  }

  return conflicts;
}

function agrees(userMagnitude: number, candidate: number, unitClass: UnitClass): boolean {
  const tolerance = toleranceFor(unitClass);
  if (tolerance.kind === 'absolute') return Math.abs(candidate - userMagnitude) <= tolerance.amount;
  if (userMagnitude === 0) return Math.abs(candidate) <= tolerance.amount;
  return Math.abs((candidate - userMagnitude) / userMagnitude) <= tolerance.amount;
}

/** Build the known map from plain user input. Every entry is origin 'user', depth 0. */
export function userValues(
  entries: Readonly<Record<VariableId, Magnitude>>,
  options: { period?: Period; now?: string } = {},
): Map<VariableId, Value> {
  const timestamp = options.now ?? new Date().toISOString();
  const values = new Map<VariableId, Value>();

  for (const [variableId, magnitude] of Object.entries(entries)) {
    const unitClass = unitClassOf(variableId);
    const base: Value = {
      variableId,
      magnitude,
      unitClass,
      origin: 'user',
      derivedBy: null,
      derivedFrom: [],
      confidence: 'exact',
      timestamp,
      depth: 0,
    };
    values.set(
      variableId,
      options.period !== undefined && carriesPeriodStamp(unitClass)
        ? { ...base, period: options.period }
        : base,
    );
  }
  return values;
}

/** A Value with origin 'user' always has depth 0 and derivedBy null. */
export function assertValueInvariant(value: Value): void {
  if (value.origin !== 'user') return;
  if (value.depth === 0 && value.derivedBy === null) return;
  throw new DomainViolation(
    {
      id: `Nilai masukan ${value.variableId} tidak boleh memiliki asal turunan.`,
      en: `The user value ${value.variableId} may not carry a derivation.`,
    },
    { variableIds: [value.variableId] },
  );
}
