// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { ev } from '../../src/formulas/generated/ev.ts';
import { compute } from '../../src/compute.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 74 of 76. */
const WORKED: Env = Object.freeze({
  "prob_vector": [
    0.25,
    0.45,
    0.3
  ],
  "payoff_vector": [
    820000000,
    240000000,
    -180000000
  ]
});

describe('EV (ev)', () => {
  it('computes the worked example', () => {
    const result = compute(ev, WORKED) as number;
    expectRelative(result, 259000000);
  });

  it('refuses an empty series for prob_vector', () => {
    const env = { ...WORKED, "prob_vector": [] };
    expectEngineError(() => compute(ev, env as Env));
  });

  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env["prob_vector"];
    expectEngineError(() => compute(ev, env as Env));
  });

  it('declares no inverse direction, so it can only be solved forwards', () => {
    expect(Object.keys(ev.inverses)).toHaveLength(0);
    expect(ev.publishesToGraph).toBe(true);
    expect(ev.resultShape).toBe("scalar");
  });
});
