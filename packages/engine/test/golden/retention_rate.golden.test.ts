// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { retention_rate } from '../../src/formulas/generated/retention_rate.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 15 of 76. */
const WORKED: Env = Object.freeze({
  "end_customers": 1015,
  "new_customers": 113,
  "start_customers": 940
});

describe('Retention_Rate (retention_rate)', () => {
  it('computes the worked example', () => {
    const result = compute(retention_rate, WORKED) as number;
    expectRelative(result, 0.9595744680851064);
  });

  it('states an outcome at the lower edge of the domain for end_customers', () => {
    const env = { ...WORKED, "end_customers": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(retention_rate, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "start_customers": 0 };
    const guard = retention_rate.guards.find((entry) => entry.id === "zero_denominator:start_customers")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(retention_rate, env));
  });

  it('recovers end_customers through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "retention_rate": compute(retention_rate, WORKED) as number,
    };
    delete env["end_customers"];
    const recovered = computeInverse(retention_rate, "end_customers", env as Env);
    expectRelative(recovered, 1015, 1e-9);
  });

  it('recovers new_customers through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "retention_rate": compute(retention_rate, WORKED) as number,
    };
    delete env["new_customers"];
    const recovered = computeInverse(retention_rate, "new_customers", env as Env);
    expectRelative(recovered, 113, 1e-9);
  });

  it('recovers start_customers through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "retention_rate": compute(retention_rate, WORKED) as number,
    };
    delete env["start_customers"];
    const recovered = computeInverse(retention_rate, "start_customers", env as Env);
    expectRelative(recovered, 940, 1e-9);
  });
});
