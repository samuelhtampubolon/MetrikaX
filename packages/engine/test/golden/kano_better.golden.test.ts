// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { kano_better } from '../../src/formulas/generated/kano_better.ts';
import { compute } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 61 of 76. */
const WORKED: Env = Object.freeze({
  "kano_a": 148,
  "kano_o": 96,
  "kano_m": 112,
  "kano_i": 64
});

describe('Kano_Better (kano_better)', () => {
  it('computes the worked example', () => {
    const result = compute(kano_better, WORKED) as number;
    expectRelative(result, 0.580952380952381);
  });

  it('states an outcome at the lower edge of the domain for kano_a', () => {
    const env = { ...WORKED, "kano_a": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(kano_better, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["kano_a"];
    expectEngineError(() => compute(kano_better, env as Env));
  });

  it('declares no inverse direction, so it can only be solved forwards', () => {
    expect(Object.keys(kano_better.inverses)).toHaveLength(0);
    expect(kano_better.publishesToGraph).toBe(false);
    expect(kano_better.resultShape).toBe("scalar");
  });
});
