// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { cpc } from '../../src/formulas/generated/cpc.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 11 of 76. */
const WORKED: Env = Object.freeze({
  "spend": 24000000,
  "clicks": 41600
});

describe('CPC (cpc)', () => {
  it('computes the worked example', () => {
    const result = compute(cpc, WORKED) as number;
    expectRelative(result, 576.9230769230769);
  });

  it('states an outcome at the lower edge of the domain for spend', () => {
    const env = { ...WORKED, "spend": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(cpc, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "clicks": 0 };
    const guard = cpc.guards.find((entry) => entry.id === "zero_denominator:clicks")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(cpc, env));
  });

  it('recovers spend through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "cpc": compute(cpc, WORKED) as number,
    };
    delete env["spend"];
    const recovered = computeInverse(cpc, "spend", env as Env);
    expectRelative(recovered, 24000000, 1e-9);
  });

  it('recovers clicks through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "cpc": compute(cpc, WORKED) as number,
    };
    delete env["clicks"];
    const recovered = computeInverse(cpc, "clicks", env as Env);
    expectRelative(recovered, 41600, 1e-9);
  });
});
