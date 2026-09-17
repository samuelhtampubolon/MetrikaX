// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { clv } from '../../src/formulas/generated/clv.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 39 of 76. */
const WORKED: Env = Object.freeze({
  "aov": 125000,
  "purchase_frequency": 2.4,
  "gross_margin": 0.6,
  "retention_rate": 0.88,
  "discount_rate": 0.1,
  "horizon_t": 5
});

describe('CLV (clv)', () => {
  it('computes the worked example', () => {
    const result = compute(clv, WORKED) as number;
    expectRelative(result, 484070.39999999997);
  });

  it('states an outcome at the lower edge of the domain for aov', () => {
    const env = { ...WORKED, "aov": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(clv, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["aov"];
    expectEngineError(() => compute(clv, env as Env));
  });

  it('recovers aov through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "clv": compute(clv, WORKED) as number,
    };
    delete env["aov"];
    const recovered = computeInverse(clv, "aov", env as Env);
    expectRelative(recovered, 125000, 1e-9);
  });

  it('recovers gross_margin through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "clv": compute(clv, WORKED) as number,
    };
    delete env["gross_margin"];
    const recovered = computeInverse(clv, "gross_margin", env as Env);
    expectRelative(recovered, 0.6, 1e-9);
  });

  it('recovers purchase_frequency through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "clv": compute(clv, WORKED) as number,
    };
    delete env["purchase_frequency"];
    const recovered = computeInverse(clv, "purchase_frequency", env as Env);
    expectRelative(recovered, 2.4, 1e-9);
  });
});
