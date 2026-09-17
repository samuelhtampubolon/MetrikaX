// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { relative_market_share } from '../../src/formulas/generated/relative_market_share.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 37 of 76. */
const WORKED: Env = Object.freeze({
  "company_share": 0.11,
  "largest_competitor_share": 0.29
});

describe('Relative_Market_Share (relative_market_share)', () => {
  it('computes the worked example', () => {
    const result = compute(relative_market_share, WORKED) as number;
    expectRelative(result, 0.37931034482758624);
  });

  it('states an outcome at the lower edge of the domain for company_share', () => {
    const env = { ...WORKED, "company_share": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(relative_market_share, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "largest_competitor_share": 0 };
    const guard = relative_market_share.guards.find((entry) => entry.id === "zero_denominator:largest_competitor_share")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(relative_market_share, env));
  });

  it('recovers company_share through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "relative_market_share": compute(relative_market_share, WORKED) as number,
    };
    delete env["company_share"];
    const recovered = computeInverse(relative_market_share, "company_share", env as Env);
    expectRelative(recovered, 0.11, 1e-9);
  });

  it('recovers largest_competitor_share through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "relative_market_share": compute(relative_market_share, WORKED) as number,
    };
    delete env["largest_competitor_share"];
    const recovered = computeInverse(relative_market_share, "largest_competitor_share", env as Env);
    expectRelative(recovered, 0.29, 1e-9);
  });
});
