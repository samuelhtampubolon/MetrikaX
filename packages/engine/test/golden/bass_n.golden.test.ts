// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { bass_n } from '../../src/formulas/generated/bass_n.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 66 of 76. */
const WORKED: Env = Object.freeze({
  "bass_p": 0.021,
  "bass_q": 0.38,
  "bass_m": 180000,
  "bass_nt": 42000
});

describe('Bass_n(t) (bass_n)', () => {
  it('computes the worked example', () => {
    const result = compute(bass_n, WORKED) as number;
    expectRelative(result, 15134);
  });

  it('states an outcome at the lower edge of the domain for bass_m', () => {
    const env = { ...WORKED, "bass_m": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(bass_n, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "bass_m": 0 };
    const guard = bass_n.guards.find((entry) => entry.id === "zero_denominator:bass_m")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(bass_n, env));
  });

  it('recovers bass_p through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "bass_n": compute(bass_n, WORKED) as number,
    };
    delete env["bass_p"];
    const recovered = computeInverse(bass_n, "bass_p", env as Env);
    expectRelative(recovered, 0.021, 1e-9);
  });
});
