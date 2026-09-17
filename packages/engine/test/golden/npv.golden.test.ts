// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { npv } from '../../src/formulas/generated/npv.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 72 of 76. */
const WORKED: Env = Object.freeze({
  "cash_flows": [
    120000000,
    180000000,
    240000000,
    260000000,
    280000000
  ],
  "discount_rate": 0.12,
  "investment_0": 480000000
});

describe('NPV (npv)', () => {
  it('computes the worked example', () => {
    const result = compute(npv, WORKED) as number;
    expectRelative(result, 265579234.5637232);
  });

  it('states an outcome at the lower edge of the domain for investment_0', () => {
    const env = { ...WORKED, "investment_0": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(npv, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["cash_flows"];
    expectEngineError(() => compute(npv, env as Env));
  });

  it('recovers investment_0 through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "npv_out": compute(npv, WORKED) as number,
    };
    delete env["investment_0"];
    const recovered = computeInverse(npv, "investment_0", env as Env);
    expectRelative(recovered, 480000000, 1e-9);
  });
});
