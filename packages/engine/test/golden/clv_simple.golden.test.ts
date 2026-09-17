// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { clv_simple } from '../../src/formulas/generated/clv_simple.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 38 of 76. */
const WORKED: Env = Object.freeze({
  "arpu": 185000,
  "gross_margin": 0.6,
  "churn_rate": 0.04
});

describe('CLV_Simple (clv_simple)', () => {
  it('computes the worked example', () => {
    const result = compute(clv_simple, WORKED) as number;
    expectRelative(result, 2775000);
  });

  it('states an outcome at the lower edge of the domain for arpu', () => {
    const env = { ...WORKED, "arpu": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(clv_simple, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "churn_rate": 0 };
    const guard = clv_simple.guards.find((entry) => entry.id === "zero_denominator:churn_rate")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(clv_simple, env));
  });

  it('recovers arpu through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "clv_simple": compute(clv_simple, WORKED) as number,
    };
    delete env["arpu"];
    const recovered = computeInverse(clv_simple, "arpu", env as Env);
    expectRelative(recovered, 185000, 1e-9);
  });

  it('recovers gross_margin through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "clv_simple": compute(clv_simple, WORKED) as number,
    };
    delete env["gross_margin"];
    const recovered = computeInverse(clv_simple, "gross_margin", env as Env);
    expectRelative(recovered, 0.6, 1e-9);
  });

  it('recovers churn_rate through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "clv_simple": compute(clv_simple, WORKED) as number,
    };
    delete env["churn_rate"];
    const recovered = computeInverse(clv_simple, "churn_rate", env as Env);
    expectRelative(recovered, 0.04, 1e-9);
  });
});
