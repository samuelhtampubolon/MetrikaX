/**
 * Number formatting per unit class and locale.
 *
 * ADR-005: rounding happens here, at the display layer, and nowhere in the computation layer.
 * Rounding during computation is the most common source of numbers that do not reconcile between
 * a dashboard and a spreadsheet.
 *
 * locale.number_formatting fixes the separators: Indonesian uses a dot for thousands and a comma
 * for decimals; English uses the reverse. Both use the prefix `Rp ` for currency, because the
 * workspace currency is a workspace property and not a locale property.
 */

import type { Locale } from '../errors.ts';
import type { UnitClass } from './units.ts';

interface Separators {
  readonly thousand: string;
  readonly decimal: string;
}

const SEPARATORS: Readonly<Record<Locale, Separators>> = Object.freeze({
  id: { thousand: '.', decimal: ',' },
  en: { thousand: ',', decimal: '.' },
});

const CURRENCY_PREFIX: Readonly<Record<'IDR' | 'USD' | 'EUR', string>> = Object.freeze({
  IDR: 'Rp ',
  USD: 'USD ',
  EUR: 'EUR ',
});

export interface FormatOptions {
  readonly locale: Locale;
  readonly currency?: 'IDR' | 'USD' | 'EUR';
  /** Overrides the default decimal count for the unit class. */
  readonly decimals?: number;
  /** Adds the class suffix, for example the percent sign. Defaults to true. */
  readonly withSuffix?: boolean;
}

/** Default decimal places by unit class, used when the variable does not state its own. */
export function defaultDecimals(unitClass: UnitClass): number {
  switch (unitClass) {
    case 'count':
      return 0;
    case 'currency':
      return 0;
    case 'ratio':
      return 4;
    case 'percent':
      return 2;
    case 'score':
      return 2;
    case 'period':
      return 2;
    case 'person_month':
      return 1;
    case 'utils':
      return 4;
    case 'vector':
    case 'matrix':
      return 4;
  }
}

/**
 * Group the integer part and join it to the fraction with the locale separators.
 * Written by hand rather than through Intl so that the desktop build has no dependency on the
 * runtime's locale data, which varies between WebView2 versions.
 */
export function formatNumber(value: number, locale: Locale, decimals: number): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`formatNumber received a non-finite value: ${value}`);
  }
  const separators = SEPARATORS[locale];
  const negative = value < 0 || Object.is(value, -0);
  const fixed = Math.abs(value).toFixed(decimals);
  const dot = fixed.indexOf('.');
  const integerPart = dot === -1 ? fixed : fixed.slice(0, dot);
  const fractionPart = dot === -1 ? '' : fixed.slice(dot + 1);

  let grouped = '';
  for (let index = 0; index < integerPart.length; index += 1) {
    const fromEnd = integerPart.length - index;
    grouped += integerPart[index];
    if (fromEnd > 1 && (fromEnd - 1) % 3 === 0) grouped += separators.thousand;
  }

  const body = fractionPart.length > 0 ? `${grouped}${separators.decimal}${fractionPart}` : grouped;
  return negative ? `-${body}` : body;
}

/** Format a magnitude for a given unit class. Percent-class values are stored as percentages. */
export function formatByUnitClass(
  value: number,
  unitClass: UnitClass,
  options: FormatOptions,
): string {
  const decimals = options.decimals ?? defaultDecimals(unitClass);
  const withSuffix = options.withSuffix ?? true;
  const body = formatNumber(value, options.locale, decimals);

  switch (unitClass) {
    case 'currency': {
      const prefix = CURRENCY_PREFIX[options.currency ?? 'IDR'];
      return `${prefix}${body}`;
    }
    case 'percent':
      return withSuffix ? `${body}%` : body;
    case 'period':
      return withSuffix ? `${body} ${options.locale === 'id' ? 'periode' : 'periods'}` : body;
    case 'person_month':
      return withSuffix ? `${body} ${options.locale === 'id' ? 'orang bulan' : 'person months'}` : body;
    default:
      return body;
  }
}

/** Render a ratio as a percentage without changing the stored magnitude. */
export function ratioAsPercent(ratio: number, locale: Locale, decimals = 2): string {
  return `${formatNumber(ratio * 100, locale, decimals)}%`;
}

/** Parse a locale-formatted string back to a number. Returns null when the text is not a number. */
export function parseNumber(text: string, locale: Locale): number | null {
  const separators = SEPARATORS[locale];
  const cleaned = text
    .trim()
    .replace(/^(Rp|USD|EUR)\s*/i, '')
    .replace(/%$/, '')
    .split(separators.thousand)
    .join('')
    .replace(separators.decimal, '.');
  if (cleaned.length === 0) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}
