// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { pipeline_coverage } from '../../src/formulas/generated/pipeline_coverage.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 43 of 76. */
const WORKED: Env = Object.freeze({
  "pipeline_value": 1120000000,
  "quota": 320000000
});

describe('Pipeline_Coverage (pipeline_coverage)', () => {
  it('computes the worked example', () => {
    const result = compute(pipeline_coverage, WORKED) as number;
    expectRelative(result, 3.5);
  });

  it('states an outcome at the lower edge of the domain for pipeline_value', () => {
    const env = { ...WORKED, "pipeline_value": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(pipeline_coverage, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "quota": 0 };
    const guard = pipeline_coverage.guards.find((entry) => entry.id === "zero_denominator:quota")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(pipeline_coverage, env));
  });

  it('recovers pipeline_value through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "pipeline_coverage": compute(pipeline_coverage, WORKED) as number,
    };
    delete env["pipeline_value"];
    const recovered = computeInverse(pipeline_coverage, "pipeline_value", env as Env);
    expectRelative(recovered, 1120000000, 1e-9);
  });

  it('recovers quota through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "pipeline_coverage": compute(pipeline_coverage, WORKED) as number,
    };
    delete env["quota"];
    const recovered = computeInverse(pipeline_coverage, "quota", env as Env);
    expectRelative(recovered, 320000000, 1e-9);
  });
});
