// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { csat } from '../../src/formulas/generated/csat.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 22 of 76. */
const WORKED: Env = Object.freeze({
  "satisfied_count": 342,
  "total_responses": 420
});

describe('CSAT (csat)', () => {
  it('computes the worked example', () => {
    const result = compute(csat, WORKED) as number;
    expectRelative(result, 81.42857142857143);
  });

  it('states an outcome at the lower edge of the domain for satisfied_count', () => {
    const env = { ...WORKED, "satisfied_count": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(csat, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "total_responses": 0 };
    const guard = csat.guards.find((entry) => entry.id === "zero_denominator:total_responses")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(csat, env));
  });

  it('recovers satisfied_count through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "csat": compute(csat, WORKED) as number,
    };
    delete env["satisfied_count"];
    const recovered = computeInverse(csat, "satisfied_count", env as Env);
    expectRelative(recovered, 342, 1e-9);
  });

  it('recovers total_responses through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "csat": compute(csat, WORKED) as number,
    };
    delete env["total_responses"];
    const recovered = computeInverse(csat, "total_responses", env as Env);
    expectRelative(recovered, 420, 1e-9);
  });
});
