// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { weighted_screening } from '../../src/formulas/generated/weighted_screening.ts';
import { compute } from '../../src/compute.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 67 of 76. */
const WORKED: Env = Object.freeze({
  "w_vector": [
    0.35,
    0.25,
    0.25,
    0.15
  ],
  "r_vector": [
    8,
    6,
    9,
    4
  ]
});

describe('Weighted_Screening_Score (weighted_screening)', () => {
  it('computes the worked example', () => {
    const result = compute(weighted_screening, WORKED) as number;
    expectRelative(result, 7.1499999999999995);
  });

  it('refuses an empty series for w_vector', () => {
    const env = { ...WORKED, "w_vector": [] };
    expectEngineError(() => compute(weighted_screening, env as Env));
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["w_vector"];
    expectEngineError(() => compute(weighted_screening, env as Env));
  });

  it('declares no inverse direction, so it can only be solved forwards', () => {
    expect(Object.keys(weighted_screening.inverses)).toHaveLength(0);
    expect(weighted_screening.publishesToGraph).toBe(false);
    expect(weighted_screening.resultShape).toBe("scalar");
  });
});
