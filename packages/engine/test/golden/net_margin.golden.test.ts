// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { net_margin } from '../../src/formulas/generated/net_margin.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 26 of 76. */
const WORKED: Env = Object.freeze({
  "net_profit": 16650000,
  "revenue": 185000000
});

describe('Net_Margin (net_margin)', () => {
  it('computes the worked example', () => {
    const result = compute(net_margin, WORKED) as number;
    expectRelative(result, 0.09);
  });

  it('states an outcome at the lower edge of the domain for net_profit', () => {
    const env = { ...WORKED, "net_profit": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(net_margin, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "revenue": 0 };
    const guard = net_margin.guards.find((entry) => entry.id === "zero_denominator:revenue")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(net_margin, env));
  });

  it('recovers net_profit through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "net_margin": compute(net_margin, WORKED) as number,
    };
    delete env["net_profit"];
    const recovered = computeInverse(net_margin, "net_profit", env as Env);
    expectRelative(recovered, 16650000, 1e-9);
  });

  it('recovers revenue through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "net_margin": compute(net_margin, WORKED) as number,
    };
    delete env["revenue"];
    const recovered = computeInverse(net_margin, "revenue", env as Env);
    expectRelative(recovered, 185000000, 1e-9);
  });
});
