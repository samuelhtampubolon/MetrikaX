// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { income_elasticity } from '../../src/formulas/generated/income_elasticity.ts';
import { compute } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 56 of 76. */
const WORKED: Env = Object.freeze({
  "q1": 1200,
  "q2": 1560,
  "i1": 4800000,
  "i2": 5600000
});

describe('Income_Elasticity (income_elasticity)', () => {
  it('computes the worked example', () => {
    const result = compute(income_elasticity, WORKED) as number;
    expectRelative(result, 1.6956521739130432);
  });

  it('states an outcome at the lower edge of the domain for q1', () => {
    const env = { ...WORKED, "q1": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(income_elasticity, env);
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
    expectEngineError(() => compute(income_elasticity, env as Env));
  });

  it('declares no inverse direction, so it can only be solved forwards', () => {
    expect(Object.keys(income_elasticity.inverses)).toHaveLength(0);
    expect(income_elasticity.publishesToGraph).toBe(false);
    expect(income_elasticity.resultShape).toBe("scalar");
  });
});
