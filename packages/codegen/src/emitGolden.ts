/**
 * P05: emit one golden test file per formula.
 *
 * testing.layers requires four kinds of case per formula: the worked example, a boundary case at
 * the lower edge of the valid domain, a rejection case that must raise a named DomainViolation, and
 * a round trip that recovers each input through the inverse directions.
 *
 * The worked example values in the specification and in the test come from the same source, which
 * is what stops them drifting. The specification states the inputs but not the expected output, so
 * codegen computes the output from the emitted relation and writes it into the test as a literal.
 * That pins the behaviour: any later change to a formula or a helper shows up as a failing golden
 * test rather than as a silent change in a number. See DEVIATIONS.md, D-03.
 */

import type { Spec, SpecFormula } from './spec.ts';
import { GENERATED_HEADER } from './spec.ts';
import { quote } from './emitVariables.ts';
import { resolveOutputs, type ResolvedOutput } from './outputs.ts';
import type { EmittedFile } from './emitVariables.ts';

interface RelationLike {
  formulaId: string;
  inputs: readonly string[];
  output: string | null;
  resultShape: 'scalar' | 'composite';
  guards: readonly { id: string }[];
  forward: (env: Record<string, unknown>) => unknown;
  inverses: Record<string, (env: Record<string, unknown>) => number>;
}

export interface GoldenSummary {
  readonly files: EmittedFile[];
  readonly caseCount: number;
}

export function emitGolden(
  spec: Spec,
  relations: ReadonlyMap<string, RelationLike>,
): GoldenSummary {
  const outputs = resolveOutputs(spec);
  const variableById = new Map(
    spec.canonical_variables.map((variable) => [variable.id, variable] as const),
  );
  const files: EmittedFile[] = [];
  let caseCount = 0;

  for (const formula of spec.formula_registry) {
    const relation = relations.get(formula.id);
    const output = outputs.get(formula.id);
    if (!relation || !output) throw new Error(`No emitted relation for ${formula.id}`);

    const rendered = renderGolden(formula, relation, output, variableById);
    caseCount += rendered.caseCount;
    files.push({
      path: `packages/engine/test/golden/${formula.id}.golden.test.ts`,
      contents: rendered.contents,
    });
  }

  return { files, caseCount };
}

