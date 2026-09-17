// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { arpu } from '../../src/formulas/generated/arpu.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 7 of 76. */
const WORKED: Env = Object.freeze({
  "revenue": 185000000,
  "users": 52000
});

describe('ARPU (arpu)', () => {
  it('computes the worked example', () => {
    const result = compute(arpu, WORKED) as number;
    expectRelative(result, 3557.6923076923076);
  });

  it('states an outcome at the lower edge of the domain for revenue', () => {
    const env = { ...WORKED, "revenue": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(arpu, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "users": 0 };
    const guard = arpu.guards.find((entry) => entry.id === "zero_denominator:users")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(arpu, env));
  });

  it('recovers revenue through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "arpu": compute(arpu, WORKED) as number,
    };
    delete env["revenue"];
    const recovered = computeInverse(arpu, "revenue", env as Env);
    expectRelative(recovered, 185000000, 1e-9);
  });

  it('recovers users through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "arpu": compute(arpu, WORKED) as number,
    };
    delete env["users"];
    const recovered = computeInverse(arpu, "users", env as Env);
    expectRelative(recovered, 52000, 1e-9);
  });
});
