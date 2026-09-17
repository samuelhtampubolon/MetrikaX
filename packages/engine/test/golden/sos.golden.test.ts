// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { sos } from '../../src/formulas/generated/sos.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 21 of 76. */
const WORKED: Env = Object.freeze({
  "brand_searches": 27000,
  "category_searches": 310000
});

describe('SOS (sos)', () => {
  it('computes the worked example', () => {
    const result = compute(sos, WORKED) as number;
    expectRelative(result, 0.08709677419354839);
  });

  it('states an outcome at the lower edge of the domain for brand_searches', () => {
    const env = { ...WORKED, "brand_searches": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(sos, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "category_searches": 0 };
    const guard = sos.guards.find((entry) => entry.id === "zero_denominator:category_searches")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(sos, env));
  });

  it('recovers brand_searches through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "sos": compute(sos, WORKED) as number,
    };
    delete env["brand_searches"];
    const recovered = computeInverse(sos, "brand_searches", env as Env);
    expectRelative(recovered, 27000, 1e-9);
  });

  it('recovers category_searches through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "sos": compute(sos, WORKED) as number,
    };
    delete env["category_searches"];
    const recovered = computeInverse(sos, "category_searches", env as Env);
    expectRelative(recovered, 310000, 1e-9);
  });
});
