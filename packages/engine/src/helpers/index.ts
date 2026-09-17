/**
 * The helper namespace that compiled formula expressions are evaluated against.
 *
 * ADR-003: the expressions in the specification are authoring input. Codegen compiles them into
 * typed function bodies at generation time. The shipped application never calls eval or the
 * Function constructor, so this namespace is the whole surface a compiled expression may reach.
 */

export { seriesSum, npvCalc } from './series.ts';
export { irrSolve, type IrrResult } from './irr.ts';
export { phi, blackScholesCall } from './blackScholes.ts';
export {
  vwIntersection,
  type VwResult,
  type Curve,
  type CurvePoint,
  type VanWestendorpResponses,
} from './vanWestendorp.ts';
export { dot, matvec, transpose, sum } from './linalg.ts';

import { seriesSum, npvCalc } from './series.ts';
import { irrSolve } from './irr.ts';
import { phi, blackScholesCall } from './blackScholes.ts';
import { vwIntersection } from './vanWestendorp.ts';
import { dot, matvec, transpose, sum } from './linalg.ts';

/**
 * Aliases named exactly as the specification's expression strings name them. Generated formula
 * modules import these, so the emitted source reads the same as the expression in the
 * specification and a reviewer can compare the two line by line.
 */
export { seriesSum as series_sum, npvCalc as npv_calc } from './series.ts';
export { irrSolve as irr_solve } from './irr.ts';
export { blackScholesCall as black_scholes_call } from './blackScholes.ts';
export { vwIntersection as vw_intersection } from './vanWestendorp.ts';

/** The whole surface a compiled expression may reach, as one frozen record. */
export const helpers = Object.freeze({
  series_sum: seriesSum,
  npv_calc: npvCalc,
  irr_solve: irrSolve,
  black_scholes_call: blackScholesCall,
  vw_intersection: vwIntersection,
  dot,
  matvec,
  transpose,
  phi,
  sum,
});

export type Helpers = typeof helpers;
