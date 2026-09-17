// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { cac } from '../../src/formulas/generated/cac.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 32 of 76. */
const WORKED: Env = Object.freeze({
  "total_acquisition_cost": 42000000,
  "new_customers": 113
});

describe('CAC (cac)', () => {
  it('computes the worked example', () => {
    const result = compute(cac, WORKED) as number;
    expectRelative(result, 371681.41592920356);
  });

  it('states an outcome at the lower edge of the domain for total_acquisition_cost', () => {
    const env = { ...WORKED, "total_acquisition_cost": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(cac, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "new_customers": 0 };
    const guard = cac.guards.find((entry) => entry.id === "zero_denominator:new_customers")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(cac, env));
  });

  it('recovers total_acquisition_cost through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "cac": compute(cac, WORKED) as number,
    };
    delete env["total_acquisition_cost"];
    const recovered = computeInverse(cac, "total_acquisition_cost", env as Env);
    expectRelative(recovered, 42000000, 1e-9);
  });

  it('recovers new_customers through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "cac": compute(cac, WORKED) as number,
    };
    delete env["new_customers"];
    const recovered = computeInverse(cac, "new_customers", env as Env);
    expectRelative(recovered, 113, 1e-9);
  });
});
