// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { qfd_technical_importance } from '../../src/formulas/generated/qfd_technical_importance.ts';
import { compute } from '../../src/compute.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 64 of 76. */
const WORKED: Env = Object.freeze({
  "customer_importance": [
    9,
    7,
    5,
    8
  ],
  "relationship_matrix": [
    [
      9,
      3,
      0
    ],
    [
      3,
      9,
      1
    ],
    [
      0,
      3,
      9
    ],
    [
      9,
      0,
      3
    ]
  ]
});

describe('QFD_Technical_Importance (qfd_technical_importance)', () => {
  it('computes the worked example and returns its full structure', () => {
    const result = compute(qfd_technical_importance, WORKED);
    const scores = result as number[];
    expect(scores).toHaveLength(3);
    expectRelative(scores[0]!, 174);
    expectRelative(scores[1]!, 105);
    expectRelative(scores[2]!, 76);
  });

  it('refuses an empty series for customer_importance', () => {
    const env = { ...WORKED, "customer_importance": [] };
    expectEngineError(() => compute(qfd_technical_importance, env as Env));
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["customer_importance"];
    expectEngineError(() => compute(qfd_technical_importance, env as Env));
  });

  it('declares no inverse direction, so it can only be solved forwards', () => {
    expect(Object.keys(qfd_technical_importance.inverses)).toHaveLength(0);
    expect(qfd_technical_importance.publishesToGraph).toBe(false);
    expect(qfd_technical_importance.resultShape).toBe("composite");
  });
});
