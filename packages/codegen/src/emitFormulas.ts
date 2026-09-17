/**
 * P03: emit one typed Relation module per formula.
 *
 * ADR-003: the expression strings are compiled into function bodies here, at generation time. The
 * emitted modules contain literal TypeScript source. Nothing in the shipped application calls eval
 * or the Function constructor.
 */

import { GENERATED_HEADER, type Spec, type SpecFormula } from './spec.ts';
import { HELPER_NAMES, freeIdentifiers } from './expr.ts';
import { resolveOutputs, type ResolvedOutput } from './outputs.ts';
import type { EmittedFile } from './emitVariables.ts';
import { quote } from './emitVariables.ts';

interface VariableShape {
  readonly valueKind: 'number' | 'integer' | 'array';
  readonly unitClass: string;
}

export function emitFormulas(spec: Spec): EmittedFile[] {
  const outputs = resolveOutputs(spec);
  const variableKind = new Map<string, VariableShape>(
    spec.canonical_variables.map(
      (variable) =>
        [variable.id, { valueKind: variable.value_kind, unitClass: variable.unit_class }] as const,
    ),
  );
  for (const output of outputs.values()) {
    if (output.variableId !== null && !variableKind.has(output.variableId)) {
      variableKind.set(output.variableId, { valueKind: 'number', unitClass: output.unitClass });
    }
  }

  const files: EmittedFile[] = [];
  for (const formula of spec.formula_registry) {
    const output = outputs.get(formula.id);
    if (!output) throw new Error(`No resolved output for ${formula.id}`);
    files.push({
      path: `packages/engine/src/formulas/generated/${formula.id}.ts`,
      contents: renderRelation(formula, output, variableKind),
    });
  }

  files.push({
    path: 'packages/engine/src/formulas/generated/index.ts',
    contents: renderIndex(spec),
  });
  return files;
}

function renderRelation(
  formula: SpecFormula,
  output: ResolvedOutput,
  variableKind: ReadonlyMap<string, VariableShape>,
): string {
  const inputIds = formula.inputs
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((input) => input.variable_id);

  const readers = new Set<string>();
  const bind = (identifier: string): string => {
    const variableId =
      identifier === output.inverseAlias && output.variableId !== null
        ? output.variableId
        : identifier;
    const shape = variableKind.get(variableId);
    if (shape === undefined) {
      throw new Error(
        `Formula ${formula.id} refers to ${identifier}, which is not a variable it can bind.`,
      );
    }
    const reader =
      shape.unitClass === 'matrix' ? 'mat' : shape.valueKind === 'array' ? 'vec' : 'num';
    readers.add(reader);
    return `    const ${identifier} = ${reader}(env, ${quote(variableId)});`;
  };

  const usedHelpers = new Set<string>();
  const collectHelpers = (source: string): void => {
    for (const name of HELPER_NAMES) {
      if (new RegExp(`\\b${name}\\s*\\(`).test(source)) usedHelpers.add(name);
    }
  };
  collectHelpers(formula.expression.javascript);
  for (const inverse of formula.inverse_solutions) collectHelpers(inverse.javascript);

  const forwardBindings = freeIdentifiers(formula.expression.javascript).map(bind);
  const forwardReturnType = output.resultShape === 'composite' ? 'FormulaResult' : 'number';

  const inverseEntries = formula.inverse_solutions.map((inverse) => {
    const bindings = freeIdentifiers(inverse.javascript).map(bind);
    return `    ${quote(inverse.solve_for)}: (env: Env): number => {
${bindings.join('\n')}
      return ${inverse.javascript};
    },`;
  });

  const inverseSourceEntries = formula.inverse_solutions.map(
    (inverse) => `    ${quote(inverse.solve_for)}: ${quote(inverse.javascript)},`,
  );

  const bands = formula.interpretation_bands.map(
    (band) =>
      `    { lower: ${band.lower}, upper: ${band.upper}, label: ${quote(band.label)}, guidance: ${quote(band.guidance_id)} },`,
  );

  const workedExample = Object.entries(formula.worked_example.inputs).map(
    ([variableId, value]) => `    ${quote(variableId)}: ${JSON.stringify(value)},`,
  );

  const helperImport =
    usedHelpers.size > 0
      ? `import { ${[...usedHelpers].sort().join(', ')} } from '../../helpers/index.ts';\n`
      : '';

  const resultTypeImport =
    output.resultShape === 'composite' ? 'import type { FormulaResult } from' : null;

  return `${GENERATED_HEADER}
import type { Env, Relation${resultTypeImport ? ', FormulaResult' : ''} } from '../../types.ts';
import { ${[...readers].sort().join(', ')} } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';
${helperImport}
/**
 * ${formula.symbol}: ${formula.name.en}
 * ${formula.name.id}
 *
 * Stratum ${formula.taxonomy.axis_a.stratum_code}, phase ${formula.taxonomy.axis_b.phase_code}, structural class ${formula.taxonomy.axis_c.class_code}, decision domain ${formula.taxonomy.axis_d.domain_code}.
 * Engine rule: ${formula.validation.engine_rule}
 */
export const ${formula.id}: Relation = Object.freeze({
  formulaId: ${quote(formula.id)},
  symbol: ${quote(formula.symbol)},
  name: { id: ${quote(formula.name.id)}, en: ${quote(formula.name.en)} },
  inputs: Object.freeze([${inputIds.map(quote).join(', ')}]),
  output: ${output.variableId === null ? 'null' : quote(output.variableId)},
  structuralClass: ${quote(formula.validation.structural_class)},
  resultBounds: ${renderBounds(formula, output)},
  expressionSource: ${quote(formula.expression.javascript)},
  latex: ${quote(formula.expression.latex)},
  resultShape: ${quote(output.resultShape)},
  forward: (env: Env): ${forwardReturnType} => {
${forwardBindings.join('\n')}
    return ${formula.expression.javascript};
  },
  inverses: Object.freeze({
${inverseEntries.join('\n')}
  }),
  inverseSources: Object.freeze({
${inverseSourceEntries.join('\n')}
  }),
  guards: buildGuards({
    formulaId: ${quote(formula.id)},
    inputs: [${inputIds.map(quote).join(', ')}],
    denominators: [${denominators(formula, output).map(quote).join(', ')}],
    guardZeroDenominator: ${formula.validation.guard_zero_denominator},
    rejectNegativeCounts: ${formula.validation.reject_negative_counts},
  }),
  interpretationBands: Object.freeze([
${bands.join('\n')}
  ]),
  pitfallCount: ${formula.failure_modes.length},
  taxonomy: Object.freeze({
    stratum: ${quote(formula.taxonomy.axis_a.stratum_code)},
    phase: ${quote(formula.taxonomy.axis_b.phase_code)},
    structuralClass: ${quote(formula.taxonomy.axis_c.class_code)},
    decisionDomain: ${quote(formula.taxonomy.axis_d.domain_code)},
    computeLayer: ${quote(formula.taxonomy.compute_layer)},
    curriculumModule: ${formula.taxonomy.curriculum_module},
    dashboardTier: ${quote(formula.taxonomy.dashboard_tier)},
  }),
  workedExample: Object.freeze({
${workedExample.join('\n')}
  }),
  publishesToGraph: ${formula.output.publishes_to_graph},
});
`;
}

