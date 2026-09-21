// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Price_Elasticity: Price Elasticity of Demand
 * Elastisitas Harga Permintaan
 *
 * Stratum VII, phase B0, structural class C8, decision domain D2.
 * Engine rule: store observed range; grey out extrapolated region in the chart
 */
export const price_elasticity: Relation = Object.freeze({
  formulaId: "price_elasticity",
  symbol: "Price_Elasticity",
  name: { id: "Elastisitas Harga Permintaan", en: "Price Elasticity of Demand" },
  inputs: Object.freeze(["q1", "q2", "p1", "p2"]),
  output: "price_elasticity",
  structuralClass: "C8",
  resultBounds: null,
  expressionSource: "((q2 - q1) / ((q1 + q2) / 2)) / ((p2 - p1) / ((p1 + p2) / 2))",
  latex: "E_p = \\dfrac{(Q_2 - Q_1) / \\left[(Q_1 + Q_2)/2\\right]}{(P_2 - P_1) / \\left[(P_1 + P_2)/2\\right]}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const q2 = num(env, "q2");
    const q1 = num(env, "q1");
    const p2 = num(env, "p2");
    const p1 = num(env, "p1");
    return ((q2 - q1) / ((q1 + q2) / 2)) / ((p2 - p1) / ((p1 + p2) / 2));
  },
  inverses: Object.freeze({
    "q2": (env: Env): number => {
    const q1 = num(env, "q1");
    const result = num(env, "price_elasticity");
    const p2 = num(env, "p2");
    const p1 = num(env, "p1");
      return q1 * (1 + 0.5 * result * ((p2 - p1) / ((p1 + p2) / 2))) / (1 - 0.5 * result * ((p2 - p1) / ((p1 + p2) / 2)));
    },
  }),
  inverseSources: Object.freeze({
    "q2": "q1 * (1 + 0.5 * result * ((p2 - p1) / ((p1 + p2) / 2))) / (1 - 0.5 * result * ((p2 - p1) / ((p1 + p2) / 2)))",
  }),
  guards: buildGuards({
    formulaId: "price_elasticity",
    inputs: ["q1", "q2", "p1", "p2"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: -1000, upper: -1, label: "Elastis", guidance: "Penurunan harga menaikkan pendapatan total." },
    { lower: -1, upper: 0, label: "Inelastis", guidance: "Kenaikan harga menaikkan pendapatan total." },
    { lower: 0, upper: 1000, label: "Anomali", guidance: "Tanda positif menandakan barang Giffen, barang Veblen, atau kesalahan data." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "VII",
    phase: "B0",
    structuralClass: "C8",
    decisionDomain: "D2",
    computeLayer: "L1",
    curriculumModule: 7,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "q1": 1200,
    "q2": 1450,
    "p1": 125000,
    "p2": 110000,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 55,
    xpRepeat: 11,
    masteryThreshold: 3,
    badgeId: "badge_price_elasticity",
    unlocksAfterModule: 6,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
