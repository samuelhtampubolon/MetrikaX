// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { sam } from '../../src/formulas/generated/sam.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 52 of 76. */
const WORKED: Env = Object.freeze({
  "tam": 280440000000,
  "reachable_percent": 35
});

describe('SAM (sam)', () => {
  it('computes the worked example', () => {
    const result = compute(sam, WORKED) as number;
    expectRelative(result, 98154000000);
  });

  it('states an outcome at the lower edge of the domain for tam', () => {
    const env = { ...WORKED, "tam": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(sam, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('guards the zero denominator that appears in its inverse direction', () => {
    // tam divides only when this relation is solved backwards, so the guard is what
    // stands between a zero and an infinite result.
    const guard = sam.guards.find((entry) => entry.id === "zero_denominator:tam")!;
    expect(guard.check({ ...WORKED, "tam": 0 }).ok).toBe(false);
    expect(guard.check({ ...WORKED, "tam": 1 }).ok).toBe(true);
  });

  it('recovers tam through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "sam": compute(sam, WORKED) as number,
    };
    delete env["tam"];
    const recovered = computeInverse(sam, "tam", env as Env);
    expectRelative(recovered, 280440000000, 1e-9);
  });

  it('recovers reachable_percent through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "sam": compute(sam, WORKED) as number,
    };
    delete env["reachable_percent"];
    const recovered = computeInverse(sam, "reachable_percent", env as Env);
    expectRelative(recovered, 35, 1e-9);
  });
});
