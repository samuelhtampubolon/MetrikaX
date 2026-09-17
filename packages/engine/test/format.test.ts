/**
 * P01 formatting tests. locale.number_formatting fixes the separators for both locales.
 */

import { describe, expect, it } from 'vitest';
import {
  defaultDecimals,
  formatByUnitClass,
  formatNumber,
  parseNumber,
  ratioAsPercent,
} from '../src/variables/format.ts';
import { convertExtensive, convertRateCompounded } from '../src/variables/units.ts';

describe('formatNumber', () => {
  it('uses a dot for thousands and a comma for decimals in Indonesian', () => {
    expect(formatNumber(185000000, 'id', 2)).toBe('185.000.000,00');
    expect(formatNumber(1234.5, 'id', 2)).toBe('1.234,50');
    expect(formatNumber(999, 'id', 0)).toBe('999');
    expect(formatNumber(1000, 'id', 0)).toBe('1.000');
  });

  it('uses a comma for thousands and a dot for decimals in English', () => {
    expect(formatNumber(185000000, 'en', 2)).toBe('185,000,000.00');
    expect(formatNumber(1234.5, 'en', 2)).toBe('1,234.50');
  });

  it('keeps the sign in front of the grouped digits', () => {
    expect(formatNumber(-1234.5, 'id', 2)).toBe('-1.234,50');
    expect(formatNumber(-1234.5, 'en', 2)).toBe('-1,234.50');
  });

  it('refuses a non-finite value rather than printing NaN', () => {
    expect(() => formatNumber(Number.POSITIVE_INFINITY, 'id', 2)).toThrow(RangeError);
    expect(() => formatNumber(Number.NaN, 'id', 2)).toThrow(RangeError);
  });
});

describe('formatByUnitClass', () => {
  it('prefixes currency and leaves the class decimals to the caller', () => {
    expect(formatByUnitClass(185000000, 'currency', { locale: 'id' })).toBe('Rp 185.000.000');
    expect(formatByUnitClass(185000000, 'currency', { locale: 'en', currency: 'USD' })).toBe(
      'USD 185,000,000',
    );
  });

  it('suffixes a percent and names a period', () => {
    expect(formatByUnitClass(81.43, 'percent', { locale: 'id' })).toBe('81,43%');
    expect(formatByUnitClass(5, 'period', { locale: 'id', decimals: 0 })).toBe('5 periode');
    expect(formatByUnitClass(5, 'period', { locale: 'en', decimals: 0 })).toBe('5 periods');
  });

  it('gives a count no decimals and a ratio four', () => {
    expect(defaultDecimals('count')).toBe(0);
    expect(defaultDecimals('ratio')).toBe(4);
    expect(formatByUnitClass(0.0125, 'ratio', { locale: 'id' })).toBe('0,0125');
  });

  it('renders a ratio as a percentage without changing the stored value', () => {
    expect(ratioAsPercent(0.0125, 'id')).toBe('1,25%');
    expect(ratioAsPercent(0.0125, 'en')).toBe('1.25%');
  });
});

describe('parseNumber', () => {
  it('reads back what formatNumber produced', () => {
    for (const value of [0, 1, 1234.56, 185000000, -42.5]) {
      for (const locale of ['id', 'en'] as const) {
        const text = formatNumber(value, locale, 2);
        expect(parseNumber(text, locale), `${locale} ${text}`).toBeCloseTo(value, 8);
      }
    }
  });

  it('accepts a currency prefix and a percent suffix', () => {
    expect(parseNumber('Rp 185.000.000,00', 'id')).toBe(185000000);
    expect(parseNumber('81,43%', 'id')).toBeCloseTo(81.43, 8);
  });

  it('returns null for text that is not a number', () => {
    expect(parseNumber('', 'id')).toBeNull();
    expect(parseNumber('tidak ada', 'id')).toBeNull();
  });
});

describe('period conversion', () => {
  it('scales a count linearly between periods', () => {
    expect(convertExtensive(12, 'monthly', 'annual')).toBe(144);
    expect(convertExtensive(365, 'daily', 'annual')).toBe(365 * 365);
  });

  it('compounds a rate rather than multiplying it', () => {
    const monthlyChurn = 0.04;
    const annual = convertRateCompounded(monthlyChurn, 'monthly', 'annual');
    // The naive answer, 0.48, is what the engine refuses to produce.
    expect(annual).not.toBeCloseTo(monthlyChurn * 12, 4);
    expect(annual).toBeCloseTo(1 - (1 - monthlyChurn) ** 12, 12);
    expect(annual).toBeLessThan(monthlyChurn * 12);
  });

  it('round trips a rate between two periods', () => {
    const annual = 0.4;
    const monthly = convertRateCompounded(annual, 'annual', 'monthly');
    expect(convertRateCompounded(monthly, 'monthly', 'annual')).toBeCloseTo(annual, 12);
  });

  it('refuses a rate outside zero to one', () => {
    expect(() => convertRateCompounded(1.4, 'monthly', 'annual')).toThrow(RangeError);
  });
});
