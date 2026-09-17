// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { net_reach } from '../../src/formulas/generated/net_reach.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 49 of 76. */
const WORKED: Env = Object.freeze({
  "gross_reach": 1840000,
  "duplication": 520000
});

describe('Net_Reach (net_reach)', () => {
  it('computes the worked example', () => {
    const result = compute(net_reach, WORKED) as number;
    expectRelative(result, 1320000);
  });

  it('states an outcome at the lower edge of the domain for gross_reach', () => {
    const env = { ...WORKED, "gross_reach": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(net_reach, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["gross_reach"];
    expectEngineError(() => compute(net_reach, env as Env));
  });

  it('recovers gross_reach through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "net_reach": compute(net_reach, WORKED) as number,
    };
    delete env["gross_reach"];
    const recovered = computeInverse(net_reach, "gross_reach", env as Env);
    expectRelative(recovered, 1840000, 1e-9);
  });

  it('recovers duplication through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "net_reach": compute(net_reach, WORKED) as number,
    };
    delete env["duplication"];
    const recovered = computeInverse(net_reach, "duplication", env as Env);
    expectRelative(recovered, 520000, 1e-9);
  });
});
