// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { cart_abandonment_rate } from '../../src/formulas/generated/cart_abandonment_rate.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 5 of 76. */
const WORKED: Env = Object.freeze({
  "carts_created": 9500,
  "carts_purchased": 1900
});

describe('Cart_Abandonment_Rate (cart_abandonment_rate)', () => {
  it('computes the worked example', () => {
    const result = compute(cart_abandonment_rate, WORKED) as number;
    expectRelative(result, 0.8);
  });

  it('states an outcome at the lower edge of the domain for carts_created', () => {
    const env = { ...WORKED, "carts_created": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(cart_abandonment_rate, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "carts_created": 0 };
    const guard = cart_abandonment_rate.guards.find((entry) => entry.id === "zero_denominator:carts_created")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(cart_abandonment_rate, env));
  });

  it('recovers carts_purchased through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "cart_abandonment_rate": compute(cart_abandonment_rate, WORKED) as number,
    };
    delete env["carts_purchased"];
    const recovered = computeInverse(cart_abandonment_rate, "carts_purchased", env as Env);
    expectRelative(recovered, 1900, 1e-9);
  });

  it('recovers carts_created through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "cart_abandonment_rate": compute(cart_abandonment_rate, WORKED) as number,
    };
    delete env["carts_created"];
    const recovered = computeInverse(cart_abandonment_rate, "carts_created", env as Env);
    expectRelative(recovered, 9500, 1e-9);
  });
});
