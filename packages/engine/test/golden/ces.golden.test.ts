// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { ces } from '../../src/formulas/generated/ces.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 24 of 76. */
const WORKED: Env = Object.freeze({
  "effort_sum": 1218,
  "total_responses": 420
});

describe('CES (ces)', () => {
  it('computes the worked example', () => {
    const result = compute(ces, WORKED) as number;
    expectRelative(result, 2.9);
  });

  it('states an outcome at the lower edge of the domain for total_responses', () => {
    const env = { ...WORKED, "total_responses": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(ces, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "total_responses": 0 };
    const guard = ces.guards.find((entry) => entry.id === "zero_denominator:total_responses")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(ces, env));
  });

  it('recovers effort_sum through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "ces": compute(ces, WORKED) as number,
    };
    delete env["effort_sum"];
    const recovered = computeInverse(ces, "effort_sum", env as Env);
    expectRelative(recovered, 1218, 1e-9);
  });

  it('recovers total_responses through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "ces": compute(ces, WORKED) as number,
    };
    delete env["total_responses"];
    const recovered = computeInverse(ces, "total_responses", env as Env);
    expectRelative(recovered, 420, 1e-9);
  });
});
