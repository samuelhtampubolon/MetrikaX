import { DomainViolation, ShapeMismatch } from '../errors.ts';

export interface CurvePoint {
  readonly price: number;
  readonly share: number;
}

export interface Curve {
  readonly id: 'too_cheap' | 'cheap' | 'expensive' | 'too_expensive';
  readonly points: readonly CurvePoint[];
}

export interface VwResult {
  /** Optimal price point: too cheap descending crosses too expensive ascending. */
  readonly opp: number;
  /** Indifference price point: cheap crosses expensive. */
  readonly ipp: number;
  /** Point of marginal cheapness: too cheap crosses expensive. */
  readonly pmc: number;
  /** Point of marginal expensiveness: cheap crosses too expensive. */
  readonly pme: number;
  readonly curves: readonly Curve[];
}

export interface VanWestendorpResponses {
  readonly tooCheap: readonly number[];
  readonly cheap: readonly number[];
  readonly expensive: readonly number[];
  readonly tooExpensive: readonly number[];
}

/**
 * engine.helper_functions.vw_intersection
 *
 * Builds four cumulative curves over the sorted price grid and returns the four crossing prices
 * together with the curve data. The curves are always returned: reporting a crossing price without
 * the shape that produced it hides whether the crossing means anything.
 *
 * The specification's helper signature takes a response set while the van_westendorp relation calls
 * it with four scalars. Both are accepted here: a scalar is read as a single respondent. See
 * DEVIATIONS.md, D-02.
 */
export function vwIntersection(
  tooCheap: number | readonly number[],
  cheap: number | readonly number[],
  expensive: number | readonly number[],
  tooExpensive: number | readonly number[],
): VwResult {
  const responses: VanWestendorpResponses = {
    tooCheap: toArray(tooCheap),
    cheap: toArray(cheap),
    expensive: toArray(expensive),
    tooExpensive: toArray(tooExpensive),
  };

  const lengths = [
    responses.tooCheap.length,
    responses.cheap.length,
    responses.expensive.length,
    responses.tooExpensive.length,
  ];
  if (lengths.some((length) => length < 1)) {
    throw new DomainViolation(
      {
        id: 'Setiap deret jawaban Van Westendorp harus memuat sekurang kurangnya satu harga.',
        en: 'Each Van Westendorp response series must contain at least one price.',
      },
      { formulaId: 'van_westendorp' },
    );
  }
  if (new Set(lengths).size !== 1) {
    throw new ShapeMismatch(
      {
        id: `Keempat deret jawaban memiliki panjang berbeda: ${lengths.join(', ')}.`,
        en: `The four response series have different lengths: ${lengths.join(', ')}.`,
      },
      { formulaId: 'van_westendorp' },
    );
  }

  const grid = [
    ...new Set([
      ...responses.tooCheap,
      ...responses.cheap,
      ...responses.expensive,
      ...responses.tooExpensive,
    ]),
  ].sort((a, b) => a - b);

  // Descending curves: the share of respondents who would call this price too cheap or cheap
  // falls as the price rises. Ascending curves: expensive and too expensive rise with price.
  const tooCheapCurve = buildCurve('too_cheap', grid, responses.tooCheap, 'at_or_above');
  const cheapCurve = buildCurve('cheap', grid, responses.cheap, 'at_or_above');
  const expensiveCurve = buildCurve('expensive', grid, responses.expensive, 'at_or_below');
  const tooExpensiveCurve = buildCurve(
    'too_expensive',
    grid,
    responses.tooExpensive,
    'at_or_below',
  );

  return {
    opp: crossing(tooCheapCurve, tooExpensiveCurve),
    ipp: crossing(cheapCurve, expensiveCurve),
    pmc: crossing(tooCheapCurve, expensiveCurve),
    pme: crossing(cheapCurve, tooExpensiveCurve),
    curves: [tooCheapCurve, cheapCurve, expensiveCurve, tooExpensiveCurve],
  };
}

function toArray(value: number | readonly number[]): readonly number[] {
  return typeof value === 'number' ? [value] : value;
}

function buildCurve(
  id: Curve['id'],
  grid: readonly number[],
  responses: readonly number[],
  direction: 'at_or_above' | 'at_or_below',
): Curve {
  const total = responses.length;
  const points = grid.map((price) => {
    const matching =
      direction === 'at_or_above'
        ? responses.filter((response) => response >= price).length
        : responses.filter((response) => response <= price).length;
    return { price, share: matching / total };
  });
  return { id, points };
}

/**
 * The price at which two curves cross, found by linear interpolation between the grid points that
 * bracket the sign change of the difference. When the curves do not cross inside the observed
 * range, the grid endpoint nearest to a crossing is returned and the caller can see from the curves
 * that no crossing occurred.
 */
function crossing(a: Curve, b: Curve): number {
  const points = a.points;
  let previousDelta = (points[0] as CurvePoint).share - (b.points[0] as CurvePoint).share;
  let previousPrice = (points[0] as CurvePoint).price;

  for (let index = 1; index < points.length; index += 1) {
    const price = (points[index] as CurvePoint).price;
    const delta = (points[index] as CurvePoint).share - (b.points[index] as CurvePoint).share;
    if (delta === 0) return price;
    if (previousDelta * delta < 0) {
      const weight = previousDelta / (previousDelta - delta);
      return previousPrice + weight * (price - previousPrice);
    }
    previousDelta = delta;
    previousPrice = price;
  }
  return previousPrice;
}
