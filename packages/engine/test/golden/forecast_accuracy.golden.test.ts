// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { forecast_accuracy } from '../../src/formulas/generated/forecast_accuracy.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 44 of 76. */
const WORKED: Env = Object.freeze({
  "forecast": 340000000,
  "actual": 318000000
});

describe('Forecast_Accuracy (forecast_accuracy)', () => {
  it('computes the worked example', () => {
    const result = compute(forecast_accuracy, WORKED) as number;
    expectRelative(result, 0.9308176100628931);
  });

  it('states an outcome at the lower edge of the domain for forecast', () => {
    const env = { ...WORKED, "forecast": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(forecast_accuracy, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["forecast"];
    expectEngineError(() => compute(forecast_accuracy, env as Env));
  });

  it('recovers forecast through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "forecast_accuracy": compute(forecast_accuracy, WORKED) as number,
    };
    delete env["forecast"];
    const recovered = computeInverse(forecast_accuracy, "forecast", env as Env);
    expectRelative(recovered, 340000000, 1e-9);
  });

  it('recovers actual through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "forecast_accuracy": compute(forecast_accuracy, WORKED) as number,
    };
    delete env["actual"];
    const recovered = computeInverse(forecast_accuracy, "actual", env as Env);
    expectRelative(recovered, 318000000, 1e-9);
  });
});
