/**
 * P07: the explain module.
 *
 * engine.explain_module asks for three outputs: a line per step with variable names replaced by
 * their values, a dependency tree drawn with box-drawing characters for the print view, and a plain
 * sentence naming every assumption that was applied.
 *
 * This is where principle P07 pays out. The sophistication lives in the engine and in this text,
 * never in the chrome. A user who never opens the pane still gets correct answers; a user who opens
 * it finds the full derivation, the provenance of every number, and the assumptions that were made
 * on their behalf.
 */

import { RELATIONS } from '../formulas/generated/index.ts';
import { VARIABLES } from '../variables/generated/registry.ts';
import { defaultDecimals, formatByUnitClass } from '../variables/format.ts';
import type { Locale } from '../errors.ts';
import type { DerivationStep, Magnitude, Relation, Value, VariableId } from '../types.ts';

export interface ExplainOptions {
  readonly locale: Locale;
  readonly currency?: 'IDR' | 'USD' | 'EUR';
}

/**
 * The three lines of one derivation step: the expression in names, the expression with each name
 * replaced by its value, and the result.
 */
export function explainStep(
  step: DerivationStep,
  options: ExplainOptions,
): { readonly lines: readonly string[]; readonly relation: Relation } {
  const relation = RELATIONS.get(step.formulaId);
  if (relation === undefined) {
    throw new Error(`explainStep received an unknown formula id: ${step.formulaId}`);
  }

  const source =
    step.direction === 'forward'
      ? relation.expressionSource
      : (relation.inverseSources[step.target] ?? relation.expressionSource);

  const named = readable(source);
  const substituted = substitute(source, step.env, relation, options);
  const width = step.target.length;
  const pad = ' '.repeat(width);

  return {
    relation,
    lines: [
      `${step.target} = ${named}`,
      `${pad} = ${substituted}`,
      `${pad} = ${renderMagnitude(step.target, step.magnitude, options)}`,
    ],
  };
}

/**
 * One provenance line per variable the step drew on: where it came from, how it was computed, and
 * which generation it appeared in.
 */
export function explainProvenance(
  variableId: VariableId,
  values: ReadonlyMap<VariableId, Value>,
  trail: readonly DerivationStep[],
  options: ExplainOptions,
): string {
  const value = values.get(variableId);
  if (value === undefined) {
    return `  ${variableId}  <- ${options.locale === 'id' ? 'belum tersedia' : 'not available'}`;
  }

  const rendered = renderMagnitude(variableId, value.magnitude, options);

  if (value.origin === 'user') {
    const source = options.locale === 'id' ? 'masukan pengguna' : 'user input';
    return `  ${variableId}  <- ${source} ${rendered}   [${originTag(value, options.locale)}]`;
  }

  if (value.origin === 'assumed' || value.origin === 'scenario') {
    const source =
      value.origin === 'assumed'
        ? options.locale === 'id'
          ? 'asumsi ruang kerja'
          : 'workspace assumption'
        : options.locale === 'id'
          ? 'skenario'
          : 'scenario';
    return `  ${variableId}  <- ${source} ${rendered}   [${originTag(value, options.locale)}]`;
  }

  const step = trail.find((entry) => entry.target === variableId);
  if (step === undefined) {
    return `  ${variableId}  <- ${rendered}   [${originTag(value, options.locale)}]`;
  }

  const relation = RELATIONS.get(step.formulaId);
  const source =
    relation === undefined
      ? step.formulaId
      : step.direction === 'forward'
        ? relation.expressionSource
        : (relation.inverseSources[step.target] ?? relation.expressionSource);

  const substituted = relation === undefined ? '' : substitute(source, step.env, relation, options);

  return (
    `  ${variableId}  <- ${readable(source)} = ${substituted} = ${rendered}` +
    `   [${originTag(value, options.locale)}]`
  );
}

/** The full render of one derived value: the step, then a provenance line per input it drew on. */
export function explainValue(
  variableId: VariableId,
  values: ReadonlyMap<VariableId, Value>,
  trail: readonly DerivationStep[],
  options: ExplainOptions,
): string[] {
  const step = trail.find((entry) => entry.target === variableId);
  if (step === undefined) {
    return [explainProvenance(variableId, values, trail, options)];
  }
  const lines = [...explainStep(step, options).lines];
  for (const input of step.inputs) {
    lines.push(explainProvenance(input, values, trail, options));
  }
  return lines;
}

/**
 * The dependency tree, drawn with box-drawing characters for the print view.
 *
 * A variable that appears twice in the tree is drawn once with its derivation and afterwards as a
 * back reference, so a diamond in the graph does not become an exponential listing on paper.
 */
