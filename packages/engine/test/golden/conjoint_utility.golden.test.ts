// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { conjoint_utility } from '../../src/formulas/generated/conjoint_utility.ts';
import { compute } from '../../src/compute.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 59 of 76. */
const WORKED: Env = Object.freeze({
  "beta_vector": [
    0.42,
    -0.31,
    0.18,
    0.55
  ],
  "x_vector": [
    1,
    1,
    0,
    1
  ]
});

describe('Conjoint_Utility (conjoint_utility)', () => {
  it('computes the worked example', () => {
    const result = compute(conjoint_utility, WORKED) as number;
    expectRelative(result, 0.66);
  });

  it('refuses an empty series for beta_vector', () => {
    const env = { ...WORKED, "beta_vector": [] };
    expectEngineError(() => compute(conjoint_utility, env as Env));
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["beta_vector"];
    expectEngineError(() => compute(conjoint_utility, env as Env));
  });

  it('declares no inverse direction, so it can only be solved forwards', () => {
    expect(Object.keys(conjoint_utility.inverses)).toHaveLength(0);
    expect(conjoint_utility.publishesToGraph).toBe(false);
    expect(conjoint_utility.resultShape).toBe("scalar");
  });
});
