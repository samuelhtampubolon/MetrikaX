/**
 * Unit classes for canonical variables.
 *
 * The unit class decides three things: how a value is formatted, which rounding discipline applies
 * (ADR-005), and which conflict tolerance the propagation engine uses when a derived value meets a
 * user-supplied one.
 */

export const UNIT_CLASSES = [
  'count',
  'currency',
  'ratio',
  'percent',
  'score',
  'period',
  'person_month',
  'vector',
  'matrix',
  'utils',
] as const;

export type UnitClass = (typeof UNIT_CLASSES)[number];

export const VALUE_KINDS = ['number', 'integer', 'array'] as const;
export type ValueKind = (typeof VALUE_KINDS)[number];

export function isUnitClass(candidate: string): candidate is UnitClass {
  return (UNIT_CLASSES as readonly string[]).includes(candidate);
}

/** Classes whose magnitude is a single number rather than a vector or a matrix. */
export function isScalarClass(unitClass: UnitClass): boolean {
  return unitClass !== 'vector' && unitClass !== 'matrix';
}

/**
 * ADR-005: currency accumulates decimal error, so report totals reconcile through a decimal path.
 * Ratio and score classes use float64 with rounding at the display layer only.
 */
export function isCurrencyClass(unitClass: UnitClass): boolean {
  return unitClass === 'currency';
}

/**
 * engine.conflict_detection.tolerance: relative 1e-6 for ratio classes, absolute 0.005 currency
 * units for money.
 */
export interface ConflictTolerance {
  readonly kind: 'relative' | 'absolute';
  readonly amount: number;
}

export function toleranceFor(unitClass: UnitClass): ConflictTolerance {
  if (unitClass === 'currency') return { kind: 'absolute', amount: 0.005 };
  return { kind: 'relative', amount: 1e-6 };
}

/**
 * Period stamps. engine.unit_and_period_discipline requires every count-class and currency-class
 * value to carry one, and blocks any relation that mixes two of them.
 */
export const PERIODS = ['daily', 'weekly', 'monthly', 'quarterly', 'annual'] as const;
export type Period = (typeof PERIODS)[number];

/** Periods per year, used to describe a conversion in the blocking message. */
export const PERIODS_PER_YEAR: Readonly<Record<Period, number>> = Object.freeze({
  daily: 365,
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  annual: 1,
});

/** Only count and currency values carry a period stamp. A ratio is dimensionless in time. */
export function carriesPeriodStamp(unitClass: UnitClass): boolean {
  return unitClass === 'count' || unitClass === 'currency';
}

/**
 * Scale a count or a currency amount between periods. This is a linear conversion and it is only
 * correct for extensive quantities: totals that accumulate over time.
 */
export function convertExtensive(magnitude: number, from: Period, to: Period): number {
  return (magnitude * PERIODS_PER_YEAR[from]) / PERIODS_PER_YEAR[to];
}

/**
 * Convert a rate between periods with the correct compounding.
 *
 * engine.unit_and_period_discipline: annual churn is 1 minus (1 minus monthly churn) to the
 * twelfth, never monthly times twelve. The engine refuses the naive multiplication; this function
 * is the conversion it offers instead, and applying it is an explicit user action that is recorded
 * in the assumption log.
 */
export function convertRateCompounded(rate: number, from: Period, to: Period): number {
  if (!(rate >= 0 && rate <= 1)) {
    throw new RangeError(`convertRateCompounded expects a rate in [0, 1], received ${rate}`);
  }
  const exponent = PERIODS_PER_YEAR[from] / PERIODS_PER_YEAR[to];
  return 1 - Math.pow(1 - rate, exponent);
}
