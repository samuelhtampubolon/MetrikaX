// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { lead_to_customer_rate } from '../../src/formulas/generated/lead_to_customer_rate.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 17 of 76. */
const WORKED: Env = Object.freeze({
  "customers": 92,
  "leads": 840
});

describe('Lead_to_Customer_Rate (lead_to_customer_rate)', () => {
  it('computes the worked example', () => {
    const result = compute(lead_to_customer_rate, WORKED) as number;
    expectRelative(result, 0.10952380952380952);
  });

  it('states an outcome at the lower edge of the domain for customers', () => {
    const env = { ...WORKED, "customers": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(lead_to_customer_rate, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "leads": 0 };
    const guard = lead_to_customer_rate.guards.find((entry) => entry.id === "zero_denominator:leads")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(lead_to_customer_rate, env));
  });

  it('recovers customers through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "lead_to_customer_rate": compute(lead_to_customer_rate, WORKED) as number,
    };
    delete env["customers"];
    const recovered = computeInverse(lead_to_customer_rate, "customers", env as Env);
    expectRelative(recovered, 92, 1e-9);
  });

  it('recovers leads through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "lead_to_customer_rate": compute(lead_to_customer_rate, WORKED) as number,
    };
    delete env["leads"];
    const recovered = computeInverse(lead_to_customer_rate, "leads", env as Env);
    expectRelative(recovered, 840, 1e-9);
  });
});
