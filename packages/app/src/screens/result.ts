/**
 * P09 and P10: turning an engine outcome into the text the Result field and the Derivation pane
 * show.
 *
 * The rule that shapes this file is principle P08. Three of the four outcomes are not a number:
 * nothing entered yet, inputs missing, and a refusal. Each is rendered as a sentence that names
 * what happened. None of them is rendered as a blank field or as a zero.
 */

import {
  RELATIONS,
  VARIABLES,
  defaultDecimals,
  explainStep,
  formatByUnitClass,
  formatNumber,
  type Env,
  type FormulaResult,
  type InterpretationBand,
  type Relation,
} from '@metrika/engine';
import type { Locale } from '../locale/index.ts';
import type { Outcome } from '../state/calculator.ts';

export interface ResultView {
  readonly text: string;
  readonly unit: string;
  readonly refused: boolean;
  readonly state: 'idle' | 'computed' | 'refused';
  /** Extra lines for a composite result: the IRR roots, the four price points, the vector. */
  readonly extra: readonly string[];
}

export function viewResult(
  relation: Relation,
  outcome: Outcome,
  locale: Locale,
  t: (key: string) => string,
): ResultView {
  if (outcome.kind === 'idle') {
    return { text: t('calc.result.empty'), unit: '', refused: true, state: 'idle', extra: [] };
  }

  if (outcome.kind === 'incomplete') {
    const names = outcome.missing
      .map((variableId) => t(`variable.${variableId}.label`))
      .join(locale === 'id' ? ', ' : ', ');
    return {
      text: `${t('status.missing_inputs')} ${names}`,
      unit: '',
      refused: true,
      state: 'refused',
      extra: [],
    };
  }

  if (outcome.kind === 'refused') {
    return { text: outcome.messages[locale], unit: '', refused: true, state: 'refused', extra: [] };
  }

  if (relation.resultShape === 'composite') {
    return {
      text: compositeHeadline(relation, locale, t),
      unit: '',
      refused: false,
      state: 'computed',
      extra: compositeLines(relation, outcome.result, locale),
    };
  }

  const magnitude = outcome.result as number;
  const unitClass =
    relation.output === null ? 'ratio' : (VARIABLES.get(relation.output)?.unitClass ?? 'ratio');

  return {
    text: formatByUnitClass(magnitude, unitClass, { locale, withPrefix: false, withSuffix: false }),
    unit: unitSuffix(unitClass, locale),
    refused: false,
    state: 'computed',
    extra: [],
  };
}

function unitSuffix(unitClass: string, locale: Locale): string {
  switch (unitClass) {
    case 'currency':
      return 'Rp';
    case 'percent':
      return '%';
    case 'period':
      return locale === 'id' ? 'periode' : 'periods';
    case 'person_month':
      return locale === 'id' ? 'orang bulan' : 'person months';
    default:
      return '';
  }
}

function compositeHeadline(relation: Relation, locale: Locale, t: (key: string) => string): string {
  if (relation.formulaId === 'irr') return t('calc.result.composite.irr');
  if (relation.formulaId === 'van_westendorp') return t('calc.result.composite.vw');
  void locale;
  return t('calc.result.composite.vector');
}

function compositeLines(relation: Relation, result: FormulaResult, locale: Locale): string[] {
  if (relation.formulaId === 'irr') {
    const irr = result as { roots: readonly number[]; unique: boolean };
    const lines = irr.roots.map((root) => `${formatNumber(root * 100, locale, 4)}%`);
    return lines;
  }
  if (relation.formulaId === 'van_westendorp') {
    const vw = result as { opp: number; ipp: number; pmc: number; pme: number };
    return [
      `OPP  ${formatNumber(vw.opp, locale, 0)}`,
      `IPP  ${formatNumber(vw.ipp, locale, 0)}`,
      `PMC  ${formatNumber(vw.pmc, locale, 0)}`,
      `PME  ${formatNumber(vw.pme, locale, 0)}`,
    ];
  }
  const vector = result as readonly number[];
  return vector.map((value, index) => `${index + 1}.  ${formatNumber(value, locale, 2)}`);
}

export interface MatchedBand {
  readonly index: number;
  readonly band: InterpretationBand;
}

/**
 * The band whose range contains the result, with its index, or null when no band does.
 *
 * The index is what the caller needs: the band label and its guidance sentence live in the locale
 * catalogue under formula.<id>.band.<index>, so no component holds that text inline (ADR-006).
 */
export function bandFor(relation: Relation, outcome: Outcome): MatchedBand | null {
  if (outcome.kind !== 'value' || relation.resultShape !== 'scalar') return null;
  const magnitude = outcome.result as number;
  const index = relation.interpretationBands.findIndex(
    (band) => magnitude >= band.lower && magnitude <= band.upper,
  );
  if (index === -1) return null;
  return { index, band: relation.interpretationBands[index] as InterpretationBand };
}

/**
 * P10: the derivation lines for the pane.
 *
 * The Calculator computes one relation from values the user typed, so the trail is one step deep
 * and every input is a user input. The lines are produced by the engine's explain module, not by a
 * second renderer here, so what the pane shows is what the engine did.
 */
export function derivationLines(
  relation: Relation,
  outcome: Outcome,
  locale: Locale,
  t: (key: string) => string,
): string[] {
  if (outcome.kind !== 'value') return [];

  const target = relation.output ?? relation.formulaId;
  const lines: string[] = [];

  if (relation.resultShape === 'scalar') {
    const step = {
      formulaId: relation.formulaId,
      direction: 'forward' as const,
      target,
      inputs: relation.inputs,
      env: outcome.env,
      magnitude: outcome.result as number,
      generation: 1,
    };
    lines.push(...explainStep(step, { locale }).lines);
  } else {
    lines.push(`${relation.symbol} = ${relation.expressionSource}`);
  }

  lines.push('');
  for (const variableId of relation.inputs) {
    const magnitude = (outcome.env as Env)[variableId];
    if (magnitude === undefined) continue;
    const definition = VARIABLES.get(variableId);
    const unitClass = definition?.unitClass ?? 'ratio';
    const rendered =
      typeof magnitude === 'number'
        ? formatByUnitClass(magnitude, unitClass, {
            locale,
            decimals: defaultDecimals(unitClass),
            withPrefix: false,
            withSuffix: false,
          })
        : JSON.stringify(magnitude);
    const origin = locale === 'id' ? 'masukan pengguna' : 'user input';
    lines.push(
      `  ${variableId}  <- ${origin} ${rendered}   [${locale === 'id' ? 'masukan, gen 0' : 'user, gen 0'}]`,
    );
  }

  lines.push('');
  lines.push(t('honesty.not_verified'));
  void RELATIONS;
  return lines;
}
