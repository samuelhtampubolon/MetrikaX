import { DomainViolation } from '../errors.ts';

/**
 * engine.helper_functions.series_sum
 *
 * sum over t = 1..horizon of pow(retention, t) / pow(1 + discount, t)
 *
 * Guards: horizon >= 1, discount > -1, 0 <= retention <= 1.
 *
 * The closed form is available when retention / (1 + discount) < 1, but the loop is clearer and
 * fast enough, and it stays correct at the boundary where the ratio equals one. That boundary is
 * the case testing.layers names: retention 1 with discount 0 must be bounded by the horizon rather
 * than diverge, and the loop returns exactly `horizon` there.
 */
export function seriesSum(retention: number, discount: number, horizon: number): number {
  if (!(horizon >= 1)) {
    throw new DomainViolation({
      id: `Cakrawala waktu harus sekurang kurangnya 1 periode, diterima ${horizon}.`,
      en: `The horizon must be at least 1 period, received ${horizon}.`,
    });
  }
  if (!(discount > -1)) {
    throw new DomainViolation({
      id: `Tingkat diskonto harus lebih besar dari -1, diterima ${discount}.`,
      en: `The discount rate must be greater than -1, received ${discount}.`,
    });
  }
  if (!(retention >= 0 && retention <= 1)) {
    throw new DomainViolation({
      id: `Tingkat retensi harus berada di antara 0 dan 1, diterima ${retention}.`,
      en: `The retention rate must lie between 0 and 1, received ${retention}.`,
    });
  }

  const periods = Math.floor(horizon);
  let total = 0;
  for (let t = 1; t <= periods; t += 1) {
    total += Math.pow(retention, t) / Math.pow(1 + discount, t);
  }
  return total;
}

/**
 * engine.helper_functions.npv_calc
 *
 * sum over t of cashFlows[t-1] / pow(1 + rate, t), t starting at 1.
 * The initial investment is subtracted outside this helper, at period zero, undiscounted.
 */
export function npvCalc(cashFlows: readonly number[], rate: number): number {
  if (cashFlows.length < 1) {
    throw new DomainViolation({
      id: 'Deret arus kas kosong. Masukkan sekurang kurangnya satu periode.',
      en: 'The cash flow series is empty. Enter at least one period.',
    });
  }
  if (!(rate > -1)) {
    throw new DomainViolation({
      id: `Tingkat diskonto harus lebih besar dari -1, diterima ${rate}.`,
      en: `The discount rate must be greater than -1, received ${rate}.`,
    });
  }
  let total = 0;
  for (let t = 1; t <= cashFlows.length; t += 1) {
    total += (cashFlows[t - 1] as number) / Math.pow(1 + rate, t);
  }
  return total;
}
