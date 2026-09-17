// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { rfm_score } from '../../src/formulas/generated/rfm_score.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 41 of 76. */
const WORKED: Env = Object.freeze({
  "rfm_r": 4,
  "rfm_f": 3,
  "rfm_m": 5,
  "rfm_wr": 0.4,
  "rfm_wf": 0.3,
  "rfm_wm": 0.3
});

describe('RFM_Score (rfm_score)', () => {
  it('computes the worked example', () => {
    const result = compute(rfm_score, WORKED) as number;
    expectRelative(result, 4);
  });

  it('states an outcome at the lower edge of the domain for rfm_r', () => {
    const env = { ...WORKED, "rfm_r": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(rfm_score, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('guards the zero denominator that appears in its inverse direction', () => {
    // rfm_wf divides only when this relation is solved backwards, so the guard is what
    // stands between a zero and an infinite result.
    const guard = rfm_score.guards.find((entry) => entry.id === "zero_denominator:rfm_wf")!;
    expect(guard.check({ ...WORKED, "rfm_wf": 0 }).ok).toBe(false);
    expect(guard.check({ ...WORKED, "rfm_wf": 1 }).ok).toBe(true);
  });

  it('recovers rfm_r through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "rfm_score": compute(rfm_score, WORKED) as number,
    };
    delete env["rfm_r"];
    const recovered = computeInverse(rfm_score, "rfm_r", env as Env);
    expectRelative(recovered, 4, 1e-9);
  });

  it('recovers rfm_f through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "rfm_score": compute(rfm_score, WORKED) as number,
    };
    delete env["rfm_f"];
    const recovered = computeInverse(rfm_score, "rfm_f", env as Env);
    expectRelative(recovered, 3, 1e-9);
  });

  it('recovers rfm_m through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "rfm_score": compute(rfm_score, WORKED) as number,
    };
    delete env["rfm_m"];
    const recovered = computeInverse(rfm_score, "rfm_m", env as Env);
    expectRelative(recovered, 5, 1e-9);
  });
});
