import { DomainViolation } from '../errors.ts';

export interface IrrResult {
  readonly roots: readonly number[];
  readonly unique: boolean;
  readonly converged: boolean;
}

const LOWER_BOUND = -0.9999;
const UPPER_BOUND = 10;
const SCAN_STEP = 0.005;
const BRENT_TOLERANCE = 1e-12;
const BRENT_MAX_ITERATIONS = 200;
/** Two roots closer than this are the same root found twice by adjacent brackets. */
const ROOT_MERGE_TOLERANCE = 1e-7;

/** Net present value of the full series including the period-zero outflow, undiscounted. */
function npvAt(cashFlows: readonly number[], investment0: number, rate: number): number {
  let total = -investment0;
  for (let t = 1; t <= cashFlows.length; t += 1) {
    total += (cashFlows[t - 1] as number) / Math.pow(1 + rate, t);
  }
  return total;
}

/**
 * Brent's method on a bracketed sign change. Combines bisection, the secant method and inverse
 * quadratic interpolation, so it keeps bisection's guaranteed convergence with superlinear speed.
 */
function brent(
  f: (x: number) => number,
  lower: number,
  upper: number,
): { root: number; converged: boolean } {
  let a = lower;
  let b = upper;
  let fa = f(a);
  let fb = f(b);

  if (fa * fb > 0) return { root: Number.NaN, converged: false };
  if (Math.abs(fa) < Math.abs(fb)) {
    [a, b] = [b, a];
    [fa, fb] = [fb, fa];
  }

  let c = a;
  let fc = fa;
  let d = b - a;
  let e = d;

  for (let iteration = 0; iteration < BRENT_MAX_ITERATIONS; iteration += 1) {
    if (fb === 0) return { root: b, converged: true };
    if (fb * fc > 0) {
      c = a;
      fc = fa;
      d = b - a;
      e = d;
    }
    if (Math.abs(fc) < Math.abs(fb)) {
      a = b;
      b = c;
      c = a;
      fa = fb;
      fb = fc;
      fc = fa;
    }

    const tolerance = 2 * Number.EPSILON * Math.abs(b) + BRENT_TOLERANCE;
    const midpoint = 0.5 * (c - b);
    if (Math.abs(midpoint) <= tolerance || fb === 0) {
      return { root: b, converged: true };
    }

    if (Math.abs(e) >= tolerance && Math.abs(fa) > Math.abs(fb)) {
      const s = fb / fa;
      let p: number;
      let q: number;
      if (a === c) {
        p = 2 * midpoint * s;
        q = 1 - s;
      } else {
        const r = fb / fc;
        const t = fa / fc;
        p = s * (2 * midpoint * t * (t - r) - (b - a) * (r - 1));
        q = (t - 1) * (r - 1) * (s - 1);
      }
      if (p > 0) q = -q;
      p = Math.abs(p);
      const acceptable =
        2 * p < Math.min(3 * midpoint * q - Math.abs(tolerance * q), Math.abs(e * q));
      if (acceptable) {
        e = d;
        d = p / q;
      } else {
        d = midpoint;
        e = d;
      }
    } else {
      d = midpoint;
      e = d;
    }

    a = b;
    fa = fb;
    b += Math.abs(d) > tolerance ? d : midpoint > 0 ? tolerance : -tolerance;
    fb = f(b);
  }

  return { root: b, converged: false };
}

/**
 * engine.helper_functions.irr_solve
 *
 * Brent's method on [-0.9999, 10] after a sign-change scan at 0.005 resolution.
 *
 * Every root found is reported. Reporting a single root when several exist is a correctness bug,
 * not a presentation choice: a series with two sign changes has two internal rates of return and
 * neither one alone answers the question the user asked.
 */
export function irrSolve(cashFlows: readonly number[], investment0: number): IrrResult {
  if (cashFlows.length < 1) {
    throw new DomainViolation({
      id: 'Deret arus kas kosong. Masukkan sekurang kurangnya satu periode.',
      en: 'The cash flow series is empty. Enter at least one period.',
    });
  }

  const series = [-investment0, ...cashFlows];
  let signChanges = 0;
  let previousSign = 0;
  for (const entry of series) {
    if (entry === 0) continue;
    const sign = entry > 0 ? 1 : -1;
    if (previousSign !== 0 && sign !== previousSign) signChanges += 1;
    previousSign = sign;
  }
  if (signChanges === 0) {
    throw new DomainViolation(
      {
        id:
          'Deret arus kas tidak berganti tanda, sehingga tingkat pengembalian internal tidak ada. ' +
          'Periksa kembali tanda investasi awal dan arus kas berikutnya.',
        en:
          'The cash flow series has no sign change, so no internal rate of return exists. ' +
          'Check the sign of the initial investment and of the later cash flows.',
      },
      { formulaId: 'irr', code: 'domain_violation' },
    );
  }

  const f = (rate: number): number => npvAt(cashFlows, investment0, rate);
  const roots: number[] = [];
  let converged = true;

  let leftRate = LOWER_BOUND;
  let leftValue = f(leftRate);
  const steps = Math.ceil((UPPER_BOUND - LOWER_BOUND) / SCAN_STEP);

  for (let step = 1; step <= steps; step += 1) {
    const rightRate = Math.min(LOWER_BOUND + step * SCAN_STEP, UPPER_BOUND);
    const rightValue = f(rightRate);

    if (leftValue === 0) pushRoot(roots, leftRate);
    else if (leftValue * rightValue < 0) {
      const outcome = brent(f, leftRate, rightRate);
      if (outcome.converged) pushRoot(roots, outcome.root);
      else converged = false;
    }

    leftRate = rightRate;
    leftValue = rightValue;
  }
  if (leftValue === 0) pushRoot(roots, leftRate);

  roots.sort((a, b) => a - b);
  return { roots, unique: roots.length === 1, converged };
}

function pushRoot(roots: number[], candidate: number): void {
  if (!Number.isFinite(candidate)) return;
  if (roots.some((existing) => Math.abs(existing - candidate) < ROOT_MERGE_TOLERANCE)) return;
  roots.push(candidate);
}
