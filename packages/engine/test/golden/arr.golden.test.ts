// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { arr } from '../../src/formulas/generated/arr.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 30 of 76. */
const WORKED: Env = Object.freeze({
  "mrr": 173900000
});

describe('ARR (arr)', () => {
  it('computes the worked example', () => {
    const result = compute(arr, WORKED) as number;
    expectRelative(result, 2086800000);
  });

  it('states an outcome at the lower edge of the domain for mrr', () => {
    const env = { ...WORKED, "mrr": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(arr, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["mrr"];
    expectEngineError(() => compute(arr, env as Env));
  });

  it('recovers mrr through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "arr": compute(arr, WORKED) as number,
    };
    delete env["mrr"];
    const recovered = computeInverse(arr, "mrr", env as Env);
    expectRelative(recovered, 173900000, 1e-9);
  });
});
