// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { ndr } from '../../src/formulas/generated/ndr.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 46 of 76. */
const WORKED: Env = Object.freeze({
  "start_mrr": 173900000,
  "expansion_mrr": 14800000,
  "contraction_mrr": 2600000,
  "churned_mrr": 4200000
});

describe('NDR (ndr)', () => {
  it('computes the worked example', () => {
    const result = compute(ndr, WORKED) as number;
    expectRelative(result, 1.0460034502587694);
  });

  it('states an outcome at the lower edge of the domain for start_mrr', () => {
    const env = { ...WORKED, "start_mrr": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(ndr, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "start_mrr": 0 };
    const guard = ndr.guards.find((entry) => entry.id === "zero_denominator:start_mrr")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(ndr, env));
  });

  it('recovers expansion_mrr through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "ndr": compute(ndr, WORKED) as number,
    };
    delete env["expansion_mrr"];
    const recovered = computeInverse(ndr, "expansion_mrr", env as Env);
    expectRelative(recovered, 14800000, 1e-9);
  });

  it('recovers contraction_mrr through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "ndr": compute(ndr, WORKED) as number,
    };
    delete env["contraction_mrr"];
    const recovered = computeInverse(ndr, "contraction_mrr", env as Env);
    expectRelative(recovered, 2600000, 1e-9);
  });

  it('recovers churned_mrr through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "ndr": compute(ndr, WORKED) as number,
    };
    delete env["churned_mrr"];
    const recovered = computeInverse(ndr, "churned_mrr", env as Env);
    expectRelative(recovered, 4200000, 1e-9);
  });
});
