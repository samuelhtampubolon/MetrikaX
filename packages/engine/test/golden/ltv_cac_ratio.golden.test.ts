// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { ltv_cac_ratio } from '../../src/formulas/generated/ltv_cac_ratio.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 40 of 76. */
const WORKED: Env = Object.freeze({
  "clv": 2775000,
  "cac": 371681
});

describe('LTV_CAC_Ratio (ltv_cac_ratio)', () => {
  it('computes the worked example', () => {
    const result = compute(ltv_cac_ratio, WORKED) as number;
    expectRelative(result, 7.466079783470234);
  });

  it('states an outcome at the lower edge of the domain for clv', () => {
    const env = { ...WORKED, "clv": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(ltv_cac_ratio, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "cac": 0 };
    const guard = ltv_cac_ratio.guards.find((entry) => entry.id === "zero_denominator:cac")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(ltv_cac_ratio, env));
  });

  it('recovers clv through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "ltv_cac_ratio": compute(ltv_cac_ratio, WORKED) as number,
    };
    delete env["clv"];
    const recovered = computeInverse(ltv_cac_ratio, "clv", env as Env);
    expectRelative(recovered, 2775000, 1e-9);
  });

  it('recovers cac through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "ltv_cac_ratio": compute(ltv_cac_ratio, WORKED) as number,
    };
    delete env["cac"];
    const recovered = computeInverse(ltv_cac_ratio, "cac", env as Env);
    expectRelative(recovered, 371681, 1e-9);
  });
});