export function explainTree(
  variableId: VariableId,
  values: ReadonlyMap<VariableId, Value>,
  trail: readonly DerivationStep[],
  options: ExplainOptions,
): string[] {
  const lines: string[] = [];
  const seen = new Set<VariableId>();

  const walk = (current: VariableId, prefix: string, isLast: boolean, isRoot: boolean): void => {
    const value = values.get(current);
    const rendered =
      value === undefined
        ? options.locale === 'id'
          ? 'belum tersedia'
          : 'not available'
        : renderMagnitude(current, value.magnitude, options);

    const connector = isRoot ? '' : isLast ? '└─ ' : '├─ ';
    const tag = value === undefined ? '' : `   [${originTag(value, options.locale)}]`;
    lines.push(`${prefix}${connector}${current} = ${rendered}${tag}`);

    if (seen.has(current)) return;
    seen.add(current);

    const step = trail.find((entry) => entry.target === current);
    if (step === undefined) return;

    const childPrefix = isRoot ? '' : prefix + (isLast ? '   ' : '│  ');
    step.inputs.forEach((input, index) => {
      walk(input, childPrefix, index === step.inputs.length - 1, false);
    });
  };

  walk(variableId, '', true, true);
  return lines;
}

/**
 * Every assumption applied on the user's behalf, as plain sentences. An empty list is stated rather
 * than left blank, because a reader has to be able to tell "no assumptions" from "not shown".
 */
export function explainAssumptions(
  values: ReadonlyMap<VariableId, Value>,
  options: ExplainOptions,
): string[] {
  const sentences: string[] = [];

  for (const value of values.values()) {
    if (value.origin !== 'assumed' && value.confidence !== 'assumed') continue;
    const label = VARIABLES.get(value.variableId)?.label ?? {
      id: value.variableId,
      en: value.variableId,
    };
    const rendered = renderMagnitude(value.variableId, value.magnitude, options);
    sentences.push(
      options.locale === 'id'
        ? `${label.id} ditetapkan sebesar ${rendered} sebagai asumsi ruang kerja, bukan sebagai angka yang diukur.`
        : `${label.en} was set to ${rendered} as a workspace assumption, not as a measured number.`,
    );
  }

  if (sentences.length === 0) {
    sentences.push(
      options.locale === 'id'
        ? 'Tidak ada asumsi yang diterapkan. Seluruh angka berasal dari masukan atau dari turunannya.'
        : 'No assumption was applied. Every number comes from an input or from a derivation of one.',
    );
  }
  return sentences;
}

/** Replace the multiplication star with a cross, which reads better in a printed derivation. */
function readable(source: string): string {
  return source.replace(/\s\*\s/g, ' x ');
}

function substitute(
  source: string,
  env: Readonly<Record<VariableId, Magnitude>>,
  relation: Relation,
  options: ExplainOptions,
): string {
  const replaced = source.replace(/\b[A-Za-z_][A-Za-z_0-9]*\b/g, (identifier) => {
    const magnitude = env[identifier];
    if (magnitude === undefined) return identifier;
    return renderMagnitude(identifier, magnitude, options);
  });
  void relation;
  return readable(replaced);
}

function renderMagnitude(
  variableId: VariableId,
  magnitude: Magnitude,
  options: ExplainOptions,
): string {
  if (typeof magnitude !== 'number') {
    const entries = Array.isArray(magnitude) ? magnitude : [];
    return `[${entries.map((entry) => String(entry)).join(', ')}]`;
  }

  const unitClass = VARIABLES.get(variableId)?.unitClass ?? 'ratio';

  // The class default rather than the variable's own decimal count. A derivation line shows a
  // currency amount whole and a ratio to four places, which is the shape the specification's
  // example render uses, and mixing the two reads as noise inside one expression.
  return formatByUnitClass(magnitude, unitClass, {
    locale: options.locale,
    ...(options.currency === undefined ? {} : { currency: options.currency }),
    decimals: defaultDecimals(unitClass),
    withSuffix: false,
    withPrefix: false,
  });
}

function originTag(value: Value, locale: Locale): string {
  const origin =
    locale === 'id'
      ? { user: 'masukan', derived: 'turunan', assumed: 'asumsi', scenario: 'skenario' }[
          value.origin
        ]
      : value.origin;
  if (value.origin === 'assumed' || value.origin === 'scenario') return origin;
  const generation = locale === 'id' ? `gen ${value.depth}` : `gen ${value.depth}`;
  return `${origin}, ${generation}`;
}
