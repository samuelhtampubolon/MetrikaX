/**
 * P17: plausible sampling.
 *
 * "Sample inputs from the formula's plausible range, round to realistic precision." The plausible
 * range is not stated anywhere as a pair of numbers, and inventing one per variable would be
 * inventing data. What the specification does supply for every formula is a worked example, which
 * is a set of values its author considered realistic. Sampling is therefore done around that
 * anchor, within the variable's own declared constraints, and rounded to the decimals the variable
 * declares.
 *
 * Every draw is then checked by running it through `compute`. A sample the engine refuses is
 * discarded rather than presented: an exercise whose answer is a refusal teaches nothing about the
 * formula, and the learner would be right to be annoyed.
 */

import { compute } from '../compute.ts';
import { EngineError } from '../errors.ts';
import { VARIABLES } from '../variables/generated/registry.ts';
import type { Env, Magnitude, Relation, VariableId } from '../types.ts';
import type { Rng } from './rng.ts';

export interface SampleOptions {
  /** The widest and narrowest multiple of the worked example a draw may take. */
  readonly low?: number;
  readonly high?: number;
  readonly attempts?: number;
}

export interface Sample {
  readonly env: Env;
  readonly result: number;
  /** True when every attempt was refused and the worked example itself was used. */
  readonly fallback: boolean;
}

/**
 * Round to the precision the variable declares, and keep the value inside its constraints.
 *
 * A count is a whole thing: rounding it to two decimals would produce 1.480,25 orders, which no
 * dashboard has ever shown. The decimals come from the specification, not from a guess here.
 */
export function roundLike(variableId: VariableId, value: number): number {
  const definition = VARIABLES.get(variableId);
  const decimals = definition?.constraints.decimals ?? 2;
  const factor = 10 ** decimals;
  let rounded = Math.round(value * factor) / factor;

  const min = definition?.constraints.min ?? null;
  const max = definition?.constraints.max ?? null;
  if (min !== null && rounded < min) rounded = min;
  if (max !== null && rounded > max) rounded = max;

  // A zero that the variable forbids would be refused by the guard on the next line of the caller,
  // so it is lifted to the smallest value its precision can express.
  if (rounded === 0 && definition?.constraints.allowZero === false) rounded = 1 / factor;
  return rounded;
}

/** One draw around the worked example. Vectors and matrices are carried over unchanged. */
function draw(relation: Relation, rng: Rng, low: number, high: number): Env {
  const env: Record<VariableId, Magnitude> = {};

  for (const [variableId, anchor] of Object.entries(relation.workedExample)) {
    if (typeof anchor !== 'number') {
      env[variableId] = anchor;
      continue;
    }
    const factor = rng.between(low, high);
    env[variableId] = roundLike(variableId, anchor * factor);
  }

  return env;
}

/**
 * A sampled environment whose forward result the engine accepts.
 *
 * Only relations whose result is a single number are sampled. The three whose answer is a
 * structure have nothing to compare a typed answer against, so they are not offered as exercises.
 */
export function sampleEnv(
  relation: Relation,
  rng: Rng,
  options: SampleOptions = {},
): Sample | null {
  if (relation.resultShape !== 'scalar') return null;

  const low = options.low ?? 0.6;
  const high = options.high ?? 1.8;
  const attempts = options.attempts ?? 12;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const env = draw(relation, rng, low, high);
    const result = evaluate(relation, env);
    if (result !== null) return { env, result, fallback: false };
  }

  // Every draw was refused. The worked example is a set of values the specification itself calls
  // realistic, so it stands in rather than the exercise being dropped.
  const anchor = relation.workedExample as Env;
  const result = evaluate(relation, anchor);
  return result === null ? null : { env: anchor, result, fallback: true };
}

function evaluate(relation: Relation, env: Env): number | null {
  try {
    const result = compute(relation, env);
    return typeof result === 'number' && Number.isFinite(result) ? result : null;
  } catch (error) {
    if (error instanceof EngineError) return null;
    throw error;
  }
}
