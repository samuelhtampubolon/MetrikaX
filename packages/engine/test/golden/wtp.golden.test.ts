// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { wtp } from '../../src/formulas/generated/wtp.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 60 of 76. */
const WORKED: Env = Object.freeze({
  "delta_u": 0.55,
  "beta_price": -0.000012
});

describe('WTP (wtp)', () => {
  it('computes the worked example', () => {
    const result = compute(wtp, WORKED) as number;
    expectRelative(result, 45833.333333333336);
  });

  it('states an outcome at the lower edge of the domain for delta_u', () => {
    const env = { ...WORKED, "delta_u": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(wtp, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('guards the zero denominator that appears in its inverse direction', () => {
    // wtp divides only when this relation is solved backwards, so the guard is what
    // stands between a zero and an infinite result.
    const guard = wtp.guards.find((entry) => entry.id === "zero_denominator:wtp")!;
    expect(guard.check({ ...WORKED, "wtp": 0 }).ok).toBe(false);
    expect(guard.check({ ...WORKED, "wtp": 1 }).ok).toBe(true);
  });

  it('recovers delta_u through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "wtp": compute(wtp, WORKED) as number,
    };
    delete env["delta_u"];
    const recovered = computeInverse(wtp, "delta_u", env as Env);
    expectRelative(recovered, 0.55, 1e-9);
  });

  it('recovers beta_price through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "wtp": compute(wtp, WORKED) as number,
    };
    delete env["beta_price"];
    const recovered = computeInverse(wtp, "beta_price", env as Env);
    // The forward direction takes the absolute value of beta_price, so the sign does not survive
    // the round trip. Only the magnitude is recoverable.
    expectRelative(Math.abs(recovered), 0.000012, 1e-9);
  });
});
