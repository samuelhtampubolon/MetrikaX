// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { wsjf_score } from '../../src/formulas/generated/wsjf_score.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 70 of 76. */
const WORKED: Env = Object.freeze({
  "user_value": 8,
  "time_value": 5,
  "risk_reduction": 3,
  "job_size": 5
});

describe('WSJF_Score (wsjf_score)', () => {
  it('computes the worked example', () => {
    const result = compute(wsjf_score, WORKED) as number;
    expectRelative(result, 3.2);
  });

  it('states an outcome at the lower edge of the domain for user_value', () => {
    const env = { ...WORKED, "user_value": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(wsjf_score, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "job_size": 0 };
    const guard = wsjf_score.guards.find((entry) => entry.id === "zero_denominator:job_size")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(wsjf_score, env));
  });

  it('recovers job_size through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "wsjf_score": compute(wsjf_score, WORKED) as number,
    };
    delete env["job_size"];
    const recovered = computeInverse(wsjf_score, "job_size", env as Env);
    expectRelative(recovered, 5, 1e-9);
  });

  it('recovers user_value through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "wsjf_score": compute(wsjf_score, WORKED) as number,
    };
    delete env["user_value"];
    const recovered = computeInverse(wsjf_score, "user_value", env as Env);
    expectRelative(recovered, 8, 1e-9);
  });
});
