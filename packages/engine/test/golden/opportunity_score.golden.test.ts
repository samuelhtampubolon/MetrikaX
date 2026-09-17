// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { opportunity_score } from '../../src/formulas/generated/opportunity_score.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 63 of 76. */
const WORKED: Env = Object.freeze({
  "importance": 8.6,
  "satisfaction": 4.2
});

describe('Opportunity_Score (opportunity_score)', () => {
  it('computes the worked example', () => {
    const result = compute(opportunity_score, WORKED) as number;
    expectRelative(result, 13);
  });

  it('states an outcome at the lower edge of the domain for importance', () => {
    const env = { ...WORKED, "importance": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(opportunity_score, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["importance"];
    expectEngineError(() => compute(opportunity_score, env as Env));
  });

  it('recovers satisfaction through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "opportunity_score": compute(opportunity_score, WORKED) as number,
    };
    delete env["satisfaction"];
    const recovered = computeInverse(opportunity_score, "satisfaction", env as Env);
    expectRelative(recovered, 4.2, 1e-9);
  });
});
