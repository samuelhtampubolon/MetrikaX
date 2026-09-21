/**
 * P17: the item generator.
 *
 * gamification.challenge_types names seven kinds of exercise. Each is generated here from the
 * specification's own material: the worked examples, the failure modes, the interpretation bands,
 * the structural classes and the relation graph. Nothing in this module writes a sentence. An item
 * carries the references an interface needs to look the text up in the locale catalogue, which is
 * what keeps ADR-006 intact: there is no English here waiting to be translated, and no Indonesian
 * either.
 *
 * Every generator takes a seed and draws from it alone, so an item can be produced again exactly.
 * A learner told their answer was wrong is owed the item they actually saw.
 */

import { compute } from '../compute.ts';
import { EngineError } from '../errors.ts';
import { RELATIONS, RELATION_LIST } from '../formulas/generated/index.ts';
import { VARIABLES } from '../variables/generated/registry.ts';
import { buildGraph, type RelationGraph } from '../graph/build.ts';
import { propagate, userValues } from '../graph/propagate.ts';
import { makeRng, type Rng } from './rng.ts';
import { sampleEnv } from './sample.ts';
import type { Env, Magnitude, Relation, VariableId } from '../types.ts';

export type ItemType =
  | 'forward_compute'
  | 'inverse_solve'
  | 'spot_the_error'
  | 'interpret_the_band'
  | 'choose_the_metric'
  | 'chain_derivation'
  | 'audit_the_dashboard';

/** The multipliers the specification states, held here so the ledger and the generator agree. */
export const XP_MULTIPLIERS: Readonly<Record<ItemType, number>> = Object.freeze({
  forward_compute: 1,
  inverse_solve: 1.4,
  spot_the_error: 1.6,
  interpret_the_band: 1.2,
  choose_the_metric: 1.8,
  chain_derivation: 2.2,
  audit_the_dashboard: 3,
});

/** The rating from which a type is offered. The two hardest are gated, as the specification says. */
export const UNLOCKED_AT: Readonly<Record<ItemType, number>> = Object.freeze({
  forward_compute: 1,
  inverse_solve: 1,
  spot_the_error: 1,
  interpret_the_band: 1,
  choose_the_metric: 1,
  chain_derivation: 4,
  audit_the_dashboard: 7,
});

export interface GivenValue {
  readonly variableId: VariableId;
  readonly magnitude: Magnitude;
}

/** What an option stands for. The interface turns the reference into text through the catalogue. */
export type OptionRef =
  | { readonly kind: 'pitfall'; readonly formulaId: string; readonly index: number }
  | { readonly kind: 'band'; readonly formulaId: string; readonly index: number }
  | { readonly kind: 'formula'; readonly formulaId: string };

export interface ChoiceOption {
  readonly id: string;
  readonly ref: OptionRef;
}

interface ItemBase {
  readonly id: string;
  readonly type: ItemType;
  readonly formulaId: string;
  readonly seed: string;
  readonly xpMultiplier: number;
}

export interface NumericItem extends ItemBase {
  readonly kind: 'numeric';
  readonly given: readonly GivenValue[];
  readonly targetVariableId: VariableId;
  readonly answer: number;
  /** Relative tolerance, from the grading rule of this challenge type. */
  readonly tolerance: number;
  /** For a chain, how many generations of propagation separate the givens from the target. */
  readonly depth?: number;
}

export interface ChoiceItem extends ItemBase {
  readonly kind: 'choice';
  readonly given: readonly GivenValue[];
  /** The result the stem states, where the type shows one. */
  readonly shownResult: number | null;
  readonly options: readonly ChoiceOption[];
  readonly correctOptionId: string;
  /**
   * Words drawn from the formula's own name and from the labels of its inputs. A justification
   * that names none of them is a justification about something else.
   */
  readonly justificationKeywords?: readonly string[];
}

export interface AuditRow {
  readonly variableId: VariableId;
  readonly magnitude: number;
  readonly derived: boolean;
  /** For a derived row, the relation a reader recomputes it with. */
  readonly formulaId?: string;
}

export interface AuditItem extends ItemBase {
  readonly kind: 'audit';
  readonly rows: readonly AuditRow[];
  /** The two rows that no longer agree with the numbers around them. */
  readonly corrupted: readonly VariableId[];
}

