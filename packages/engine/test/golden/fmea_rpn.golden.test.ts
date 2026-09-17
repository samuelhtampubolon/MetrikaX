// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { fmea_rpn } from '../../src/formulas/generated/fmea_rpn.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 71 of 76. */
const WORKED: Env = Object.freeze({
  "severity": 8,
  "occurrence": 4,
  "detection": 6
});

describe('FMEA_RPN (fmea_rpn)', () => {
  it('computes the worked example', () => {
    const result = compute(fmea_rpn, WORKED) as number;
    expectRelative(result, 192);
  });

  it('states an outcome at the lower edge of the domain for severity', () => {
    const env = { ...WORKED, "severity": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(fmea_rpn, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["severity"];
    expectEngineError(() => compute(fmea_rpn, env as Env));
  });

  it('recovers severity through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "fmea_rpn": compute(fmea_rpn, WORKED) as number,
    };
    delete env["severity"];
    const recovered = computeInverse(fmea_rpn, "severity", env as Env);
    expectRelative(recovered, 8, 1e-9);
  });

  it('recovers occurrence through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "fmea_rpn": compute(fmea_rpn, WORKED) as number,
    };
    delete env["occurrence"];
    const recovered = computeInverse(fmea_rpn, "occurrence", env as Env);
    expectRelative(recovered, 4, 1e-9);
  });

  it('recovers detection through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "fmea_rpn": compute(fmea_rpn, WORKED) as number,
    };
    delete env["detection"];
    const recovered = computeInverse(fmea_rpn, "detection", env as Env);
    expectRelative(recovered, 6, 1e-9);
  });
});
