// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { van_westendorp } from '../../src/formulas/generated/van_westendorp.ts';
import { compute } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 57 of 76. */
const WORKED: Env = Object.freeze({
  "too_cheap": 45000,
  "cheap": 78000,
  "expensive": 135000,
  "too_expensive": 195000
});

describe('Van_Westendorp_Optimal (van_westendorp)', () => {
  it('computes the worked example and returns its full structure', () => {
    const result = compute(van_westendorp, WORKED);
    const prices = result as { opp: number; ipp: number; pmc: number; pme: number; curves: unknown[] };
    expectRelative(prices.opp, 78000);
    expectRelative(prices.ipp, 106500);
    expectRelative(prices.pmc, 78000);
    expectRelative(prices.pme, 135000);
    // The curves are always returned: a crossing price without its curve hides the shape that
    // decides whether the crossing means anything.
    expect(prices.curves).toHaveLength(4);
  });

  it('states an outcome at the lower edge of the domain for too_cheap', () => {
    const env = { ...WORKED, "too_cheap": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(van_westendorp, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["too_cheap"];
    expectEngineError(() => compute(van_westendorp, env as Env));
  });

  it('declares no inverse direction, so it can only be solved forwards', () => {
    expect(Object.keys(van_westendorp.inverses)).toHaveLength(0);
    expect(van_westendorp.publishesToGraph).toBe(false);
    expect(van_westendorp.resultShape).toBe("composite");
  });
});
