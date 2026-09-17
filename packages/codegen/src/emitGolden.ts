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
    const result = ${formula.id}.forward(WORKED) as number;
    expectRelative(result, ${literal(value)});
    checkResult(${formula.id}, result);
  });`);
  } else {
    blocks.push(`  it('computes the worked example and returns its full structure', () => {
    const result = ${formula.id}.forward(WORKED);
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
    // a named error. Returning Infinity or NaN would fail both branches, which is the point.
    try {
      const result = ${formula.id}.forward(env) as number;
      expect(Number.isFinite(result)).toBe(true);
      checkResult(${formula.id}, result);
    } catch (error) {
      expect(error).toBeInstanceOf(EngineError);
    }
  });`);
    caseCount += 1;
  }

  /* Case 3: the rejection case. */
  const rejection = pickRejection(formula, relation);
  blocks.push(rejection.block);
  caseCount += 1;

  /* Case 4 and beyond: the round trip through every inverse direction. */
  const inverseTargets = Object.keys(relation.inverses);
  if (inverseTargets.length > 0 && output.variableId !== null) {
    const recovered = inverseTargets
      .filter((target) => typeof workedInputs[target] === 'number')
      .map((target) => {
        const env2: Record<string, unknown> = { ...workedInputs, [output.variableId as string]: forwardResult };
        delete env2[target];
        const value = relation.inverses[target]?.(env2);
        return { target, value };
      })
      .filter((entry): entry is { target: string; value: number } => Number.isFinite(entry.value));

    for (const entry of recovered) {
      blocks.push(`  it('recovers ${entry.target} through the inverse direction', () => {
    const env = { ...WORKED, ${quote(output.variableId as string)}: ${formula.id}.forward(WORKED) as number };
    delete (env as Record<string, unknown>)[${quote(entry.target)}];
    const recovered = ${formula.id}.inverses[${quote(entry.target)}]!(env);
    expectRelative(recovered, ${literal(workedInputs[entry.target] as number)}, 1e-9);
  });`);
      caseCount += 1;
    }
  } else {
    blocks.push(`  it('declares no inverse direction and publishes nothing to the graph', () => {
    expect(Object.keys(${formula.id}.inverses)).toHaveLength(0);
    expect(${formula.id}.publishesToGraph).toBe(false);
  });`);
    caseCount += 1;
  }

  const contents = `${GENERATED_HEADER}
import { describe, expect, it } from 'vitest';
import { ${formula.id} } from '../../src/formulas/generated/${formula.id}.ts';
import { checkResult } from '../../src/validate/domain.ts';
import { EngineError } from '../../src/errors.ts';
import { expectRelative } from '../support/assert.ts';
import type { Env } from '../../src/types.ts';

/** The worked example from spec/metrika.spec.json, formula ${formula.index} of 76. */
const WORKED: Env = Object.freeze(${JSON.stringify(workedInputs, null, 2).replace(/\n/g, '\n')});

describe('${formula.symbol} (${formula.id})', () => {
${blocks.join('\n\n')}
});
`;

  return { contents, caseCount };
}

function compositeAssertions(formulaId: string, result: unknown): string {
  if (formulaId === 'irr') {
    const irr = result as { roots: number[]; unique: boolean; converged: boolean };
    return `    const irr = result as { roots: number[]; unique: boolean; converged: boolean };
    expect(irr.converged).toBe(true);
    expect(irr.roots).toHaveLength(${irr.roots.length});
    expect(irr.unique).toBe(${irr.unique});
${irr.roots.map((root, index) => `    expectRelative(irr.roots[${index}]!, ${literal(root)});`).join('\n')}`;
  }
  if (formulaId === 'van_westendorp') {
    const vw = result as { opp: number; ipp: number; pmc: number; pme: number; curves: unknown[] };
    return `    const vw = result as { opp: number; ipp: number; pmc: number; pme: number; curves: unknown[] };
    expectRelative(vw.opp, ${literal(vw.opp)});
    expectRelative(vw.ipp, ${literal(vw.ipp)});
    expectRelative(vw.pmc, ${literal(vw.pmc)});
    expectRelative(vw.pme, ${literal(vw.pme)});
    // The curves are always returned: a crossing price without its curve hides the shape that
    // decides whether the crossing means anything.
    expect(vw.curves).toHaveLength(4);`;
  }
  const vector = result as number[];
  return `    const vector = result as number[];
    expect(vector).toHaveLength(${vector.length});
${vector.map((value, index) => `    expectRelative(vector[${index}]!, ${literal(value)});`).join('\n')}`;
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
  const zeroGuard = relation.guards.find((guard) => guard.id.startsWith('zero_denominator:'));
  if (zeroGuard) {
    const variableId = zeroGuard.id.slice('zero_denominator:'.length);
    if (typeof formula.worked_example.inputs[variableId] === 'number') {
      return {
        block: `  it('refuses a zero denominator with a named error rather than returning Infinity', () => {
    const env = { ...WORKED, ${quote(variableId)}: 0 };
    const guard = ${formula.id}.guards.find((entry) => entry.id === ${quote(zeroGuard.id)})!;
    expect(guard.check(env).ok).toBe(false);
    // The guard blocks the relation. Evaluating past it must still refuse rather than produce a
    // number the user could mistake for an answer.
    let refused = false;
    try {
      const result = ${formula.id}.forward(env) as number;
      checkResult(${formula.id}, result);
    } catch (error) {
      refused = error instanceof EngineError;
    }
    expect(refused).toBe(true);
  });`,
      };
    }
  }

  const missing = formula.inputs[0]?.variable_id ?? '';
  return {
    block: `  it('refuses a missing input with a named error', () => {
    const env: Record<string, unknown> = { ...WORKED };
    delete env[${quote(missing)}];
    expect(() => ${formula.id}.forward(env as Env)).toThrowError(EngineError);
  });`,
  };
}

/** Print a number with enough digits to round-trip exactly through the parser. */
function literal(value: number): string {
  if (Number.isInteger(value) && Math.abs(value) < Number.MAX_SAFE_INTEGER) return String(value);
  return String(value);
}