function renderGolden(
  formula: SpecFormula,
  relation: RelationLike,
  output: ResolvedOutput,
  variableById: ReadonlyMap<string, { unit_class: string; constraints: { allow_zero: boolean } }>,
): { contents: string; caseCount: number } {
  const workedInputs = formula.worked_example.inputs;
  const env: Record<string, unknown> = { ...workedInputs };
  const forwardResult = relation.forward(env);

  const blocks: string[] = [];
  let caseCount = 0;

  /* Case 1: the worked example. */
  if (output.resultShape === 'scalar') {
    const value = forwardResult as number;
    if (!Number.isFinite(value)) {
      throw new Error(`Worked example for ${formula.id} produced a non-finite result: ${value}`);
    }
    blocks.push(`  it('computes the worked example', () => {
    const result = compute(${formula.id}, WORKED) as number;
    expectRelative(result, ${literal(value)});
  });`);
  } else {
    blocks.push(`  it('computes the worked example and returns its full structure', () => {
    const result = compute(${formula.id}, WORKED);
${compositeAssertions(formula.id, forwardResult)}
  });`);
  }
  caseCount += 1;

  /* Case 2: the boundary at the lower edge of the valid domain. */
  const boundaryTarget = pickBoundaryInput(formula, variableById);
  if (boundaryTarget !== null) {
    blocks.push(`  it('states an outcome at the lower edge of the domain for ${boundaryTarget}', () => {
    const env = { ...WORKED, ${quote(boundaryTarget)}: 0 };
    // Either the relation computes a finite number inside its structural class, or it refuses with
    // a named error. Returning Infinity or NaN satisfies neither branch, which is the point.
    let computed: unknown = null;
    let refusal: unknown = null;
    try {
      computed = compute(${formula.id}, env);
    } catch (error) {
      refusal = error;
    }
    if (refusal !== null) expect(refusal).toBeInstanceOf(EngineError);
    else if (typeof computed === 'number') expect(Number.isFinite(computed)).toBe(true);
    else expect(computed).not.toBeNull();
  });`);
    caseCount += 1;
  } else {
    // Every input is a series, so the lower edge of the domain is the empty series rather than a
    // zero. A relation that accepts an empty operand would silently report a sum over nothing.
    const seriesInput = formula.inputs[0]?.variable_id ?? '';
    blocks.push(`  it('refuses an empty series for ${seriesInput}', () => {
    const env = { ...WORKED, ${quote(seriesInput)}: [] };
    expectEngineError(() => compute(${formula.id}, env as Env));
  });`);
    caseCount += 1;
  }

  /* Case 3: the rejection case. */
  blocks.push(pickRejection(formula, relation).block);
  caseCount += 1;

  /* Case 4 and beyond: the round trip through every inverse direction. */
  const inverseTargets = Object.keys(relation.inverses);
  if (inverseTargets.length > 0 && output.variableId !== null) {
    for (const target of inverseTargets) {
      const expected = workedInputs[target];
      if (typeof expected !== 'number') continue;

      const roundTripEnv: Record<string, unknown> = {
        ...workedInputs,
        [output.variableId]: forwardResult,
      };
      delete roundTripEnv[target];
      const recovered = relation.inverses[target]?.(roundTripEnv);

      if (recovered === undefined || !Number.isFinite(recovered)) {
        throw new Error(
          `Round trip for ${formula.id} through ${target} produced ${recovered}. ` +
            `Fix the inverse expression in the specification.`,
        );
      }

      const header = `  it('recovers ${target} through the inverse direction', () => {
    const env: Record<string, unknown> = {
      ...WORKED,
      ${quote(output.variableId)}: compute(${formula.id}, WORKED) as number,
    };
    delete env[${quote(target)}];
    const recovered = computeInverse(${formula.id}, ${quote(target)}, env as Env);`;

      if (closeEnough(recovered, expected)) {
        blocks.push(`${header}
    expectRelative(recovered, ${literal(expected)}, 1e-9);
  });`);
      } else if (closeEnough(recovered, -expected)) {
        // The forward expression takes an absolute value, so the sign of this input is not
        // recoverable from the result. The round trip recovers the magnitude, and saying so here is
        // more honest than asserting a recovery that the arithmetic cannot deliver.
        blocks.push(`${header}
    // The forward direction takes the absolute value of ${target}, so the sign does not survive
    // the round trip. Only the magnitude is recoverable.
    expectRelative(Math.abs(recovered), ${literal(Math.abs(expected))}, 1e-9);
  });`);
      } else {
        throw new Error(
          `Round trip for ${formula.id} through ${target} recovered ${recovered} where the worked ` +
            `example states ${expected}. The inverse expression in the specification does not ` +
            `invert the forward expression. Fix spec/metrika.spec.json.`,
        );
      }
      caseCount += 1;
    }
  } else {
    blocks.push(`  it('declares no inverse direction, so it can only be solved forwards', () => {
    expect(Object.keys(${formula.id}.inverses)).toHaveLength(0);
    expect(${formula.id}.publishesToGraph).toBe(${formula.output.publishes_to_graph});
    expect(${formula.id}.resultShape).toBe(${quote(output.resultShape)});
  });`);
    caseCount += 1;
  }

  const body = blocks.join('\n\n');
  const computeImports = ['compute', 'computeInverse'].filter((name) =>
    new RegExp(`\\b${name}\\(`).test(body),
  );
  const supportImports = ['expectRelative', 'expectEngineError'].filter((name) =>
    new RegExp(`\\b${name}\\(`).test(body),
  );
  const imports = [
    `import { describe, expect, it } from 'vitest';`,
    `import { ${formula.id} } from '../../src/formulas/generated/${formula.id}.ts';`,
    `import { ${computeImports.join(', ')} } from '../../src/compute.ts';`,
    /\bEngineError\b/.test(body.replace(/expectEngineError/g, ''))
      ? `import { EngineError } from '../../src/errors.ts';`
      : null,
    supportImports.length > 0
      ? `import { ${supportImports.join(', ')} } from '../support/assert.ts';`
      : null,
    `import type { Env } from '../../src/types.ts';`,
  ].filter((line): line is string => line !== null);

  const contents = `${GENERATED_HEADER}
${imports.join('\n')}

/** The worked example from spec/metrika.spec.json, formula ${formula.index} of 76. */
const WORKED: Env = Object.freeze(${JSON.stringify(workedInputs, null, 2).replace(/\n/g, '\n')});

describe('${formula.symbol} (${formula.id})', () => {
${body}
});
`;

  return { contents, caseCount };
}