export type Item = NumericItem | ChoiceItem | AuditItem;

export type Response =
  | { readonly kind: 'numeric'; readonly value: number }
  | { readonly kind: 'choice'; readonly optionId: string; readonly justification?: string }
  | { readonly kind: 'audit'; readonly variableIds: readonly VariableId[] };

export interface Grade {
  readonly correct: boolean;
  /** Between 0 and 1. The audit type awards 0.4 for finding one of the two. */
  readonly credit: number;
}

const GRAPH: RelationGraph = buildGraph();

/* ------------------------------------------------------------------ *
 * The entry point
 * ------------------------------------------------------------------ */

/**
 * One item of the requested type for the requested formula, or null when the type does not apply.
 *
 * Null is a real answer and not a failure: inverse_solve has nothing to ask of a relation with no
 * inverse, and interpret_the_band has nothing to ask of a relation with no bands. The caller picks
 * another type rather than being handed a malformed exercise.
 */
export function generateItem(type: ItemType, formulaId: string, seed: string): Item | null {
  const relation = RELATIONS.get(formulaId);
  if (relation === undefined) return null;

  const rng = makeRng(`${type}:${formulaId}:${seed}`);

  switch (type) {
    case 'forward_compute':
      return forwardCompute(relation, rng, seed);
    case 'inverse_solve':
      return inverseSolve(relation, rng, seed);
    case 'spot_the_error':
      return spotTheError(relation, rng, seed);
    case 'interpret_the_band':
      return interpretTheBand(relation, rng, seed);
    case 'choose_the_metric':
      return chooseTheMetric(relation, rng, seed);
    case 'chain_derivation':
      return chainDerivation(relation, rng, seed);
    case 'audit_the_dashboard':
      return auditTheDashboard(relation, rng, seed);
    default:
      return null;
  }
}

/** The types that can produce an item for this formula, in the order the specification lists them. */
export function applicableTypes(formulaId: string, seed = 'probe'): ItemType[] {
  return (Object.keys(XP_MULTIPLIERS) as ItemType[]).filter(
    (type) => generateItem(type, formulaId, seed) !== null,
  );
}

/* ------------------------------------------------------------------ *
 * The seven generators
 * ------------------------------------------------------------------ */

function forwardCompute(relation: Relation, rng: Rng, seed: string): NumericItem | null {
  const sample = sampleEnv(relation, rng);
  if (sample === null) return null;

  return {
    kind: 'numeric',
    id: `forward_compute:${relation.formulaId}:${seed}`,
    type: 'forward_compute',
    formulaId: relation.formulaId,
    seed,
    xpMultiplier: XP_MULTIPLIERS.forward_compute,
    given: relation.inputs
      .filter((variableId) => sample.env[variableId] !== undefined)
      .map((variableId) => ({ variableId, magnitude: sample.env[variableId] as Magnitude })),
    targetVariableId: relation.output ?? relation.formulaId,
    answer: sample.result,
    tolerance: 0.005,
  };
}

/**
 * Given the result and all but one input, find the missing input.
 *
 * The answer is the value that was sampled for that input, and the inverse is run as well: when
 * the two disagree by more than a rounding, the relation's inverse does not recover its own input
 * and the item is not offered. A learner should not be marked wrong by a broken inverse.
 */
function inverseSolve(relation: Relation, rng: Rng, seed: string): NumericItem | null {
  const targets = Object.keys(relation.inverses).filter((variableId) =>
    relation.inputs.includes(variableId),
  );
  if (targets.length === 0 || relation.output === null) return null;

  const sample = sampleEnv(relation, rng);
  if (sample === null) return null;

  const target = rng.pick(targets);
  if (target === undefined) return null;

  const expected = sample.env[target];
  if (typeof expected !== 'number') return null;

  const inverse = relation.inverses[target];
  if (inverse === undefined) return null;

  let recovered: number;
  try {
    recovered = inverse({ ...sample.env, [relation.output]: sample.result, result: sample.result });
  } catch (error) {
    if (error instanceof EngineError) return null;
    throw error;
  }

  if (!Number.isFinite(recovered)) return null;
  if (expected !== 0 && Math.abs((recovered - expected) / expected) > 0.005) return null;

  const given: GivenValue[] = [
    { variableId: relation.output, magnitude: sample.result },
    ...relation.inputs
      .filter((variableId) => variableId !== target && sample.env[variableId] !== undefined)
      .map((variableId) => ({ variableId, magnitude: sample.env[variableId] as Magnitude })),
  ];

  return {
    kind: 'numeric',
    id: `inverse_solve:${relation.formulaId}:${seed}`,
    type: 'inverse_solve',
    formulaId: relation.formulaId,
    seed,
    xpMultiplier: XP_MULTIPLIERS.inverse_solve,
    given,
    targetVariableId: target,
    answer: expected,
    tolerance: 0.005,
  };
}

