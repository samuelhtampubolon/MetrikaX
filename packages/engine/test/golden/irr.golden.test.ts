// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { irr } from '../../src/formulas/generated/irr.ts';
import { compute } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 73 of 76. */
const WORKED: Env = Object.freeze({
  "cash_flows": [
    120000000,
    180000000,
    240000000,
    260000000,
    280000000
  ],
  "investment_0": 480000000
});

describe('IRR (irr)', () => {
  it('computes the worked example and returns its full structure', () => {
    const result = compute(irr, WORKED);
    const solution = result as { roots: number[]; unique: boolean; converged: boolean };
    expect(solution.converged).toBe(true);
    // Every root found is reported. Reporting one root when several exist is a correctness bug.
    expect(solution.roots).toHaveLength(1);
    expect(solution.unique).toBe(true);
    expectRelative(solution.roots[0]!, 0.2948454256095904, 1e-6);
  });

  it('states an outcome at the lower edge of the domain for investment_0', () => {
    const env = { ...WORKED, "investment_0": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(irr, env);
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
    expectEngineError(() => compute(irr, env as Env));
  });

  it('declares no inverse direction, so it can only be solved forwards', () => {
    expect(Object.keys(irr.inverses)).toHaveLength(0);
    expect(irr.publishesToGraph).toBe(false);
    expect(irr.resultShape).toBe("composite");
  });
});
