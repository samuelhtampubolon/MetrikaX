import { DomainViolation } from '../errors.ts';

/**
 * Standard normal cumulative distribution function.
 *
 * Implemented through an erf approximation of Abramowitz and Stegun 7.1.26, whose stated absolute
 * error bound is 1.5e-7, which meets the 1e-7 accuracy the specification asks for across the range
 * that matters here. Symmetry is used for negative arguments so the error does not double.
 */
export function phi(z: number): number {
  if (!Number.isFinite(z)) {
    throw new DomainViolation({
      id: `Fungsi distribusi normal menerima nilai yang tidak berhingga: ${z}.`,
      en: `The normal distribution function received a non-finite value: ${z}.`,
    });
  }
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const absolute = Math.abs(x);

  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const t = 1 / (1 + p * absolute);
  const poly = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t;
  return sign * (1 - poly * Math.exp(-absolute * absolute));
}

/**
 * engine.helper_functions.black_scholes_call
 *
 * S * Phi(d1) - X * exp(-r*T) * Phi(d2)
 *
 * Guards: S > 0, X > 0, T > 0, sigma > 0. As sigma approaches zero the price approaches
 * max(S - X * exp(-r * T), 0), which the numerical edge case suite asserts.
 */
export function blackScholesCall(
  S: number,
  X: number,
  r: number,
  T: number,
  sigma: number,
): number {
  guardPositive(S, 'S', 'harga aset dasar', 'the underlying price');
  guardPositive(X, 'X', 'harga pelaksanaan', 'the strike price');
  guardPositive(T, 'T', 'waktu jatuh tempo', 'the time to expiry');
  guardPositive(sigma, 'sigma', 'volatilitas', 'the volatility');
  if (!Number.isFinite(r)) {
    throw new DomainViolation({
      id: `Tingkat bunga bebas risiko tidak berhingga: ${r}.`,
      en: `The risk-free rate is not finite: ${r}.`,
    });
  }

  const sigmaRootT = sigma * Math.sqrt(T);
  const d1 = (Math.log(S / X) + (r + (sigma * sigma) / 2) * T) / sigmaRootT;
  const d2 = d1 - sigmaRootT;
  return S * phi(d1) - X * Math.exp(-r * T) * phi(d2);
}

function guardPositive(value: number, symbol: string, labelId: string, labelEn: string): void {
  if (!(value > 0)) {
    throw new DomainViolation(
      {
        id: `Nilai ${labelId} (${symbol}) harus lebih besar dari nol, diterima ${value}.`,
        en: `${labelEn} (${symbol}) must be greater than zero, received ${value}.`,
      },
      { formulaId: 'real_options_value' },
    );
  }
}