/**
 * One planted mistake, drawn from this formula's own failure modes.
 *
 * The three distractors are failure modes of other formulas, which is what makes the type hard in
 * the way it is meant to be: every option is a real mistake somebody has made, and only one of
 * them is the mistake in front of the learner.
 */
function spotTheError(relation: Relation, rng: Rng, seed: string): ChoiceItem | null {
  if (relation.pitfallCount === 0) return null;

  const sample = sampleEnv(relation, rng);
  if (sample === null) return null;

  const correct: OptionRef = {
    kind: 'pitfall',
    formulaId: relation.formulaId,
    index: rng.int(relation.pitfallCount),
  };

  const pool: OptionRef[] = [];
  for (const other of RELATION_LIST) {
    if (other.formulaId === relation.formulaId || other.pitfallCount === 0) continue;
    pool.push({ kind: 'pitfall', formulaId: other.formulaId, index: 0 });
  }

  const distractors = rng.shuffle(pool).slice(0, 3);
  if (distractors.length < 3) return null;

  return choice(
    'spot_the_error',
    relation,
    seed,
    rng,
    [correct, ...distractors],
    correct,
    relation.inputs
      .filter((variableId) => sample.env[variableId] !== undefined)
      .map((variableId) => ({ variableId, magnitude: sample.env[variableId] as Magnitude })),
    // The stem states a result as if it were confident, which is the shape the specification asks
    // for: the mistake is in the reasoning, not in the arithmetic.
    sample.result,
  );
}

/**
 * Given a computed result, choose the band it falls in.
 *
 * The result has to land inside a band for the question to have an answer, so the sampler is run
 * until it does. When no draw lands anywhere, the formula has bands that its own worked example
 * cannot reach, and no item is offered rather than one with no correct option.
 */
function interpretTheBand(relation: Relation, rng: Rng, seed: string): ChoiceItem | null {
  if (relation.interpretationBands.length === 0) return null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const sample = sampleEnv(relation, rng);
    if (sample === null) return null;

    const index = relation.interpretationBands.findIndex(
      (band) => sample.result >= band.lower && sample.result <= band.upper,
    );
    if (index === -1) continue;

    const correct: OptionRef = { kind: 'band', formulaId: relation.formulaId, index };

    const others: OptionRef[] = relation.interpretationBands
      .map((_band, bandIndex) => bandIndex)
      .filter((bandIndex) => bandIndex !== index)
      .map((bandIndex) => ({
        kind: 'band' as const,
        formulaId: relation.formulaId,
        index: bandIndex,
      }));

    // One distractor from a neighbouring formula, as the specification asks.
    const neighbour = rng.pick(
      RELATION_LIST.filter(
        (other) =>
          other.formulaId !== relation.formulaId &&
          other.structuralClass === relation.structuralClass &&
          other.interpretationBands.length > 0,
      ),
    );
    const options: OptionRef[] = [correct, ...others.slice(0, 2)];
    if (neighbour !== undefined) {
      options.push({ kind: 'band', formulaId: neighbour.formulaId, index: 0 });
    }
    if (options.length < 3) continue;

    return choice(
      'interpret_the_band',
      relation,
      seed,
      rng,
      options,
      correct,
      relation.inputs
        .filter((variableId) => sample.env[variableId] !== undefined)
        .map((variableId) => ({ variableId, magnitude: sample.env[variableId] as Magnitude })),
      sample.result,
    );
  }

  return null;
}

