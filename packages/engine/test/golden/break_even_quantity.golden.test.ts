// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { break_even_quantity } from '../../src/formulas/generated/break_even_quantity.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 28 of 76. */
const WORKED: Env = Object.freeze({
  "fixed_cost": 480000000,
  "price": 125000,
  "variable_cost": 74000
});

describe('Break_Even_Quantity (break_even_quantity)', () => {
  it('computes the worked example', () => {
    const result = compute(break_even_quantity, WORKED) as number;
    expectRelative(result, 9411.764705882353);
  });

  it('states an outcome at the lower edge of the domain for fixed_cost', () => {
    const env = { ...WORKED, "fixed_cost": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(break_even_quantity, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('guards the zero denominator that appears in its inverse direction', () => {
    // break_even_quantity divides only when this relation is solved backwards, so the guard is what
    // stands between a zero and an infinite result.
    const guard = break_even_quantity.guards.find((entry) => entry.id === "zero_denominator:break_even_quantity")!;
    expect(guard.check({ ...WORKED, "break_even_quantity": 0 }).ok).toBe(false);
    expect(guard.check({ ...WORKED, "break_even_quantity": 1 }).ok).toBe(true);
  });

  it('recovers fixed_cost through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "break_even_quantity": compute(break_even_quantity, WORKED) as number,
    };
    delete env["fixed_cost"];
    const recovered = computeInverse(break_even_quantity, "fixed_cost", env as Env);
    expectRelative(recovered, 480000000, 1e-9);
  });

  it('recovers price through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "break_even_quantity": compute(break_even_quantity, WORKED) as number,
    };
    delete env["price"];
    const recovered = computeInverse(break_even_quantity, "price", env as Env);
    expectRelative(recovered, 125000, 1e-9);
  });

  it('recovers variable_cost through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "break_even_quantity": compute(break_even_quantity, WORKED) as number,
    };
    delete env["variable_cost"];
    const recovered = computeInverse(break_even_quantity, "variable_cost", env as Env);
    expectRelative(recovered, 74000, 1e-9);
  });
});
