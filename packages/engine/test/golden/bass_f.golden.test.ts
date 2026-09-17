// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { bass_f } from '../../src/formulas/generated/bass_f.ts';
import { compute } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 65 of 76. */
const WORKED: Env = Object.freeze({
  "bass_p": 0.021,
  "bass_q": 0.38,
  "time_t": 6
});

describe('Bass_F(t) (bass_f)', () => {
  it('computes the worked example', () => {
    const result = compute(bass_f, WORKED) as number;
    expectRelative(result, 0.3457118338013339);
  });

  it('states an outcome at the lower edge of the domain for bass_p', () => {
    const env = { ...WORKED, "bass_p": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(bass_f, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "bass_p": 0 };
    const guard = bass_f.guards.find((entry) => entry.id === "zero_denominator:bass_p")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(bass_f, env));
  });

  it('declares no inverse direction, so it can only be solved forwards', () => {
    expect(Object.keys(bass_f.inverses)).toHaveLength(0);
    expect(bass_f.publishesToGraph).toBe(false);
    expect(bass_f.resultShape).toBe("scalar");
  });
});
