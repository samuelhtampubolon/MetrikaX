// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { evpi } from '../../src/formulas/generated/evpi.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 75 of 76. */
const WORKED: Env = Object.freeze({
  "ev_perfect": 412000000,
  "ev_base": 289000000
});

describe('EVPI (evpi)', () => {
  it('computes the worked example', () => {
    const result = compute(evpi, WORKED) as number;
    expectRelative(result, 123000000);
  });

  it('states an outcome at the lower edge of the domain for ev_perfect', () => {
    const env = { ...WORKED, "ev_perfect": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(evpi, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["ev_perfect"];
    expectEngineError(() => compute(evpi, env as Env));
  });

  it('recovers ev_perfect through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "evpi": compute(evpi, WORKED) as number,
    };
    delete env["ev_perfect"];
    const recovered = computeInverse(evpi, "ev_perfect", env as Env);
    expectRelative(recovered, 412000000, 1e-9);
  });

  it('recovers ev_base through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "evpi": compute(evpi, WORKED) as number,
    };
    delete env["ev_base"];
    const recovered = computeInverse(evpi, "ev_base", env as Env);
    expectRelative(recovered, 289000000, 1e-9);
  });
});
