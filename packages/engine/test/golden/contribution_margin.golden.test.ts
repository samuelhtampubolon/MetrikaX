// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { contribution_margin } from '../../src/formulas/generated/contribution_margin.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 27 of 76. */
const WORKED: Env = Object.freeze({
  "price": 125000,
  "variable_cost": 74000
});

describe('Contribution_Margin (contribution_margin)', () => {
  it('computes the worked example', () => {
    const result = compute(contribution_margin, WORKED) as number;
    expectRelative(result, 51000);
  });

  it('states an outcome at the lower edge of the domain for price', () => {
    const env = { ...WORKED, "price": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(contribution_margin, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["price"];
    expectEngineError(() => compute(contribution_margin, env as Env));
  });

  it('recovers price through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "contribution_margin": compute(contribution_margin, WORKED) as number,
    };
    delete env["price"];
    const recovered = computeInverse(contribution_margin, "price", env as Env);
    expectRelative(recovered, 125000, 1e-9);
  });

  it('recovers variable_cost through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "contribution_margin": compute(contribution_margin, WORKED) as number,
    };
    delete env["variable_cost"];
    const recovered = computeInverse(contribution_margin, "variable_cost", env as Env);
    expectRelative(recovered, 74000, 1e-9);
  });
});
