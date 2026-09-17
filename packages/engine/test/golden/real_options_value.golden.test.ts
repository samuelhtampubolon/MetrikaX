// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { real_options_value } from '../../src/formulas/generated/real_options_value.ts';
import { compute } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 76 of 76. */
const WORKED: Env = Object.freeze({
  "opt_s": 640000000,
  "opt_x": 480000000,
  "opt_r": 0.055,
  "opt_t": 2,
  "opt_sigma": 0.45
});

describe('Real_Options_Value (real_options_value)', () => {
  it('computes the worked example', () => {
    const result = compute(real_options_value, WORKED) as number;
    expectRelative(result, 262598061.0324147);
  });

  it('states an outcome at the lower edge of the domain for opt_s', () => {
    const env = { ...WORKED, "opt_s": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(real_options_value, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["opt_s"];
    expectEngineError(() => compute(real_options_value, env as Env));
  });

  it('declares no inverse direction, so it can only be solved forwards', () => {
    expect(Object.keys(real_options_value.inverses)).toHaveLength(0);
    expect(real_options_value.publishesToGraph).toBe(false);
    expect(real_options_value.resultShape).toBe("scalar");
  });
});
