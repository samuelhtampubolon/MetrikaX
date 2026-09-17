// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { price_elasticity } from '../../src/formulas/generated/price_elasticity.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 54 of 76. */
const WORKED: Env = Object.freeze({
  "q1": 1200,
  "q2": 1450,
  "p1": 125000,
  "p2": 110000
});

describe('Price_Elasticity (price_elasticity)', () => {
  it('computes the worked example', () => {
    const result = compute(price_elasticity, WORKED) as number;
    expectRelative(result, -1.477987421383648);
  });

  it('states an outcome at the lower edge of the domain for q1', () => {
    const env = { ...WORKED, "q1": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(price_elasticity, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["q1"];
    expectEngineError(() => compute(price_elasticity, env as Env));
  });

  it('recovers q2 through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "price_elasticity": compute(price_elasticity, WORKED) as number,
    };
    delete env["q2"];
    const recovered = computeInverse(price_elasticity, "q2", env as Env);
    expectRelative(recovered, 1450, 1e-9);
  });
});
