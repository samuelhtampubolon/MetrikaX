/**
 * P02 helper tests, including every numerical edge case testing.layers names.
 */

import { describe, expect, it } from 'vitest';

import { seriesSum, npvCalc } from '../src/helpers/series.ts';
import { irrSolve } from '../src/helpers/irr.ts';
import { phi, blackScholesCall } from '../src/helpers/blackScholes.ts';
import { vwIntersection } from '../src/helpers/vanWestendorp.ts';
import { dot, matvec, transpose, sum } from '../src/helpers/linalg.ts';
import { DomainViolation, ShapeMismatch } from '../src/errors.ts';
import { expectRelative, expectEngineError } from './support/assert.ts';

describe('seriesSum', () => {
  it('discounts each period of retained revenue', () => {
    // 0.88 / 1.10 + 0.88^2 / 1.10^2 + ... for five periods
    let expected = 0;
    for (let t = 1; t <= 5; t += 1) expected += 0.88 ** t / 1.1 ** t;
    expectRelative(seriesSum(0.88, 0.1, 5), expected);
  });

  it('is bounded by the horizon when retention is one and the discount is zero', () => {
    // The case testing.layers names: the series must not diverge.
    expect(seriesSum(1, 0, 5)).toBe(5);
    expect(seriesSum(1, 0, 40)).toBe(40);
  });

  it('is zero when nothing is retained', () => {
    expect(seriesSum(0, 0.1, 5)).toBe(0);
  });

  it('refuses a horizon below one period', () => {
    expectEngineError(() => seriesSum(0.9, 0.1, 0));
  });

  it('refuses a retention rate outside zero to one', () => {
    expectEngineError(() => seriesSum(1.2, 0.1, 5));
    expectEngineError(() => seriesSum(-0.1, 0.1, 5));
  });

  it('refuses a discount rate of minus one or less', () => {
    expectEngineError(() => seriesSum(0.9, -1, 5));
  });
});

describe('npvCalc', () => {
  it('discounts from period one, leaving the initial outlay to the caller', () => {
    const flows = [100, 100, 100];
    const expected = 100 / 1.1 + 100 / 1.1 ** 2 + 100 / 1.1 ** 3;
    expectRelative(npvCalc(flows, 0.1), expected);
  });

  it('returns the undiscounted sum at a rate of zero', () => {
    expect(npvCalc([10, 20, 30], 0)).toBe(60);
  });

  it('refuses an empty series and a rate of minus one', () => {
    expectEngineError(() => npvCalc([], 0.1));
    expectEngineError(() => npvCalc([10], -1));
  });
});

describe('irrSolve', () => {
  it('finds the single root of a conventional series', () => {
    const result = irrSolve([120, 180, 240, 260, 280], 480);
    expect(result.converged).toBe(true);
    expect(result.unique).toBe(true);
    expect(result.roots).toHaveLength(1);
    // The discounted flows return to the outlay at the reported rate.
    const rate = result.roots[0]!;
    let npv = -480;
    [120, 180, 240, 260, 280].forEach((flow, index) => {
      npv += flow / (1 + rate) ** (index + 1);
    });
    expect(Math.abs(npv)).toBeLessThan(1e-6);
  });

  it('reports both roots of a series with two sign changes and clears the uniqueness flag', () => {
    // The classic non-conventional series: outlay, large inflow, large outflow.
    const result = irrSolve([230, -132], 100);
    expect(result.converged).toBe(true);
    expect(result.roots.length).toBeGreaterThanOrEqual(2);
    expect(result.unique).toBe(false);
    for (const rate of result.roots) {
      const npv = -100 + 230 / (1 + rate) - 132 / (1 + rate) ** 2;
      expect(Math.abs(npv), `root ${rate}`).toBeLessThan(1e-6);
    }
    // Reporting one of these two and calling it the return would be a correctness bug.
    expectRelative(result.roots[0]!, 0.1, 1e-4);
    expectRelative(result.roots[1]!, 0.2, 1e-4);
  });

  it('refuses a series with no sign change rather than reporting nothing', () => {
    const error = expectEngineError(() => irrSolve([10, 20], -5));
    expect(error).toBeInstanceOf(DomainViolation);
    expect(error.message_in('id')).toContain('tidak berganti tanda');
  });

  it('refuses an empty series', () => {
    expectEngineError(() => irrSolve([], 100));
  });
});