/**
 * A decision situation, and four metrics that could be mistaken for one another.
 *
 * The distractors come from the same structural class and a different decision domain, which is
 * exactly the confusion the type exists to test: formulas that look alike on the page and answer
 * different questions.
 */
function chooseTheMetric(relation: Relation, rng: Rng, seed: string): ChoiceItem | null {
  const siblings = RELATION_LIST.filter(
    (other) =>
      other.formulaId !== relation.formulaId &&
      other.structuralClass === relation.structuralClass &&
      other.taxonomy.decisionDomain !== relation.taxonomy.decisionDomain,
  );
  if (siblings.length < 3) return null;

  const correct: OptionRef = { kind: 'formula', formulaId: relation.formulaId };
  const distractors: OptionRef[] = rng
    .shuffle(siblings)
    .slice(0, 3)
    .map((other) => ({ kind: 'formula' as const, formulaId: other.formulaId }));

  const item = choice(
    'choose_the_metric',
    relation,
    seed,
    rng,
    [correct, ...distractors],
    correct,
    [],
    null,
  );
  if (item === null) return null;

  return { ...item, justificationKeywords: keywordsFor(relation) };
}

/**
 * Two or three raw values, and a target several relations away.
 *
 * The chain is built forwards rather than searched backwards: a relation is sampled, its result
 * becomes an input to a relation that reads it, and so on. What the learner is given is the set of
 * values that were never produced by another step, which is what makes the target reachable and
 * the arithmetic honest.
 *
 * The depth reached is reported rather than promised. This corpus declares far less chaining than
 * the specification assumes, which is the same shortfall AC-04 measures. See DEVIATIONS.md, D-11.
 */
function chainDerivation(relation: Relation, rng: Rng, seed: string): NumericItem | null {
  if (relation.output === null || !relation.publishesToGraph) return null;

  const first = sampleEnv(relation, rng);
  if (first === null) return null;

  const entered: Record<VariableId, Magnitude> = {};
  for (const [variableId, magnitude] of Object.entries(first.env)) entered[variableId] = magnitude;

  let current = relation;
  let produced: VariableId = relation.output;
  const producedSoFar = new Set<VariableId>([produced]);

  for (let step = 0; step < 3; step += 1) {
    const next = rng.pick(
      (GRAPH.consumers.get(produced) ?? []).filter(
        (candidate) =>
          candidate.formulaId !== current.formulaId &&
          candidate.output !== null &&
          candidate.publishesToGraph &&
          candidate.resultShape === 'scalar' &&
          candidate.inputs.includes(produced) &&
          !producedSoFar.has(candidate.output),
      ),
    );
    if (next === undefined) break;

    const supporting = sampleEnv(next, rng);
    if (supporting === null) break;

    // The value already produced stands; every other input of this relation is a new raw value.
    for (const variableId of next.inputs) {
      if (variableId === produced || producedSoFar.has(variableId)) continue;
      const magnitude = supporting.env[variableId];
      if (magnitude !== undefined) entered[variableId] = magnitude;
    }

    current = next;
    produced = next.output as VariableId;
    producedSoFar.add(produced);
  }

  // Nothing was chained: this is a single step, which the forward type already covers.
  if (producedSoFar.size < 2) return null;

  const outcome = propagate(userValues(entered), { graph: GRAPH });
  const target = outcome.derived.get(produced);
  if (target === undefined || typeof target.magnitude !== 'number') return null;

  const depth = derivationDepth(produced, outcome.derived);
  if (depth < 2) return null;

  return {
    kind: 'numeric',
    id: `chain_derivation:${relation.formulaId}:${seed}`,
    type: 'chain_derivation',
    formulaId: current.formulaId,
    seed,
    xpMultiplier: XP_MULTIPLIERS.chain_derivation,
    given: Object.entries(entered)
      .filter(([variableId]) => !producedSoFar.has(variableId))
      .map(([variableId, magnitude]) => ({ variableId, magnitude })),
    targetVariableId: produced,
    answer: target.magnitude,
    tolerance: 0.01,
    depth,
  };
}

/**
 * How many derivations separate a value from the numbers a person actually entered.
 *
 * The propagation generation counter is not that number. Within a single round a relation can
 * consume a value another relation produced moments earlier in the same pass, so a value two
 * derivations deep can carry generation one. This walks the provenance instead, which is what a
 * chain exercise means by depth, and what a learner counts when they work it out on paper.
 */