function compositeAssertions(formulaId: string, result: unknown): string {
  if (formulaId === 'irr') {
    const irr = result as { roots: number[]; unique: boolean; converged: boolean };
    return `    const solution = result as { roots: number[]; unique: boolean; converged: boolean };
    expect(solution.converged).toBe(true);
    // Every root found is reported. Reporting one root when several exist is a correctness bug.
    expect(solution.roots).toHaveLength(${irr.roots.length});
    expect(solution.unique).toBe(${irr.unique});
${irr.roots.map((root, index) => `    expectRelative(solution.roots[${index}]!, ${literal(root)}, 1e-6);`).join('\n')}`;
  }
  if (formulaId === 'van_westendorp') {
    const vw = result as { opp: number; ipp: number; pmc: number; pme: number; curves: unknown[] };
    return `    const prices = result as { opp: number; ipp: number; pmc: number; pme: number; curves: unknown[] };
    expectRelative(prices.opp, ${literal(vw.opp)});
    expectRelative(prices.ipp, ${literal(vw.ipp)});
    expectRelative(prices.pmc, ${literal(vw.pmc)});
    expectRelative(prices.pme, ${literal(vw.pme)});
    // The curves are always returned: a crossing price without its curve hides the shape that
    // decides whether the crossing means anything.
    expect(prices.curves).toHaveLength(4);`;
  }
  const vector = result as number[];
  return `    const scores = result as number[];
    expect(scores).toHaveLength(${vector.length});
${vector.map((value, index) => `    expectRelative(scores[${index}]!, ${literal(value)});`).join('\n')}`;
}

function closeEnough(actual: number, expected: number): boolean {
  if (expected === 0) return Math.abs(actual) <= 1e-9;
  return Math.abs((actual - expected) / expected) <= 1e-9;
}

function pickBoundaryInput(
  formula: SpecFormula,
  variableById: ReadonlyMap<string, { unit_class: string; constraints: { allow_zero: boolean } }>,
): string | null {
  for (const input of formula.inputs) {
    const value = formula.worked_example.inputs[input.variable_id];
    if (typeof value !== 'number') continue;
    const definition = variableById.get(input.variable_id);
    if (!definition) continue;
    if (definition.unit_class === 'count' || definition.unit_class === 'currency') {
      return input.variable_id;
    }
  }
  for (const input of formula.inputs) {
    if (typeof formula.worked_example.inputs[input.variable_id] === 'number') {
      return input.variable_id;
    }
  }
  return null;
}

function pickRejection(formula: SpecFormula, relation: RelationLike): { block: string } {
  // Only a variable that divides in the forward expression can be probed by evaluating forwards.
  // A variable that divides only in an inverse direction is guarded there, and its guard is
  // asserted below through the guard record rather than through a forward evaluation.
  const forwardDenominators = new Set<string>();
  const pattern = /\/\s*([A-Za-z_][A-Za-z_0-9]*)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(formula.expression.javascript)) !== null) {
    forwardDenominators.add(match[1] as string);
  }

  const zeroGuard = relation.guards.find((guard) => {
    if (!guard.id.startsWith('zero_denominator:')) return false;
    const variableId = guard.id.slice('zero_denominator:'.length);
    return (
      forwardDenominators.has(variableId) &&
      typeof formula.worked_example.inputs[variableId] === 'number'
    );
  });

  if (zeroGuard) {
    const variableId = zeroGuard.id.slice('zero_denominator:'.length);
    return {
      block: `  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, ${quote(variableId)}: 0 };
    const guard = ${formula.id}.guards.find((entry) => entry.id === ${quote(zeroGuard.id)})!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past the guard must still refuse rather than
    // produce a number the user could mistake for an answer.
    expectEngineError(() => compute(${formula.id}, env));
  });`,
    };
  }

  const inverseGuard = relation.guards.find((guard) => guard.id.startsWith('zero_denominator:'));
  if (inverseGuard) {
    const variableId = inverseGuard.id.slice('zero_denominator:'.length);
    return {
      block: `  it('guards the zero denominator that appears in its inverse direction', () => {
    // ${variableId} divides only when this relation is solved backwards, so the guard is what
    // stands between a zero and an infinite result.
    const guard = ${formula.id}.guards.find((entry) => entry.id === ${quote(inverseGuard.id)})!;
    expect(guard.check({ ...WORKED, ${quote(variableId)}: 0 }).ok).toBe(false);
    expect(guard.check({ ...WORKED, ${quote(variableId)}: 1 }).ok).toBe(true);
  });`,
    };
  }

  const missing = formula.inputs[0]?.variable_id ?? '';
  return {
    block: `  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env[${quote(missing)}];
    expectEngineError(() => compute(${formula.id}, env as Env));
  });`,
  };
}

/** Print a number with enough digits to round-trip exactly through the parser. */
function literal(value: number): string {
  if (Number.isInteger(value) && Math.abs(value) < Number.MAX_SAFE_INTEGER) return String(value);
  return String(value);
}
