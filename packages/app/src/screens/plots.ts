/**
 * P14: the two plots the specification names, built as data rather than as pictures.
 *
 * The Bass diffusion curve and the Van Westendorp four-curve plot are the only two formulas in the
 * corpus whose answer is a shape rather than a number. Each is built here into one structure that
 * carries both the series the chart draws and the rows the table prints, from a single pass over
 * the same numbers, so chart_rules is satisfied by construction: where a number appears on the
 * chart it is the string the table cell holds, not a second rendering of the same value.
 *
 * The evaluation goes through `compute`, the engine's single path, so the guards run. A Bass curve
 * with an innovation coefficient of zero is a flat line at zero, which is finite and plausible and
 * meaningless, and the guard is what stops it being drawn.
 */

import { compute, formatNumber, EngineError, type Env, type Relation } from '@metrika/engine';
import type { ChartMark, ChartSeries } from '@metrika/ui';
import type { Locale } from '../locale/index.ts';
import type { Outcome } from '../state/calculator.ts';

export interface FigureRow {
  readonly key: string;
  readonly cells: readonly string[];
}

export interface Figure {
  readonly id: 'bass' | 'van_westendorp';
  readonly label: string;
  readonly series: readonly ChartSeries[];
  readonly marks: readonly ChartMark[];
  readonly xAxisLabel: string;
  readonly yAxisLabel: string;
  readonly formatX: (value: number) => string;
  readonly formatY: (value: number) => string;
  readonly columns: readonly string[];
  readonly rows: readonly FigureRow[];
  /** A sentence under the table, where one is owed: the hatched region, for instance. */
  readonly note: string;
}

type Translate = (key: string) => string;

/** The figure belonging to this relation and this outcome, or null when there is none to draw. */
export function figureFor(
  relation: Relation,
  outcome: Outcome,
  locale: Locale,
  t: Translate,
): Figure | null {
  if (outcome.kind !== 'value') return null;
  if (relation.formulaId === 'bass_f') return bassFigure(relation, outcome.env, locale, t);
  if (relation.formulaId === 'van_westendorp') return vwFigure(outcome.result, locale, t);
  return null;
}

/* ------------------------------------------------------------------ *
 * The Bass diffusion curve
 * ------------------------------------------------------------------ */

/**
 * F(t) over a grid of whole periods.
 *
 * The grid runs to twice the period the person entered, because the interesting part of a
 * diffusion curve is usually the part after the reading they have. Everything past their period is
 * a projection, and the chart hatches it: chart_rules requires that of a diffusion plot, and the
 * distinction is the difference between a measurement and a guess.
 */
function bassFigure(relation: Relation, env: Env, locale: Locale, t: Translate): Figure | null {
  const entered = env['time_t'];
  if (typeof entered !== 'number' || entered <= 0) return null;

  const horizon = Math.max(Math.ceil(entered * 2), Math.ceil(entered) + 1);
  const steps = Math.min(horizon, 40);

  const share = (period: number): number | null => {
    try {
      const value = compute(relation, { ...env, time_t: period });
      return typeof value === 'number' && Number.isFinite(value) ? value : null;
    } catch (error) {
      if (error instanceof EngineError) return null;
      throw error;
    }
  };

  const points: { x: number; y: number }[] = [];
  const rows: FigureRow[] = [];

  for (let period = 0; period <= steps; period += 1) {
    const value = share(period);
    if (value === null) continue;
    const percent = value * 100;
    points.push({ x: period, y: percent });
    rows.push({
      key: String(period),
      cells: [
        formatNumber(period, locale, 0),
        `${formatNumber(percent, locale, 2)}%`,
        period <= entered ? t('chart.observed') : t('chart.projected'),
      ],
    });
  }

  if (points.length === 0) return null;

  // The mark sits on the period the person actually entered, and carries the same string the table
  // prints on that row, so the one number written on the chart is the table's number.
  const markIndex = rows.findIndex((row) => row.key === String(Math.round(entered)));
  const marked = points[markIndex];
  const markedRow = rows[markIndex];

  return {
    id: 'bass',
    label: t('bass.plot.label'),
    series: [
      {
        id: 'adoption',
        label: t('bass.series.adoption'),
        points,
        shape: 'line',
        extrapolatedFrom: entered,
      },
    ],
    marks:
      marked === undefined || markedRow === undefined
        ? []
        : [{ id: 'entered', x: marked.x, y: marked.y, label: markedRow.cells[1] as string }],
    xAxisLabel: t('bass.axis.time'),
    yAxisLabel: t('bass.axis.share'),
    formatX: (value) => formatNumber(value, locale, 0),
    formatY: (value) => formatNumber(value, locale, 0),
    columns: [t('bass.column.time'), t('bass.column.share'), t('chart.column.status')],
    rows,
    note: t('bass.projection'),
  };
}

/* ------------------------------------------------------------------ *
 * The Van Westendorp four-curve plot
 * ------------------------------------------------------------------ */

interface CurvePoint {
  readonly price: number;
  readonly share: number;
}

interface VwShape {
  readonly opp: number;
  readonly ipp: number;
  readonly pmc: number;
  readonly pme: number;
  readonly curves: readonly { readonly id: string; readonly points: readonly CurvePoint[] }[];
}

function vwFigure(result: unknown, locale: Locale, t: Translate): Figure | null {
  const shape = result as VwShape;
  if (shape.curves.length === 0) return null;

  const series: ChartSeries[] = shape.curves.map((curve) => ({
    id: curve.id,
    label: t(`vw.curve.${curve.id}`),
    points: curve.points.map((point) => ({ x: point.price, y: point.share * 100 })),
    shape: 'step',
  }));

  const price = (value: number): string => formatNumber(value, locale, 0);

  const points: readonly [string, number][] = [
    ['opp', shape.opp],
    ['ipp', shape.ipp],
    ['pmc', shape.pmc],
    ['pme', shape.pme],
  ];

  const rows: FigureRow[] = points.map(([id, value]) => ({
    key: id,
    cells: [t(`vw.point.${id}`), price(value)],
  }));

  // Each crossing is marked at the height of the first curve that passes through that price, so
  // the mark sits on the shape rather than floating beside it.
  const marks: ChartMark[] = points.map(([id, value], index) => ({
    id,
    x: value,
    y: interpolate(shape.curves[0]?.points ?? [], value) * 100,
    label: `${t(`vw.point.${id}.short`)} ${(rows[index] as FigureRow).cells[1] as string}`,
  }));

  return {
    id: 'van_westendorp',
    label: t('vw.plot.label'),
    series,
    marks,
    xAxisLabel: t('vw.axis.price'),
    yAxisLabel: t('vw.axis.share'),
    formatX: (value) => formatNumber(value, locale, 0),
    formatY: (value) => formatNumber(value, locale, 0),
    columns: [t('vw.column.point'), t('vw.column.price')],
    rows,
    note: t('vw.note'),
  };
}

/** The share a curve carries at a price, interpolated between the two grid prices around it. */
function interpolate(points: readonly CurvePoint[], price: number): number {
  if (points.length === 0) return 0;
  const first = points[0] as CurvePoint;
  if (price <= first.price) return first.share;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1] as CurvePoint;
    const current = points[index] as CurvePoint;
    if (price > current.price) continue;
    const span = current.price - previous.price;
    if (span === 0) return current.share;
    const weight = (price - previous.price) / span;
    return previous.share + weight * (current.share - previous.share);
  }
  return (points[points.length - 1] as CurvePoint).share;
}
