// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { sales_velocity } from '../../src/formulas/generated/sales_velocity.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 42 of 76. */
const WORKED: Env = Object.freeze({
  "opportunities": 84,
  "deal_value": 18000000,
  "win_rate": 0.22,
  "cycle_length": 45
});

describe('Sales_Velocity (sales_velocity)', () => {
  it('computes the worked example', () => {
    const result = compute(sales_velocity, WORKED) as number;
    expectRelative(result, 7392000);
  });

  it('states an outcome at the lower edge of the domain for opportunities', () => {
    const env = { ...WORKED, "opportunities": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(sales_velocity, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "cycle_length": 0 };
    const guard = sales_velocity.guards.find((entry) => entry.id === "zero_denominator:cycle_length")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(sales_velocity, env));
  });

  it('recovers opportunities through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "sales_velocity": compute(sales_velocity, WORKED) as number,
    };
    delete env["opportunities"];
    const recovered = computeInverse(sales_velocity, "opportunities", env as Env);
    expectRelative(recovered, 84, 1e-9);
  });

  it('recovers deal_value through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "sales_velocity": compute(sales_velocity, WORKED) as number,
    };
    delete env["deal_value"];
    const recovered = computeInverse(sales_velocity, "deal_value", env as Env);
    expectRelative(recovered, 18000000, 1e-9);
  });

  it('recovers win_rate through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "sales_velocity": compute(sales_velocity, WORKED) as number,
    };
    delete env["win_rate"];
    const recovered = computeInverse(sales_velocity, "win_rate", env as Env);
    expectRelative(recovered, 0.22, 1e-9);
  });

  it('recovers cycle_length through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "sales_velocity": compute(sales_velocity, WORKED) as number,
    };
    delete env["cycle_length"];
    const recovered = computeInverse(sales_velocity, "cycle_length", env as Env);
    expectRelative(recovered, 45, 1e-9);
  });
});
