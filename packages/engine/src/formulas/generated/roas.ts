// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * ROAS: Return on Ad Spend
 * Pengembalian atas Belanja Iklan
 *
 * Stratum IV, phase B8, structural class C2, decision domain D8.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const roas: Relation = Object.freeze({
  formulaId: "roas",
  symbol: "ROAS",
  name: { id: "Pengembalian atas Belanja Iklan", en: "Return on Ad Spend" },
  inputs: Object.freeze(["ad_revenue", "ad_cost"]),
  output: "roas",
  structuralClass: "C2",
  expressionSource: "ad_revenue / ad_cost",
  latex: "ROAS = \\dfrac{AdRevenue}{AdCost}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const ad_revenue = num(env, "ad_revenue");
    const ad_cost = num(env, "ad_cost");
    return ad_revenue / ad_cost;
  },
  inverses: Object.freeze({
    "ad_revenue": (env: Env): number => {
    const result = num(env, "roas");
    const ad_cost = num(env, "ad_cost");
      return result * ad_cost;
    },
    "ad_cost": (env: Env): number => {
    const ad_revenue = num(env, "ad_revenue");
    const result = num(env, "roas");
      return ad_revenue / result;
    },
  }),
  inverseSources: Object.freeze({
    "ad_revenue": "result * ad_cost",
    "ad_cost": "ad_revenue / result",
  }),
  guards: buildGuards({
    formulaId: "roas",
    inputs: ["ad_revenue", "ad_cost"],
    denominators: ["ad_cost", "roas"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 1, label: "Rugi", guidance: "Pendapatan teratribusi lebih kecil daripada belanja." },
    { lower: 1, upper: 2, label: "Impas kotor", guidance: "Belum menutup harga pokok." },
    { lower: 2, upper: 4, label: "Sehat", guidance: "Rentang lazim ritel daring." },
    { lower: 4, upper: 1000, label: "Sangat baik", guidance: "Periksa apakah model atribusi terlalu murah hati." },
  ]),
  taxonomy: Object.freeze({
    stratum: "IV",
    phase: "B8",
    structuralClass: "C2",
    decisionDomain: "D8",
    computeLayer: "L2",
    curriculumModule: 6,
    dashboardTier: "tactical",
  }),
  workedExample: Object.freeze({
    "ad_revenue": 96000000,
    "ad_cost": 24000000,
  }),
  publishesToGraph: false,
});
