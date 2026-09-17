// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { k_factor } from '../../src/formulas/generated/k_factor.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 47 of 76. */
const WORKED: Env = Object.freeze({
  "invites_per_user": 3.2,
  "invite_conversion": 0.18
});

describe('K_Factor_Virality (k_factor)', () => {
  it('computes the worked example', () => {
    const result = compute(k_factor, WORKED) as number;
    expectRelative(result, 0.576);
  });

  it('states an outcome at the lower edge of the domain for invites_per_user', () => {
    const env = { ...WORKED, "invites_per_user": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(k_factor, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('guards the zero denominator that appears in its inverse direction', () => {
    // invite_conversion divides only when this relation is solved backwards, so the guard is what
    // stands between a zero and an infinite result.
    const guard = k_factor.guards.find((entry) => entry.id === "zero_denominator:invite_conversion")!;
    expect(guard.check({ ...WORKED, "invite_conversion": 0 }).ok).toBe(false);
    expect(guard.check({ ...WORKED, "invite_conversion": 1 }).ok).toBe(true);
  });

  it('recovers invites_per_user through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "k_factor": compute(k_factor, WORKED) as number,
    };
    delete env["invites_per_user"];
    const recovered = computeInverse(k_factor, "invites_per_user", env as Env);
    expectRelative(recovered, 3.2, 1e-9);
  });

  it('recovers invite_conversion through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "k_factor": compute(k_factor, WORKED) as number,
    };
    delete env["invite_conversion"];
    const recovered = computeInverse(k_factor, "invite_conversion", env as Env);
    expectRelative(recovered, 0.18, 1e-9);
  });
});