/**
 * The range a result must stay inside.
 *
 * Structural class C1 is a bounded proportion, so its result lies in [0, 1] by its own signature.
 * One relation in the corpus, CSAT, scales the proportion to a percentage inside the expression, so
 * its bound is stated in the unit the expression actually produces. No other class carries a
 * range assertion: an unbounded intensity ratio has no ceiling and a gap index may be negative.
 */
function renderBounds(formula: SpecFormula, output: ResolvedOutput): string {
  if (formula.validation.structural_class !== 'C1') return 'null';
  const upper = output.unitClass === 'percent' ? 100 : 1;
  return `Object.freeze({ lower: 0, upper: ${upper} })`;
}

/**
 * Identifiers that sit directly under a division bar, which are the ones a zero-denominator guard
 * has to watch. A parenthesised denominator is reported through the non-finite result check
 * instead, because its zero point depends on more than one variable.
 */
function denominators(formula: SpecFormula, output: ResolvedOutput): string[] {
  const inputIds = new Set(formula.inputs.map((input) => input.variable_id));
  const found = new Set<string>();
  const pattern = /\/\s*([A-Za-z_][A-Za-z_0-9]*)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(formula.expression.javascript)) !== null) {
    const name = match[1] as string;
    if (inputIds.has(name)) found.add(name);
  }
  // The inverse directions divide by the result and by other inputs, so watch those too.
  for (const inverse of formula.inverse_solutions) {
    const inversePattern = /\/\s*([A-Za-z_][A-Za-z_0-9]*)/g;
    let inverseMatch: RegExpExecArray | null;
    while ((inverseMatch = inversePattern.exec(inverse.javascript)) !== null) {
      const name = inverseMatch[1] as string;
      if (inputIds.has(name)) found.add(name);
      else if (name === output.inverseAlias && output.variableId !== null)
        found.add(output.variableId);
    }
  }
  return [...found].sort();
}

function renderIndex(spec: Spec): string {
  const ids = spec.formula_registry.map((formula) => formula.id);
  const imports = ids.map((id) => `import { ${id} } from './${id}.ts';`).join('\n');
  const entries = ids.map((id) => `  ${id},`).join('\n');

  return `${GENERATED_HEADER}
import type { Relation } from '../../types.ts';
${imports}

/** Every relation in the corpus, in specification order. */
export const RELATION_LIST: readonly Relation[] = Object.freeze([
${entries}
]);

export const RELATIONS: ReadonlyMap<string, Relation> = new Map(
  RELATION_LIST.map((relation) => [relation.formulaId, relation] as const),
);

export const FORMULA_COUNT = ${ids.length};

export {
${ids.map((id) => `  ${id},`).join('\n')}
};
`;
}
