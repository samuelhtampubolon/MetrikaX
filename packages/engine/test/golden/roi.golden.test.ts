// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { roi } from '../../src/formulas/generated/roi.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 35 of 76. */
const WORKED: Env = Object.freeze({
  "gain": 96000000,
  "cost": 42000000
});

describe('ROI (roi)', () => {
  it('computes the worked example', () => {
    const result = compute(roi, WORKED) as number;
    expectRelative(result, 1.2857142857142858);
  });

  it('states an outcome at the lower edge of the domain for gain', () => {
    const env = { ...WORKED, "gain": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(roi, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "cost": 0 };
    const guard = roi.guards.find((entry) => entry.id === "zero_denominator:cost")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(roi, env));
  });

  it('recovers gain through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "roi": compute(roi, WORKED) as number,
    };
    delete env["gain"];
    const recovered = computeInverse(roi, "gain", env as Env);
    expectRelative(recovered, 96000000, 1e-9);
  });

  it('recovers cost through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "roi": compute(roi, WORKED) as number,
    };
    delete env["cost"];
    const recovered = computeInverse(roi, "cost", env as Env);
    expectRelative(recovered, 42000000, 1e-9);
  });
});
