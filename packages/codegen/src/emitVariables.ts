import { GENERATED_HEADER, type Spec, type SpecVariable } from './spec.ts';
import { resolveOutputs, type ResolvedOutput } from './outputs.ts';

export interface EmittedFile {
  readonly path: string;
  readonly contents: string;
}

const RATIO_LIKE = new Set(['ratio', 'percent', 'score', 'period', 'utils']);

export function emitVariables(spec: Spec): EmittedFile[] {
  const outputs = resolveOutputs(spec);
  const entries: string[] = [];

  for (const variable of spec.canonical_variables) {
    entries.push(renderVariable(variable, null));
  }

  const producedBy = new Map<string, ResolvedOutput>();
  for (const output of outputs.values()) {
    if (output.synthesised && output.variableId !== null) producedBy.set(output.variableId, output);
  }

  const synthesised = [...producedBy.values()].sort((a, b) =>
    (a.variableId as string).localeCompare(b.variableId as string),
  );
  for (const output of synthesised) {
    entries.push(renderSynthesised(output, spec));
  }

  const contents = `${GENERATED_HEADER}
import type { VariableDefinition } from '../../types.ts';

/**
 * Every canonical variable from the specification, followed by the result variables codegen
 * synthesises for formulas whose output.canonical_variable_id is null. Synthesised entries carry
 * \`synthesised: true\` and name the formula that produces them.
 */
export const VARIABLE_DEFINITIONS: readonly VariableDefinition[] = Object.freeze([
${entries.join(',\n')},
]);

export const VARIABLES: ReadonlyMap<string, VariableDefinition> = new Map(
  VARIABLE_DEFINITIONS.map((definition) => [definition.id, definition] as const),
);

export const SPEC_VARIABLE_COUNT = ${spec.canonical_variables.length};
export const SYNTHESISED_VARIABLE_COUNT = ${synthesised.length};
`;

  return [{ path: 'packages/engine/src/variables/generated/registry.ts', contents }];
}

function renderVariable(variable: SpecVariable, producedBy: string | null): string {
  return `  {
    id: ${quote(variable.id)},
    label: { id: ${quote(variable.label.id)}, en: ${quote(variable.label.en)} },
    unitClass: ${quote(variable.unit_class)},
    valueKind: ${quote(variable.value_kind)},
    constraints: {
      min: ${variable.constraints.min === null ? 'null' : variable.constraints.min},
      max: ${variable.constraints.max === null ? 'null' : variable.constraints.max},
      decimals: ${variable.constraints.decimals},
      allowZero: ${variable.constraints.allow_zero},
      nullable: ${variable.constraints.nullable},
    },
    definition: ${quote(variable.definition_id)},
    ui: {
      widget: ${quote(variable.ui.widget)},
      stepHint: ${quote(variable.ui.step_hint)},
      thousandSeparator: ${variable.ui.thousand_separator},
      suffix: ${quote(variable.ui.suffix)},
    },
    synthesised: false,
    producedBy: ${producedBy === null ? 'null' : quote(producedBy)},
  }`;
}

function renderSynthesised(output: ResolvedOutput, spec: Spec): string {
  const formula = spec.formula_registry.find((entry) => entry.id === output.formulaId);
  if (!formula)
    throw new Error(`No formula ${output.formulaId} while emitting its result variable`);

  const decimals = decimalsFor(output.unitClass);
  const bounded = formula.validation.structural_class === 'C1';

  return `  {
    id: ${quote(output.variableId as string)},
    label: { id: ${quote(formula.name.id)}, en: ${quote(formula.name.en)} },
    unitClass: ${quote(output.unitClass)},
    valueKind: 'number',
    constraints: {
      min: ${bounded ? '0' : 'null'},
      max: ${bounded ? '1' : 'null'},
      decimals: ${decimals},
      allowZero: true,
      nullable: true,
    },
    definition: ${quote(formula.definition.id)},
    ui: {
      widget: 'numeric_spinner',
      stepHint: 'auto',
      thousandSeparator: ${output.unitClass === 'currency' || output.unitClass === 'count'},
      suffix: '',
    },
    synthesised: true,
    producedBy: ${quote(output.formulaId)},
  }`;
}

function decimalsFor(unitClass: string): number {
  if (unitClass === 'currency' || unitClass === 'count') return 0;
  if (RATIO_LIKE.has(unitClass)) return 4;
  return 2;
}

export function quote(value: string): string {
  return JSON.stringify(value);
}
