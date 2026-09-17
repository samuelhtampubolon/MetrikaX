// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';
import { black_scholes_call } from '../../helpers/index.ts';

/**
 * Real_Options_Value: Real Options Value
 * Nilai Opsi Nyata
 *
 * Stratum XI, phase B8, structural class C7, decision domain D8.
 * Engine rule: render distribution alongside point value; require probability_source field
 */
export const real_options_value: Relation = Object.freeze({
  formulaId: "real_options_value",
  symbol: "Real_Options_Value",
  name: { id: "Nilai Opsi Nyata", en: "Real Options Value" },
  inputs: Object.freeze(["opt_s", "opt_x", "opt_r", "opt_t", "opt_sigma"]),
  output: "real_options_value",
  structuralClass: "C7",
  expressionSource: "black_scholes_call(opt_s, opt_x, opt_r, opt_t, opt_sigma)",
  latex: "ROV = S \\cdot N(d_1) - X e^{-rT} N(d_2), \\quad d_1 = \\dfrac{\\ln(S/X) + (r + \\sigma^2/2)T}{\\sigma\\sqrt{T}}, \\quad d_2 = d_1 - \\sigma\\sqrt{T}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const opt_s = num(env, "opt_s");
    const opt_x = num(env, "opt_x");
    const opt_r = num(env, "opt_r");
    const opt_t = num(env, "opt_t");
    const opt_sigma = num(env, "opt_sigma");
    return black_scholes_call(opt_s, opt_x, opt_r, opt_t, opt_sigma);
  },
  inverses: Object.freeze({

  }),
  inverseSources: Object.freeze({

  }),
  guards: buildGuards({
    formulaId: "real_options_value",
    inputs: ["opt_s", "opt_x", "opt_r", "opt_t", "opt_sigma"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  taxonomy: Object.freeze({
    stratum: "XI",
    phase: "B8",
    structuralClass: "C7",
    decisionDomain: "D8",
    computeLayer: "L2",
    curriculumModule: 9,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "opt_s": 640000000,
    "opt_x": 480000000,
    "opt_r": 0.055,
    "opt_t": 2,
    "opt_sigma": 0.45,
  }),
  publishesToGraph: false,
});
