// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { nps } from '../../src/formulas/generated/nps.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 23 of 76. */
const WORKED: Env = Object.freeze({
  "promoters": 186,
  "detractors": 74,
  "total_respondents": 420
});

describe('NPS (nps)', () => {
  it('computes the worked example', () => {
    const result = compute(nps, WORKED) as number;
    expectRelative(result, 26.666666666666668);
  });

  it('states an outcome at the lower edge of the domain for promoters', () => {
    const env = { ...WORKED, "promoters": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(nps, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "total_respondents": 0 };
    const guard = nps.guards.find((entry) => entry.id === "zero_denominator:total_respondents")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(nps, env));
  });

  it('recovers promoters through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "nps": compute(nps, WORKED) as number,
    };
    delete env["promoters"];
    const recovered = computeInverse(nps, "promoters", env as Env);
    expectRelative(recovered, 186, 1e-9);
  });

  it('recovers detractors through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "nps": compute(nps, WORKED) as number,
    };
    delete env["detractors"];
    const recovered = computeInverse(nps, "detractors", env as Env);
    expectRelative(recovered, 74, 1e-9);
  });

  it('recovers total_respondents through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "nps": compute(nps, WORKED) as number,
    };
    delete env["total_respondents"];
    const recovered = computeInverse(nps, "total_respondents", env as Env);
    expectRelative(recovered, 420, 1e-9);
  });
});
