// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { payback_period } from '../../src/formulas/generated/payback_period.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 33 of 76. */
const WORKED: Env = Object.freeze({
  "cac": 371681,
  "arpu": 185000,
  "gross_margin": 0.6
});

describe('Payback_Period (payback_period)', () => {
  it('computes the worked example', () => {
    const result = compute(payback_period, WORKED) as number;
    expectRelative(result, 3.3484774774774775);
  });

  it('states an outcome at the lower edge of the domain for cac', () => {
    const env = { ...WORKED, "cac": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(payback_period, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["cac"];
    expectEngineError(() => compute(payback_period, env as Env));
  });

  it('recovers cac through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "payback_period": compute(payback_period, WORKED) as number,
    };
    delete env["cac"];
    const recovered = computeInverse(payback_period, "cac", env as Env);
    expectRelative(recovered, 371681, 1e-9);
  });

  it('recovers arpu through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "payback_period": compute(payback_period, WORKED) as number,
    };
    delete env["arpu"];
    const recovered = computeInverse(payback_period, "arpu", env as Env);
    expectRelative(recovered, 185000, 1e-9);
  });

  it('recovers gross_margin through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "payback_period": compute(payback_period, WORKED) as number,
    };
    delete env["gross_margin"];
    const recovered = computeInverse(payback_period, "gross_margin", env as Env);
    expectRelative(recovered, 0.6, 1e-9);
  });
});
