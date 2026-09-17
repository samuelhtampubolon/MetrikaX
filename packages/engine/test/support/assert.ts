import { expect } from 'vitest';

/**
 * Relative comparison. The golden suite asserts to a relative tolerance rather than to a fixed
 * number of decimal places, because the corpus spans values from a click-through rate of 0.0125 to
 * a lifetime value in the hundreds of millions of rupiah, and one absolute tolerance cannot serve
 * both.
 *
 * The round-trip cases use 1e-9, which testing.layers states.
 */
export function expectRelative(actual: number, expected: number, tolerance = 1e-9): void {
  expect(Number.isFinite(actual)).toBe(true);
  if (expected === 0) {
    expect(Math.abs(actual)).toBeLessThanOrEqual(tolerance);
    return;
  }
  const relative = Math.abs((actual - expected) / expected);
  if (relative > tolerance) {
    expect
      .soft(actual, `relative difference ${relative} exceeds ${tolerance}`)
      .toBe(expected);
    throw new Error(
      `Expected ${actual} to be within a relative ${tolerance} of ${expected}, ` +
        `but the relative difference is ${relative}.`,
    );
  }
}
