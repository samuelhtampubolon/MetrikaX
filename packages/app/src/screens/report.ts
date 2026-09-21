/**
 * P22: the report, as data.
 *
 * SCR-REPORT is described as a print preview showing the exact A4 output, so the screen and the
 * printed page are one document with one stylesheet, not two renderings of the same material. This
 * module builds that document as a structure: a header, one section per derived value, the
 * assumptions, and the footer.
 *
 * The sections are built from the propagation trail rather than recomputed. A report that computed
 * its own numbers could disagree with the workbench that produced them, and a report whose numbers
 * disagree with the tool is worse than no report.
 */

import {
  RELATIONS,
  VARIABLES,
  explainAssumptions,
  explainStep,
  formatByUnitClass,
  type DerivationStep,
  type PropagationResult,
  type Relation,
  type UnitClass,
  type Value,
} from '@metrika/engine';
import type { Locale } from '../locale/index.ts';

export interface ReportSection {
  readonly variableId: string;
  /** The label of the value this section reports. */
  readonly label: string;
  readonly formulaId: string;
  readonly symbol: string;
  readonly formulaName: string;
  /** The expression in names: revenue / orders. */
  readonly symbolic: string;
  /** The same expression with each name replaced by the value it carried. */
  readonly substituted: string;
  readonly result: string;
  /** Which generation of the propagation produced it, counted from the entered values. */
  readonly generation: number;
}

export interface ReportEntry {
  readonly variableId: string;
  readonly label: string;
  readonly value: string;
}

export interface Report {
  readonly workspace: string;
  readonly date: string;
  readonly application: string;
  readonly version: string;
  readonly entered: readonly ReportEntry[];
  readonly sections: readonly ReportSection[];
  readonly assumptions: readonly string[];
  readonly footer: string;
  /** True when there is nothing to report yet, which the screen says rather than printing a shell. */
  readonly empty: boolean;
}

export interface ReportInput {
  readonly workspace: string;
  readonly entered: Readonly<Record<string, number>>;
  readonly result: PropagationResult | null;
  readonly locale: Locale;
  readonly version: string;
  readonly now: Date;
  readonly t: (key: string) => string;
}

/** The date as the report prints it. Written out rather than numeric, so no reader misreads it. */
export function reportDate(now: Date, locale: Locale): string {
  const months =
    locale === 'id'
      ? [
          'Januari',
          'Februari',
          'Maret',
          'April',
          'Mei',
          'Juni',
          'Juli',
          'Agustus',
          'September',
          'Oktober',
          'November',
          'Desember',
        ]
      : [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];
  const month = months[now.getMonth()] ?? '';
  return `${now.getDate()} ${month} ${now.getFullYear()}`;
}

function unitClassOf(variableId: string): UnitClass {
  return VARIABLES.get(variableId)?.unitClass ?? 'ratio';
}

function print(variableId: string, magnitude: unknown, locale: Locale): string {
  if (typeof magnitude !== 'number') return JSON.stringify(magnitude);
  return formatByUnitClass(magnitude, unitClassOf(variableId), {
    locale,
    withPrefix: true,
    withSuffix: true,
  });
}

export function buildReport(input: ReportInput): Report {
  const { entered, result, locale, t } = input;

  const enteredEntries: ReportEntry[] = Object.entries(entered)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([variableId, magnitude]) => ({
      variableId,
      label: t(`variable.${variableId}.label`),
      value: print(variableId, magnitude, locale),
    }));

  const sections = result === null ? [] : sectionsFrom(result.trail, locale, t);

  const assumptions =
    result === null
      ? [t('report.assumptions.none')]
      : explainAssumptions(result.derived, { locale });

  return {
    workspace: input.workspace,
    date: reportDate(input.now, locale),
    application: t('app.name'),
    version: input.version,
    entered: enteredEntries,
    sections,
    assumptions,
    footer: t('honesty.not_verified'),
    empty: enteredEntries.length === 0 && sections.length === 0,
  };
}

/**
 * One section per step of the trail, keeping the first step that produced each variable.
 *
 * A variable can be reached by more than one route. The report prints the route the engine
 * actually took first, which is the one the workbench shows, rather than picking whichever looks
 * tidier.
 */
function sectionsFrom(
  trail: readonly DerivationStep[],
  locale: Locale,
  t: (key: string) => string,
): ReportSection[] {
  const seen = new Set<string>();
  const sections: ReportSection[] = [];

  for (const step of trail) {
    if (seen.has(step.target)) continue;
    seen.add(step.target);

    const relation = RELATIONS.get(step.formulaId) as Relation | undefined;
    if (relation === undefined) continue;

    const lines = explainStep(step, { locale }).lines;
    sections.push({
      variableId: step.target,
      label: t(`variable.${step.target}.label`),
      formulaId: step.formulaId,
      symbol: relation.symbol,
      formulaName: t(`formula.${step.formulaId}.name`),
      symbolic: (lines[0] ?? '').trim(),
      substituted: (lines[1] ?? '').trim(),
      result: (lines[2] ?? '').trim(),
      generation: step.generation,
    });
  }

  return sections;
}

/**
 * The report as Markdown, for the Copy as Markdown action.
 *
 * It carries the same text the page shows, in the same order, including the footer. A copy that
 * quietly dropped the honesty clause would be the one sentence most worth keeping.
 */
export function reportMarkdown(report: Report, t: (key: string) => string): string {
  const lines: string[] = [];

  lines.push(`# ${report.application}: ${t('report.title')}`);
  lines.push('');
  lines.push(`- ${t('report.header.workspace')}: ${report.workspace}`);
  lines.push(`- ${t('report.header.date')}: ${report.date}`);
  lines.push(`- ${t('report.header.version')}: ${report.application} ${report.version}`);
  lines.push('');

  lines.push(`## ${t('report.entered.legend')}`);
  lines.push('');
  if (report.entered.length === 0) {
    lines.push(t('report.entered.none'));
  } else {
    lines.push(`| ${t('solver.column.variable')} | ${t('solver.column.value')} |`);
    lines.push('| --- | --- |');
    for (const entry of report.entered) lines.push(`| ${entry.label} | ${entry.value} |`);
  }
  lines.push('');

  lines.push(`## ${t('report.sections.legend')}`);
  lines.push('');
  if (report.sections.length === 0) {
    lines.push(t('report.sections.none'));
    lines.push('');
  } else {
    for (const section of report.sections) {
      lines.push(`### ${section.label}`);
      lines.push('');
      lines.push(`${section.symbol}, ${section.formulaName}`);
      lines.push('');
      lines.push('```');
      lines.push(section.symbolic);
      lines.push(section.substituted);
      lines.push(section.result);
      lines.push('```');
      lines.push('');
    }
  }

  lines.push(`## ${t('report.assumptions.legend')}`);
  lines.push('');
  for (const sentence of report.assumptions) lines.push(`- ${sentence}`);
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push(report.footer);

  return lines.join('\n');
}

/** The values the workbench derived, for the caller that wants them as plain entries. */
export function derivedEntries(
  result: PropagationResult | null,
  locale: Locale,
  t: (key: string) => string,
): ReportEntry[] {
  if (result === null) return [];
  return [...result.derived.values()]
    .filter((value: Value) => value.origin === 'derived')
    .map((value) => ({
      variableId: value.variableId,
      label: t(`variable.${value.variableId}.label`),
      value: print(value.variableId, value.magnitude, locale),
    }));
}
