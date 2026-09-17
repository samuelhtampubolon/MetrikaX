// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { cost_of_delay } from '../../src/formulas/generated/cost_of_delay.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 69 of 76. */
const WORKED: Env = Object.freeze({
  "delta_value": 240000000,
  "delta_time": 3
});

describe('Cost_of_Delay (cost_of_delay)', () => {
  it('computes the worked example', () => {
    const result = compute(cost_of_delay, WORKED) as number;
    expectRelative(result, 80000000);
  });

  it('states an outcome at the lower edge of the domain for delta_value', () => {
    const env = { ...WORKED, "delta_value": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(cost_of_delay, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "delta_time": 0 };
    const guard = cost_of_delay.guards.find((entry) => entry.id === "zero_denominator:delta_time")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(cost_of_delay, env));
  });

  it('recovers delta_value through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "cost_of_delay": compute(cost_of_delay, WORKED) as number,
    };
    delete env["delta_value"];
    const recovered = computeInverse(cost_of_delay, "delta_value", env as Env);
    expectRelative(recovered, 240000000, 1e-9);
  });

  it('recovers delta_time through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "cost_of_delay": compute(cost_of_delay, WORKED) as number,
    };
    delete env["delta_time"];
    const recovered = computeInverse(cost_of_delay, "delta_time", env as Env);
    expectRelative(recovered, 3, 1e-9);
  });
});
