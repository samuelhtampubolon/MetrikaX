// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { gabor_granger } from '../../src/formulas/generated/gabor_granger.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 58 of 76. */
const WORKED: Env = Object.freeze({
  "buyers_at_p": 168,
  "total_respondents": 420
});

describe('Gabor_Granger_Demand (gabor_granger)', () => {
  it('computes the worked example', () => {
    const result = compute(gabor_granger, WORKED) as number;
    expectRelative(result, 0.4);
  });

  it('states an outcome at the lower edge of the domain for buyers_at_p', () => {
    const env = { ...WORKED, "buyers_at_p": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(gabor_granger, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "total_respondents": 0 };
    const guard = gabor_granger.guards.find((entry) => entry.id === "zero_denominator:total_respondents")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(gabor_granger, env));
  });

  it('recovers buyers_at_p through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "gabor_granger": compute(gabor_granger, WORKED) as number,
    };
    delete env["buyers_at_p"];
    const recovered = computeInverse(gabor_granger, "buyers_at_p", env as Env);
    expectRelative(recovered, 168, 1e-9);
  });

  it('recovers total_respondents through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "gabor_granger": compute(gabor_granger, WORKED) as number,
    };
    delete env["total_respondents"];
    const recovered = computeInverse(gabor_granger, "total_respondents", env as Env);
    expectRelative(recovered, 420, 1e-9);
  });
});
