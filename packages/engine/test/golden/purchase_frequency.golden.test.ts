// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { purchase_frequency } from '../../src/formulas/generated/purchase_frequency.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 9 of 76. */
const WORKED: Env = Object.freeze({
  "orders": 1480,
  "unique_customers": 620
});

describe('Purchase_Frequency (purchase_frequency)', () => {
  it('computes the worked example', () => {
    const result = compute(purchase_frequency, WORKED) as number;
    expectRelative(result, 2.3870967741935485);
  });

  it('states an outcome at the lower edge of the domain for orders', () => {
    const env = { ...WORKED, "orders": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(purchase_frequency, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "unique_customers": 0 };
    const guard = purchase_frequency.guards.find((entry) => entry.id === "zero_denominator:unique_customers")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(purchase_frequency, env));
  });

  it('recovers orders through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "purchase_frequency": compute(purchase_frequency, WORKED) as number,
    };
    delete env["orders"];
    const recovered = computeInverse(purchase_frequency, "orders", env as Env);
    expectRelative(recovered, 1480, 1e-9);
  });

  it('recovers unique_customers through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "purchase_frequency": compute(purchase_frequency, WORKED) as number,
    };
    delete env["unique_customers"];
    const recovered = computeInverse(purchase_frequency, "unique_customers", env as Env);
    expectRelative(recovered, 620, 1e-9);
  });
});
