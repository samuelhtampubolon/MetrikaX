// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { grp } from '../../src/formulas/generated/grp.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 48 of 76. */
const WORKED: Env = Object.freeze({
  "reach_pct": 62,
  "frequency": 4.8
});

describe('GRP (grp)', () => {
  it('computes the worked example', () => {
    const result = compute(grp, WORKED) as number;
    expectRelative(result, 297.59999999999997);
  });

  it('states an outcome at the lower edge of the domain for reach_pct', () => {
    const env = { ...WORKED, "reach_pct": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(grp, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('guards the zero denominator that appears in its inverse direction', () => {
    // frequency divides only when this relation is solved backwards, so the guard is what
    // stands between a zero and an infinite result.
    const guard = grp.guards.find((entry) => entry.id === "zero_denominator:frequency")!;
    expect(guard.check({ ...WORKED, "frequency": 0 }).ok).toBe(false);
    expect(guard.check({ ...WORKED, "frequency": 1 }).ok).toBe(true);
  });

  it('recovers reach_pct through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "grp": compute(grp, WORKED) as number,
    };
    delete env["reach_pct"];
    const recovered = computeInverse(grp, "reach_pct", env as Env);
    expectRelative(recovered, 62, 1e-9);
  });

  it('recovers frequency through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "grp": compute(grp, WORKED) as number,
    };
    delete env["frequency"];
    const recovered = computeInverse(grp, "frequency", env as Env);
    expectRelative(recovered, 4.8, 1e-9);
  });
});
