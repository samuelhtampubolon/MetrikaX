// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { mrr_churn_rate } from '../../src/formulas/generated/mrr_churn_rate.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 31 of 76. */
const WORKED: Env = Object.freeze({
  "churned_mrr": 4200000,
  "total_mrr": 173900000
});

describe('MRR_Churn_Rate (mrr_churn_rate)', () => {
  it('computes the worked example', () => {
    const result = compute(mrr_churn_rate, WORKED) as number;
    expectRelative(result, 0.024151811385853938);
  });

  it('states an outcome at the lower edge of the domain for churned_mrr', () => {
    const env = { ...WORKED, "churned_mrr": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(mrr_churn_rate, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "total_mrr": 0 };
    const guard = mrr_churn_rate.guards.find((entry) => entry.id === "zero_denominator:total_mrr")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(mrr_churn_rate, env));
  });

  it('recovers churned_mrr through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "mrr_churn_rate": compute(mrr_churn_rate, WORKED) as number,
    };
    delete env["churned_mrr"];
    const recovered = computeInverse(mrr_churn_rate, "churned_mrr", env as Env);
    expectRelative(recovered, 4200000, 1e-9);
  });

  it('recovers total_mrr through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "mrr_churn_rate": compute(mrr_churn_rate, WORKED) as number,
    };
    delete env["total_mrr"];
    const recovered = computeInverse(mrr_churn_rate, "total_mrr", env as Env);
    expectRelative(recovered, 173900000, 1e-9);
  });
});
