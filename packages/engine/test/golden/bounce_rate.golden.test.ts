// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { bounce_rate } from '../../src/formulas/generated/bounce_rate.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 4 of 76. */
const WORKED: Env = Object.freeze({
  "single_page_sessions": 6800,
  "sessions": 11000
});

describe('Bounce_Rate (bounce_rate)', () => {
  it('computes the worked example', () => {
    const result = compute(bounce_rate, WORKED) as number;
    expectRelative(result, 0.6181818181818182);
  });

  it('states an outcome at the lower edge of the domain for single_page_sessions', () => {
    const env = { ...WORKED, "single_page_sessions": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(bounce_rate, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "sessions": 0 };
    const guard = bounce_rate.guards.find((entry) => entry.id === "zero_denominator:sessions")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(bounce_rate, env));
  });

  it('recovers single_page_sessions through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "bounce_rate": compute(bounce_rate, WORKED) as number,
    };
    delete env["single_page_sessions"];
    const recovered = computeInverse(bounce_rate, "single_page_sessions", env as Env);
    expectRelative(recovered, 6800, 1e-9);
  });

  it('recovers sessions through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "bounce_rate": compute(bounce_rate, WORKED) as number,
    };
    delete env["sessions"];
    const recovered = computeInverse(bounce_rate, "sessions", env as Env);
    expectRelative(recovered, 11000, 1e-9);
  });
});
