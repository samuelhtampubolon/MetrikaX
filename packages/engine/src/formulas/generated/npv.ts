// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num, vec } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';
import { npv_calc } from '../../helpers/index.ts';

/**
 * NPV: Net Present Value
 * Nilai Sekarang Bersih
 *
 * Stratum XI, phase B8, structural class C6, decision domain D8.
 * Engine rule: discount_rate and horizon are mandatory output annotations, never optional
 */
export const npv: Relation = Object.freeze({
  formulaId: "npv",
  symbol: "NPV",
  name: { id: "Nilai Sekarang Bersih", en: "Net Present Value" },
  inputs: Object.freeze(["cash_flows", "discount_rate", "investment_0"]),
  output: "npv_out",
  structuralClass: "C6",
  expressionSource: "npv_calc(cash_flows, discount_rate) - investment_0",
  latex: "NPV = \\sum_{t=1}^{T} \\dfrac{CF_t}{(1 + r)^t} - Investment_0",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const cash_flows = vec(env, "cash_flows");
    const discount_rate = num(env, "discount_rate");
    const investment_0 = num(env, "investment_0");
    return npv_calc(cash_flows, discount_rate) - investment_0;
  },
  inverses: Object.freeze({
    "investment_0": (env: Env): number => {
    const cash_flows = vec(env, "cash_flows");
    const discount_rate = num(env, "discount_rate");
    const npv_out = num(env, "npv_out");
      return npv_calc(cash_flows, discount_rate) - npv_out;
    },
  }),
  inverseSources: Object.freeze({
    "investment_0": "npv_calc(cash_flows, discount_rate) - npv_out",
  }),
  guards: buildGuards({
    formulaId: "npv",
    inputs: ["cash_flows", "discount_rate", "investment_0"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: -1000000000000000, upper: 0, label: "Tolak", guidance: "Proyek menghancurkan nilai pada tingkat diskonto yang dipakai." },
    { lower: 0, upper: 1000000000000000, label: "Terima", guidance: "Proyek menambah nilai pada tingkat diskonto yang dipakai." },
  ]),
  taxonomy: Object.freeze({
    stratum: "XI",
    phase: "B8",
    structuralClass: "C6",
    decisionDomain: "D8",
    computeLayer: "L1",
    curriculumModule: 9,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "cash_flows": [120000000,180000000,240000000,260000000,280000000],
    "discount_rate": 0.12,
    "investment_0": 480000000,
  }),
  publishesToGraph: true,
});
