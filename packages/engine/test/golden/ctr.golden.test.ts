// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { ctr } from '../../src/formulas/generated/ctr.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 1 of 76. */
const WORKED: Env = Object.freeze({
  "clicks": 1250,
  "impressions": 100000
});

describe('CTR (ctr)', () => {
  it('computes the worked example', () => {
    const result = compute(ctr, WORKED) as number;
    expectRelative(result, 0.0125);
  });

  it('states an outcome at the lower edge of the domain for clicks', () => {
    const env = { ...WORKED, "clicks": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(ctr, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "impressions": 0 };
    const guard = ctr.guards.find((entry) => entry.id === "zero_denominator:impressions")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(ctr, env));
  });

  it('recovers clicks through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "ctr_out": compute(ctr, WORKED) as number,
    };
    delete env["clicks"];
    const recovered = computeInverse(ctr, "clicks", env as Env);
    expectRelative(recovered, 1250, 1e-9);
  });

  it('recovers impressions through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "ctr_out": compute(ctr, WORKED) as number,
    };
    delete env["impressions"];
    const recovered = computeInverse(ctr, "impressions", env as Env);
    expectRelative(recovered, 100000, 1e-9);
  });
});
