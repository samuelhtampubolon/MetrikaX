// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { cpa } from '../../src/formulas/generated/cpa.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 13 of 76. */
const WORKED: Env = Object.freeze({
  "spend": 24000000,
  "acquisitions": 312
});

describe('CPA (cpa)', () => {
  it('computes the worked example', () => {
    const result = compute(cpa, WORKED) as number;
    expectRelative(result, 76923.07692307692);
  });

  it('states an outcome at the lower edge of the domain for spend', () => {
    const env = { ...WORKED, "spend": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(cpa, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "acquisitions": 0 };
    const guard = cpa.guards.find((entry) => entry.id === "zero_denominator:acquisitions")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(cpa, env));
  });

  it('recovers spend through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "cpa": compute(cpa, WORKED) as number,
    };
    delete env["spend"];
    const recovered = computeInverse(cpa, "spend", env as Env);
    expectRelative(recovered, 24000000, 1e-9);
  });

  it('recovers acquisitions through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "cpa": compute(cpa, WORKED) as number,
    };
    delete env["acquisitions"];
    const recovered = computeInverse(cpa, "acquisitions", env as Env);
    expectRelative(recovered, 312, 1e-9);
  });
});