export function derivationDepth(
  variableId: VariableId,
  values: ReadonlyMap<VariableId, { readonly derivedFrom: readonly VariableId[] }>,
  seen: ReadonlySet<VariableId> = new Set(),
): number {
  const value = values.get(variableId);
  if (value === undefined || value.derivedFrom.length === 0) return 0;
  if (seen.has(variableId)) return 0;

  const walked = new Set(seen).add(variableId);
  let deepest = 0;
  for (const source of value.derivedFrom) {
    const depth = derivationDepth(source, values, walked);
    if (depth > deepest) deepest = depth;
  }
  return deepest + 1;
}

/**
 * A dashboard that is consistent apart from two numbers.
 *
 * The workspace is generated by the propagation engine, so every row agrees with every other, and
 * then two derived rows are moved by a margin large enough to be found by recomputing them. The
 * corrupted rows are always rows whose own inputs are on the dashboard: a discrepancy a reader
 * cannot check from what is in front of them is not an audit, it is a guess.
 */
function auditTheDashboard(relation: Relation, rng: Rng, seed: string): AuditItem | null {
  if (relation.output === null || relation.resultShape !== 'scalar') return null;

  // Every value on the dashboard, with the relation that produced it where there is one. A value
  // already on the board is never given a second value: a dashboard that contradicted itself in
  // two places before anything was corrupted would be a different exercise.
  const values = new Map<VariableId, number>();
  const rows: AuditRow[] = [];

  const add = (candidate: Relation): void => {
    if (candidate.output === null || candidate.resultShape !== 'scalar') return;
    if (values.has(candidate.output)) return;

    const sample = sampleEnv(candidate, rng);
    if (sample === null) return;

    // Values already on the board win, so the board stays internally consistent. A relation that
    // reads a vector or a matrix is left off entirely: a row a reader cannot recompute from the
    // other rows is a row they cannot audit, and this exercise is about what they can check.
    const env: Record<VariableId, Magnitude> = {};
    for (const variableId of candidate.inputs) {
      const settled = values.get(variableId);
      const drawn = sample.env[variableId];
      const magnitude = settled ?? drawn;
      if (typeof magnitude !== 'number') return;
      env[variableId] = magnitude;
    }

    let result: unknown;
    try {
      result = compute(candidate, env as Env);
    } catch (error) {
      if (error instanceof EngineError) return;
      throw error;
    }
    if (typeof result !== 'number' || !Number.isFinite(result)) return;

    for (const variableId of candidate.inputs) {
      const magnitude = env[variableId];
      if (typeof magnitude !== 'number' || values.has(variableId)) continue;
      values.set(variableId, magnitude);
      rows.push({ variableId, magnitude, derived: false });
    }

    values.set(candidate.output, result);
    rows.push({
      variableId: candidate.output,
      magnitude: result,
      derived: true,
      formulaId: candidate.formulaId,
    });
  };

  add(relation);
  for (const candidate of rng.shuffle(RELATION_LIST)) {
    if (rows.length >= 12) break;
    add(candidate);
  }

  const kept = rows.slice(0, 12);
  const spoilable = kept.filter((row) => row.derived);
  if (kept.length < 8 || spoilable.length < 2) return null;

  const corrupted = new Set(
    rng
      .shuffle(spoilable)
      .slice(0, 2)
      .map((row) => row.variableId),
  );

  return {
    kind: 'audit',
    id: `audit_the_dashboard:${relation.formulaId}:${seed}`,
    type: 'audit_the_dashboard',
    formulaId: relation.formulaId,
    seed,
    xpMultiplier: XP_MULTIPLIERS.audit_the_dashboard,
    // A third and a half is well past the half percent a reader would call rounding, and well
    // short of a number that looks like a typing slip rather than an inconsistency.
    rows: kept.map((row) =>
      corrupted.has(row.variableId) ? { ...row, magnitude: row.magnitude * 1.35 } : row,
    ),
    corrupted: [...corrupted].sort(),
  };
}

/* ------------------------------------------------------------------ *
 * Shared parts
 * ------------------------------------------------------------------ */

