// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { mrr } from '../../src/formulas/generated/mrr.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 29 of 76. */
const WORKED: Env = Object.freeze({
  "arpu": 185000,
  "subscribers": 940
});

describe('MRR (mrr)', () => {
  it('computes the worked example', () => {
    const result = compute(mrr, WORKED) as number;
    expectRelative(result, 173900000);
  });

  it('states an outcome at the lower edge of the domain for arpu', () => {
    const env = { ...WORKED, "arpu": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(mrr, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('guards the zero denominator that appears in its inverse direction', () => {
    // arpu divides only when this relation is solved backwards, so the guard is what
    // stands between a zero and an infinite result.
    const guard = mrr.guards.find((entry) => entry.id === "zero_denominator:arpu")!;
    expect(guard.check({ ...WORKED, "arpu": 0 }).ok).toBe(false);
    expect(guard.check({ ...WORKED, "arpu": 1 }).ok).toBe(true);
  });

  it('recovers arpu through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "mrr": compute(mrr, WORKED) as number,
    };
    delete env["arpu"];
    const recovered = computeInverse(mrr, "arpu", env as Env);
    expectRelative(recovered, 185000, 1e-9);
  });

  it('recovers subscribers through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "mrr": compute(mrr, WORKED) as number,
    };
    delete env["subscribers"];
    const recovered = computeInverse(mrr, "subscribers", env as Env);
    expectRelative(recovered, 940, 1e-9);
  });
});
