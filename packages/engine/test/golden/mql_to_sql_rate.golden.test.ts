// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import { describe, expect, it } from 'vitest';
import { mql_to_sql_rate } from '../../src/formulas/generated/mql_to_sql_rate.ts';
import { compute, computeInverse } from '../../src/compute.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative, expectEngineError } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula 16 of 76. */
const WORKED: Env = Object.freeze({
  "sql": 168,
  "mql": 840
});

describe('MQL_to_SQL_Rate (mql_to_sql_rate)', () => {
  it('computes the worked example', () => {
    const result = compute(mql_to_sql_rate, WORKED) as number;
    expectRelative(result, 0.2);
  });

  it('states an outcome at the lower edge of the domain for sql', () => {
    const env = { ...WORKED, "sql": 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(mql_to_sql_rate, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });

  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, "mql": 0 };
    const guard = mql_to_sql_rate.guards.find((entry) => entry.id === "zero_denominator:mql")!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(mql_to_sql_rate, env));
  });

  it('recovers sql through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "mql_to_sql_rate": compute(mql_to_sql_rate, WORKED) as number,
    };
    delete env["sql"];
    const recovered = computeInverse(mql_to_sql_rate, "sql", env as Env);
    expectRelative(recovered, 168, 1e-9);
  });

  it('recovers mql through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      "mql_to_sql_rate": compute(mql_to_sql_rate, WORKED) as number,
    };
    delete env["mql"];
    const recovered = computeInverse(mql_to_sql_rate, "mql", env as Env);
    expectRelative(recovered, 840, 1e-9);
  });
});