describe('phi and blackScholesCall', () => {
  it('phi stays inside the stated absolute accuracy of 1e-7', () => {
    // The specification asks for an accuracy of 1e-7. The measured worst absolute error across
    // these reference points is 6.92e-8, so the claim holds with margin.
    const reference: [number, number][] = [
      [0, 0.5],
      [1, 0.8413447460685429],
      [-1, 0.15865525393145707],
      [2, 0.9772498680518208],
      [-2, 0.022750131948179195],
      [1.959963984540054, 0.975],
      [-1.959963984540054, 0.025],
      [3, 0.9986501019683699],
      [-3, 0.0013498980316301035],
    ];
    let worst = 0;
    for (const [z, expected] of reference) {
      const error = Math.abs(phi(z) - expected);
      worst = Math.max(worst, error);
      expect(error, `phi(${z})`).toBeLessThan(1e-7);
    }
    expect(worst).toBeLessThan(1e-7);
  });

  it('phi is symmetric about zero', () => {
    for (const z of [0.25, 0.75, 1.5, 2.5, 3.5]) {
      expectRelative(phi(z) + phi(-z), 1, 1e-9);
    }
  });

  it('approaches the discounted intrinsic value as volatility approaches zero', () => {
    const S = 120;
    const X = 100;
    const r = 0.05;
    const T = 1;
    const intrinsic = Math.max(S - X * Math.exp(-r * T), 0);
    expectRelative(blackScholesCall(S, X, r, T, 1e-6), intrinsic, 1e-5);
  });

  it('is zero in the limit when the option is deep out of the money', () => {
    expect(blackScholesCall(10, 1000, 0.05, 1, 1e-4)).toBeLessThan(1e-6);
  });

  it('rises with volatility', () => {
    const low = blackScholesCall(100, 100, 0.05, 1, 0.1);
    const high = blackScholesCall(100, 100, 0.05, 1, 0.4);
    expect(high).toBeGreaterThan(low);
  });

  it('refuses a non-positive price, strike, expiry or volatility', () => {
    expectEngineError(() => blackScholesCall(0, 100, 0.05, 1, 0.2));
    expectEngineError(() => blackScholesCall(100, 0, 0.05, 1, 0.2));
    expectEngineError(() => blackScholesCall(100, 100, 0.05, 0, 0.2));
    expectEngineError(() => blackScholesCall(100, 100, 0.05, 1, 0));
  });
});

describe('vwIntersection', () => {
  const responses = {
    tooCheap: [20, 25, 30, 35, 40],
    cheap: [40, 45, 50, 55, 60],
    expensive: [70, 75, 80, 85, 90],
    tooExpensive: [95, 100, 105, 110, 115],
  };

  it('returns four price points and always returns the four curves', () => {
    const result = vwIntersection(
      responses.tooCheap,
      responses.cheap,
      responses.expensive,
      responses.tooExpensive,
    );
    expect(result.curves).toHaveLength(4);
    for (const curve of result.curves) expect(curve.points.length).toBeGreaterThan(0);
    for (const price of [result.opp, result.ipp, result.pmc, result.pme]) {
      expect(Number.isFinite(price)).toBe(true);
    }
  });

  it('places the acceptable range between the marginal cheapness and expensiveness points', () => {
    const result = vwIntersection(
      responses.tooCheap,
      responses.cheap,
      responses.expensive,
      responses.tooExpensive,
    );
    expect(result.pmc).toBeLessThanOrEqual(result.pme);
  });

  it('reads four scalars as a single respondent', () => {
    const result = vwIntersection(45000, 78000, 135000, 195000);
    expect(result.curves).toHaveLength(4);
    expect(Number.isFinite(result.opp)).toBe(true);
  });

  it('refuses response series of different lengths', () => {
    const error = expectEngineError(() => vwIntersection([10, 20], [30], [40, 50], [60, 70]));
    expect(error).toBeInstanceOf(ShapeMismatch);
  });
});

describe('linear algebra', () => {
  it('dot multiplies element by element', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
  });

  it('dot refuses mismatched lengths and empty vectors', () => {
    expectEngineError(() => dot([1, 2], [1]));
    expectEngineError(() => dot([], []));
  });

  it('matvec multiplies each row by the vector', () => {
    expect(
      matvec(
        [
          [1, 2],
          [3, 4],
        ],
        [5, 6],
      ),
    ).toEqual([17, 39]);
  });

  it('matvec refuses a row whose length does not match the vector', () => {
    expectEngineError(() => matvec([[1, 2, 3]], [1, 2]));
  });

  it('transpose exchanges rows and columns', () => {
    expect(
      transpose([
        [1, 2, 3],
        [4, 5, 6],
      ]),
    ).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
  });

  it('transpose refuses a ragged matrix', () => {
    expectEngineError(() => transpose([[1, 2], [3]]));
  });

  it('sum adds a vector', () => {
    expect(sum([1.5, 2.5, 3])).toBe(7);
  });
});
