// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { effective_frequency } from '../../src/formulas/generated/effective_frequency.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 50 of 76. */
const WORKED: Env = Object.freeze({
  "reach_at_threshold": 782000,
  "total_reach": 1320000
});

describe('Effective_Frequency (effective_frequency)', () => {
  it('computes the worked example', () => {
    const result = compute(effective_frequency, WORKED) as number;
    expectRelative(result, 0.5924242424242424);
  });

  it('states an outcome at the lower edge of the domain for reach_at_threshold', () => {
    const env = { ...WORKED, "reach_at_threshold": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(effective_frequency, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "total_reach": 0 };
    const guard = effective_frequency.guards.find((entry) => entry.id === "zero_denominator:total_reach")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(effective_frequency, env));
  });

  it('recovers reach_at_threshold through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "effective_frequency": compute(effective_frequency, WORKED) as number,
    };
    delete env["reach_at_threshold"];
    const recovered = computeInverse(effective_frequency, "reach_at_threshold", env as Env);
    expectRelative(recovered, 782000, 1e-9);
  });

  it('recovers total_reach through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "effective_frequency": compute(effective_frequency, WORKED) as number,
    };
    delete env["total_reach"];
    const recovered = computeInverse(effective_frequency, "total_reach", env as Env);
    expectRelative(recovered, 1320000, 1e-9);
  });
});
