// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { rice_score } from '../../src/formulas/generated/rice_score.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 68 of 76. */
const WORKED: Env = Object.freeze({
  "rice_reach": 4200,
  "rice_impact": 2,
  "rice_confidence": 80,
  "rice_effort": 3
});

describe('RICE_Score (rice_score)', () => {
  it('computes the worked example', () => {
    const result = compute(rice_score, WORKED) as number;
    expectRelative(result, 2240);
  });

  it('states an outcome at the lower edge of the domain for rice_reach', () => {
    const env = { ...WORKED, "rice_reach": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(rice_score, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "rice_effort": 0 };
    const guard = rice_score.guards.find((entry) => entry.id === "zero_denominator:rice_effort")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(rice_score, env));
  });

  it('recovers rice_effort through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "rice_score": compute(rice_score, WORKED) as number,
    };
    delete env["rice_effort"];
    const recovered = computeInverse(rice_score, "rice_effort", env as Env);
    expectRelative(recovered, 3, 1e-9);
  });

  it('recovers rice_reach through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "rice_score": compute(rice_score, WORKED) as number,
    };
    delete env["rice_reach"];
    const recovered = computeInverse(rice_score, "rice_reach", env as Env);
    expectRelative(recovered, 4200, 1e-9);
  });
});
