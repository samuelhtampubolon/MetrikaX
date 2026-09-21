/**
 * P13: the view model behind SCR-SENSITIVITY.
 *
 * design_system.chart_rules: "The numbers shown in a chart must be identical to the numbers shown
 * in the adjacent table. A discrepancy is a build-blocking bug." The way that rule is kept here is
 * structural rather than careful. This file formats each number exactly once, into a row. The
 * table prints the row. The plot is handed the same row, and prints the string it carries rather
 * than formatting the value a second time. There is no second formatter that could disagree with
 * the first.
 */

import {
  VARIABLES,
  formatByUnitClass,
  formatNumber,
  type UnitClass,
  dominantFactorSentence,
  type FactorSwing,
  type Relation,
  type SensitivityResult,
} from '@metrika/engine';
import type { PlotBar } from '@metrika/ui';
import type { Locale } from '../locale/index.ts';
import type { SensitivityOutcome } from '../state/sensitivity.ts';

export interface SensitivityRow {
  readonly variableId: string;
  readonly label: string;
  /** The result when this input is low, as it is printed. */
  readonly low: string;
  readonly high: string;
  readonly swing: string;
  /** The swing as a share of the base, or the sentence that says the share is not defined. */
  readonly share: string;
  /** What the bar is drawn from. The printed form of this number is `swing`. */
  readonly swingValue: number;
  /** True when one side of the range was refused rather than computed. */
  readonly partial: boolean;
}

export interface SensitivityView {
  readonly state: 'idle' | 'incomplete' | 'refused' | 'ranked';
  /** Shown instead of the table when the state is not `ranked`. Never a blank field. */
  readonly message: string;
  readonly rows: readonly SensitivityRow[];
  readonly base: string;
  readonly sentence: string;
  readonly axisLabel: string;
}

/** The unit class the forward result carries, which is also the unit of every swing. */
function resultUnitClass(relation: Relation): UnitClass {
  if (relation.output === null) return 'ratio';
  return VARIABLES.get(relation.output)?.unitClass ?? 'ratio';
}

function unitSuffix(unitClass: UnitClass, locale: Locale): string {
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
      return locale === 'id' ? 'satuan hasil' : 'result units';
  }
}

export function buildView(
  relation: Relation,
  outcome: SensitivityOutcome,
  locale: Locale,
  t: (key: string) => string,
): SensitivityView {
  const empty = {
    rows: [] as readonly SensitivityRow[],
    base: t('calc.result.empty'),
    sentence: '',
    axisLabel: '',
  };

  if (outcome.kind === 'idle') {
    return { state: 'idle', message: t('sensitivity.idle'), ...empty };
  }

  if (outcome.kind === 'incomplete') {
    const parts: string[] = [];
    if (outcome.missing.length > 0) {
      const names = outcome.missing
        .map((variableId) => t(`variable.${variableId}.label`))
        .join(', ');
      parts.push(`${t('status.missing_inputs')} ${names}`);
    }
    if (outcome.perturbationInvalid) parts.push(t('sensitivity.perturbation.invalid'));
    return { state: 'incomplete', message: parts.join(' '), ...empty };
  }

  if (outcome.kind === 'refused') {
    return { state: 'refused', message: outcome.messages[locale], ...empty };
  }

  const unitClass = resultUnitClass(relation);
  const print = (value: number): string =>
    formatByUnitClass(value, unitClass, { locale, withPrefix: false, withSuffix: false });

  const rows = outcome.result.factors.map((factor) => row(factor, print, locale, t));

  return {
    state: 'ranked',
    message: '',
    rows,
    base: print(outcome.result.base),
    sentence: dominantSentence(outcome.result, locale, t),
    axisLabel: `${t('sensitivity.axis.swing')} ${relation.symbol} (${unitSuffix(unitClass, locale)})`,
  };
}

function row(
  factor: FactorSwing,
  print: (value: number) => string,
  locale: Locale,
  t: (key: string) => string,
): SensitivityRow {
  return {
    variableId: factor.variableId,
    label: t(`variable.${factor.variableId}.label`),
    low: print(factor.low),
    high: print(factor.high),
    swing: print(factor.swing),
    share:
      factor.swingShare === null
        ? t('sensitivity.share.undefined')
        : `${formatNumber(factor.swingShare * 100, locale, 1)}%`,
    swingValue: factor.swing,
    partial: factor.partial,
  };
}

/**
 * The tornado bars.
 *
 * Each bar carries the string the table cell prints. AC-15 is then not a thing to remember: the
 * plot has no number of its own to get wrong.
 */
export function plotBars(rows: readonly SensitivityRow[]): readonly PlotBar[] {
  return rows.map((entry) => ({
    id: entry.variableId,
    label: entry.label,
    value: entry.swingValue,
    valueLabel: entry.swing,
  }));
}

/**
 * The sentence the specification supplies, with the dominant factor named.
 *
 * The engine writes it, because the engine is what knows which factor won, and because the
 * sentence is an instruction about the arithmetic rather than a label on a control. It is held in
 * both locales beside the module that produces it, exactly as a refusal message is.
 */
function dominantSentence(
  result: SensitivityResult,
  locale: Locale,
  t: (key: string) => string,
): string {
  return dominantFactorSentence(result, (variableId) => t(`variable.${variableId}.label`), locale);
}
