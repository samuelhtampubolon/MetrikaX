// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { churn_rate } from '../../src/formulas/generated/churn_rate.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 14 of 76. */
const WORKED: Env = Object.freeze({
  "lost_customers": 38,
  "start_customers": 940
});

describe('Churn_Rate (churn_rate)', () => {
  it('computes the worked example', () => {
    const result = compute(churn_rate, WORKED) as number;
    expectRelative(result, 0.04042553191489362);
  });

  it('states an outcome at the lower edge of the domain for lost_customers', () => {
    const env = { ...WORKED, "lost_customers": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(churn_rate, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "start_customers": 0 };
    const guard = churn_rate.guards.find((entry) => entry.id === "zero_denominator:start_customers")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(churn_rate, env));
  });

  it('recovers lost_customers through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "churn_rate": compute(churn_rate, WORKED) as number,
    };
    delete env["lost_customers"];
    const recovered = computeInverse(churn_rate, "lost_customers", env as Env);
    expectRelative(recovered, 38, 1e-9);
  });

  it('recovers start_customers through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "churn_rate": compute(churn_rate, WORKED) as number,
    };
    delete env["start_customers"];
    const recovered = computeInverse(churn_rate, "start_customers", env as Env);
    expectRelative(recovered, 940, 1e-9);
  });
});
