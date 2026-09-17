// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { som } from '../../src/formulas/generated/som.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 53 of 76. */
const WORKED: Env = Object.freeze({
  "sam": 98154000000,
  "capture_percent": 8
});

describe('SOM (som)', () => {
  it('computes the worked example', () => {
    const result = compute(som, WORKED) as number;
    expectRelative(result, 7852320000);
  });

  it('states an outcome at the lower edge of the domain for sam', () => {
    const env = { ...WORKED, "sam": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(som, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('guards the zero denominator that appears in its inverse direction', () => {
    // sam divides only when this relation is solved backwards, so the guard is what
    // stands between a zero and an infinite result.
    const guard = som.guards.find((entry) => entry.id === "zero_denominator:sam")!;
    expect(guard.check({ ...WORKED, "sam": 0 }).ok).toBe(false);
    expect(guard.check({ ...WORKED, "sam": 1 }).ok).toBe(true);
  });

  it('recovers sam through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "som": compute(som, WORKED) as number,
    };
    delete env["sam"];
    const recovered = computeInverse(som, "sam", env as Env);
    expectRelative(recovered, 98154000000, 1e-9);
  });

  it('recovers capture_percent through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "som": compute(som, WORKED) as number,
    };
    delete env["capture_percent"];
    const recovered = computeInverse(som, "capture_percent", env as Env);
    expectRelative(recovered, 8, 1e-9);
  });
});
