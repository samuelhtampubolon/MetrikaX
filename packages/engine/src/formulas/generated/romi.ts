// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * ROMI: Return on Marketing Investment
 * Pengembalian atas Investasi Pemasaran
 *
 * Stratum IV, phase B8, structural class C2, decision domain D8.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const romi: Relation = Object.freeze({
  formulaId: "romi",
  symbol: "ROMI",
  name: { id: "Pengembalian atas Investasi Pemasaran", en: "Return on Marketing Investment" },
  inputs: Object.freeze(["incremental_revenue", "marketing_cost"]),
  output: "romi",
  structuralClass: "C2",
  resultBounds: null,
  expressionSource: "(incremental_revenue - marketing_cost) / marketing_cost",
  latex: "ROMI = \\dfrac{IncrementalRevenue - MarketingCost}{MarketingCost}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const incremental_revenue = num(env, "incremental_revenue");
    const marketing_cost = num(env, "marketing_cost");
    return (incremental_revenue - marketing_cost) / marketing_cost;
  },
  inverses: Object.freeze({
    "incremental_revenue": (env: Env): number => {
    const marketing_cost = num(env, "marketing_cost");
    const result = num(env, "romi");
      return marketing_cost * (1 + result);
    },
    "marketing_cost": (env: Env): number => {
    const incremental_revenue = num(env, "incremental_revenue");
    const result = num(env, "romi");
      return incremental_revenue / (1 + result);
    },
  }),
  inverseSources: Object.freeze({
    "incremental_revenue": "marketing_cost * (1 + result)",
    "marketing_cost": "incremental_revenue / (1 + result)",
  }),
  guards: buildGuards({
    formulaId: "romi",
    inputs: ["incremental_revenue", "marketing_cost"],
    denominators: ["marketing_cost"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: -1, upper: 0, label: "Negatif", guidance: "Kampanye tidak menutup biayanya sendiri." },
    { lower: 0, upper: 0.5, label: "Marjinal", guidance: "Efek nyata namun tipis." },
    { lower: 0.5, upper: 2, label: "Baik", guidance: "Kampanye memberi pengembalian jelas." },
    { lower: 2, upper: 1000, label: "Sangat baik", guidance: "Periksa keabsahan estimasi inkremental." },
  ]),
  pitfallCount: 3,
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
    "incremental_revenue": 68000000,
    "marketing_cost": 42000000,
  }),
  publishesToGraph: false,
});
