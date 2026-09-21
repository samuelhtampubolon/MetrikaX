// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * LTV_CAC_Ratio: LTV to CAC Ratio
 * Rasio LTV terhadap CAC
 *
 * Stratum V, phase B8, structural class C2, decision domain D8.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const ltv_cac_ratio: Relation = Object.freeze({
  formulaId: "ltv_cac_ratio",
  symbol: "LTV_CAC_Ratio",
  name: { id: "Rasio LTV terhadap CAC", en: "LTV to CAC Ratio" },
  inputs: Object.freeze(["clv", "cac"]),
  output: "ltv_cac_ratio",
  structuralClass: "C2",
  resultBounds: null,
  expressionSource: "clv / cac",
  latex: "LTV\\!:\\!CAC = \\dfrac{CLV}{CAC}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const clv = num(env, "clv");
    const cac = num(env, "cac");
    return clv / cac;
  },
  inverses: Object.freeze({
    "clv": (env: Env): number => {
    const result = num(env, "ltv_cac_ratio");
    const cac = num(env, "cac");
      return result * cac;
    },
    "cac": (env: Env): number => {
    const clv = num(env, "clv");
    const result = num(env, "ltv_cac_ratio");
      return clv / result;
    },
  }),
  inverseSources: Object.freeze({
    "clv": "result * cac",
    "cac": "clv / result",
  }),
  guards: buildGuards({
    formulaId: "ltv_cac_ratio",
    inputs: ["clv", "cac"],
    denominators: ["cac", "ltv_cac_ratio"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 1, label: "Merusak nilai", guidance: "Setiap pelanggan baru memperbesar kerugian." },
    { lower: 1, upper: 3, label: "Belum sehat", guidance: "Belum menutup biaya tidak langsung." },
    { lower: 3, upper: 5, label: "Sehat", guidance: "Rentang yang lazim dianggap layak." },
    { lower: 5, upper: 1000, label: "Terlalu hemat", guidance: "Kemungkinan kurang berinvestasi pada pertumbuhan." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "V",
    phase: "B8",
    structuralClass: "C2",
    decisionDomain: "D8",
    computeLayer: "L3",
    curriculumModule: 6,
    dashboardTier: "tactical",
  }),
  workedExample: Object.freeze({
    "clv": 2775000,
    "cac": 371681,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 45,
    xpRepeat: 9,
    masteryThreshold: 3,
    badgeId: "badge_ltv_cac_ratio",
    unlocksAfterModule: 5,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
