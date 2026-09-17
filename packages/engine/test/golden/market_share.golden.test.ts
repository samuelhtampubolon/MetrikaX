// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { market_share } from '../../src/formulas/generated/market_share.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 18 of 76. */
const WORKED: Env = Object.freeze({
  "company_sales": 4200000000,
  "market_sales": 38000000000
});

describe('Market_Share (market_share)', () => {
  it('computes the worked example', () => {
    const result = compute(market_share, WORKED) as number;
    expectRelative(result, 0.11052631578947368);
  });

  it('states an outcome at the lower edge of the domain for company_sales', () => {
    const env = { ...WORKED, "company_sales": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(market_share, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "market_sales": 0 };
    const guard = market_share.guards.find((entry) => entry.id === "zero_denominator:market_sales")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(market_share, env));
  });

  it('recovers company_sales through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "company_share": compute(market_share, WORKED) as number,
    };
    delete env["company_sales"];
    const recovered = computeInverse(market_share, "company_sales", env as Env);
    expectRelative(recovered, 4200000000, 1e-9);
  });

  it('recovers market_sales through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "company_share": compute(market_share, WORKED) as number,
    };
    delete env["market_sales"];
    const recovered = computeInverse(market_share, "market_sales", env as Env);
    expectRelative(recovered, 38000000000, 1e-9);
  });
});
