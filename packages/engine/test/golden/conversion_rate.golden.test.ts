// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { conversion_rate } from '../../src/formulas/generated/conversion_rate.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 2 of 76. */
const WORKED: Env = Object.freeze({
  "conversions": 420,
  "visitors": 14000
});

describe('Conversion_Rate (conversion_rate)', () => {
  it('computes the worked example', () => {
    const result = compute(conversion_rate, WORKED) as number;
    expectRelative(result, 0.03);
  });

  it('states an outcome at the lower edge of the domain for conversions', () => {
    const env = { ...WORKED, "conversions": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(conversion_rate, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "visitors": 0 };
    const guard = conversion_rate.guards.find((entry) => entry.id === "zero_denominator:visitors")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(conversion_rate, env));
  });

  it('recovers conversions through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "conversion_rate": compute(conversion_rate, WORKED) as number,
    };
    delete env["conversions"];
    const recovered = computeInverse(conversion_rate, "conversions", env as Env);
    expectRelative(recovered, 420, 1e-9);
  });

  it('recovers visitors through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "conversion_rate": compute(conversion_rate, WORKED) as number,
    };
    delete env["visitors"];
    const recovered = computeInverse(conversion_rate, "visitors", env as Env);
    expectRelative(recovered, 14000, 1e-9);
  });
});
