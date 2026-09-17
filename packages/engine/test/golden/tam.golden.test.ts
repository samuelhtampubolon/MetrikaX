// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { tam } from '../../src/formulas/generated/tam.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 51 of 76. */
const WORKED: Env = Object.freeze({
  "population": 410000,
  "need_percent": 38,
  "arpu": 1800000
});

describe('TAM (tam)', () => {
  it('computes the worked example', () => {
    const result = compute(tam, WORKED) as number;
    expectRelative(result, 280440000000);
  });

  it('states an outcome at the lower edge of the domain for population', () => {
    const env = { ...WORKED, "population": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(tam, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["population"];
    expectEngineError(() => compute(tam, env as Env));
  });

  it('recovers population through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "tam": compute(tam, WORKED) as number,
    };
    delete env["population"];
    const recovered = computeInverse(tam, "population", env as Env);
    expectRelative(recovered, 410000, 1e-9);
  });

  it('recovers need_percent through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "tam": compute(tam, WORKED) as number,
    };
    delete env["need_percent"];
    const recovered = computeInverse(tam, "need_percent", env as Env);
    expectRelative(recovered, 38, 1e-9);
  });

  it('recovers arpu through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "tam": compute(tam, WORKED) as number,
    };
    delete env["arpu"];
    const recovered = computeInverse(tam, "arpu", env as Env);
    expectRelative(recovered, 1800000, 1e-9);
  });
});