function choice(
  type: ItemType,
  relation: Relation,
  seed: string,
  rng: Rng,
  refs: readonly OptionRef[],
  correct: OptionRef,
  given: readonly GivenValue[],
  shownResult: number | null,
): ChoiceItem | null {
  if (refs.length < 3) return null;

  const options = rng.shuffle(refs).map((ref, index) => ({ id: `opt${index}`, ref }));
  const correctOption = options.find((option) => sameRef(option.ref, correct));
  if (correctOption === undefined) return null;

  return {
    kind: 'choice',
    id: `${type}:${relation.formulaId}:${seed}`,
    type,
    formulaId: relation.formulaId,
    seed,
    xpMultiplier: XP_MULTIPLIERS[type],
    given,
    shownResult,
    options,
    correctOptionId: correctOption.id,
  };
}

function sameRef(left: OptionRef, right: OptionRef): boolean {
  if (left.kind !== right.kind || left.formulaId !== right.formulaId) return false;
  if (left.kind === 'formula' || right.kind === 'formula') return true;
  return left.index === right.index;
}

/**
 * The words a justification is expected to touch.
 *
 * They are taken from the formula's own name and from the labels of the variables it reads, both
 * of which the specification supplies. Nothing is composed here, so there is no rubric text to
 * translate and none to argue with: the words are the ones already on the screen.
 */
export function keywordsFor(relation: Relation): string[] {
  const words = new Set<string>();

  const add = (text: string): void => {
    for (const word of text.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
      if (word.length >= 4) words.add(word);
    }
  };

  add(relation.name.id);
  add(relation.name.en);
  for (const variableId of relation.inputs) {
    const definition = VARIABLES.get(variableId);
    if (definition === undefined) continue;
    add(definition.label.id);
    add(definition.label.en);
  }

  return [...words].sort();
}

/* ------------------------------------------------------------------ *
 * Grading
 * ------------------------------------------------------------------ */

/**
 * Mark a response.
 *
 * The tolerances are the ones each challenge type states. The audit type awards the partial credit
 * the specification names, and awards it only for a selection of at most two: a learner who ticks
 * every row has found nothing.
 */
export function grade(item: Item, response: Response): Grade {
  if (item.kind === 'numeric' && response.kind === 'numeric') {
    const within = closeEnough(response.value, item.answer, item.tolerance);
    return { correct: within, credit: within ? 1 : 0 };
  }

  if (item.kind === 'choice' && response.kind === 'choice') {
    if (response.optionId !== item.correctOptionId) return { correct: false, credit: 0 };
    if (item.justificationKeywords === undefined) return { correct: true, credit: 1 };

    // The selection alone is most of the answer. Naming a reason that touches the formula or one
    // of its inputs is the rest of it.
    const justification = (response.justification ?? '').toLowerCase();
    const named = item.justificationKeywords.some((word) => justification.includes(word));
    return { correct: true, credit: named ? 1 : 0.6 };
  }

  if (item.kind === 'audit' && response.kind === 'audit') {
    const picked = [...new Set(response.variableIds)];
    if (picked.length > item.corrupted.length) return { correct: false, credit: 0 };
    const found = picked.filter((variableId) => item.corrupted.includes(variableId)).length;
    if (found === item.corrupted.length) return { correct: true, credit: 1 };
    return { correct: false, credit: found === 1 ? 0.4 : 0 };
  }

  return { correct: false, credit: 0 };
}

function closeEnough(actual: number, expected: number, tolerance: number): boolean {
  if (!Number.isFinite(actual)) return false;
  if (expected === 0) return Math.abs(actual) <= tolerance;
  return Math.abs((actual - expected) / expected) <= tolerance;
}

/** Re-run a numeric item's own arithmetic, for a caller that wants to check the generator. */
export function verifyNumeric(item: NumericItem): boolean {
  const relation = RELATIONS.get(item.formulaId);
  if (relation === undefined) return false;
  if (item.type !== 'forward_compute') return true;

  const env: Record<VariableId, Magnitude> = {};
  for (const given of item.given) env[given.variableId] = given.magnitude;

  try {
    const result = compute(relation, env as Env);
    return typeof result === 'number' && closeEnough(result, item.answer, 1e-9);
  } catch (error) {
    if (error instanceof EngineError) return false;
    throw error;
  }
}
