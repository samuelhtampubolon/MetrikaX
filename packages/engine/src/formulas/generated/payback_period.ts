// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Payback_Period: CAC Payback Period
 * Periode Pengembalian CAC
 *
 * Stratum IV, phase B6, structural class C2, decision domain D8.
 * Engine rule: require cost_scope metadata; refuse cross-entity comparison when scopes differ
 */
export const payback_period: Relation = Object.freeze({
  formulaId: "payback_period",
  symbol: "Payback_Period",
  name: { id: "Periode Pengembalian CAC", en: "CAC Payback Period" },
  inputs: Object.freeze(["cac", "arpu", "gross_margin"]),
  output: "payback_period",
  structuralClass: "C2",
  resultBounds: null,
  expressionSource: "cac / (arpu * gross_margin)",
  latex: "Payback = \\dfrac{CAC}{ARPU \\times GrossMargin}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const cac = num(env, "cac");
    const arpu = num(env, "arpu");
    const gross_margin = num(env, "gross_margin");
    return cac / (arpu * gross_margin);
  },
  inverses: Object.freeze({
    "cac": (env: Env): number => {
    const result = num(env, "payback_period");
    const arpu = num(env, "arpu");
    const gross_margin = num(env, "gross_margin");
      return result * arpu * gross_margin;
    },
    "arpu": (env: Env): number => {
    const cac = num(env, "cac");
    const result = num(env, "payback_period");
    const gross_margin = num(env, "gross_margin");
      return cac / (result * gross_margin);
    },
    "gross_margin": (env: Env): number => {
    const cac = num(env, "cac");
    const result = num(env, "payback_period");
    const arpu = num(env, "arpu");
      return cac / (result * arpu);
    },
  }),
  inverseSources: Object.freeze({
    "cac": "result * arpu * gross_margin",
    "arpu": "cac / (result * gross_margin)",
    "gross_margin": "cac / (result * arpu)",
  }),
  guards: buildGuards({
    formulaId: "payback_period",
    inputs: ["cac", "arpu", "gross_margin"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 6, label: "Sangat baik", guidance: "Modal kembali sebelum dua kuartal." },
    { lower: 6, upper: 12, label: "Baik", guidance: "Rentang sehat bagi langganan." },
    { lower: 12, upper: 18, label: "Waspada", guidance: "Kebutuhan modal kerja membesar." },
    { lower: 18, upper: 1000, label: "Kritis", guidance: "Pertumbuhan akan terhambat oleh kas, bukan oleh permintaan." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "IV",
    phase: "B6",
    structuralClass: "C2",
    decisionDomain: "D8",
    computeLayer: "L2",
    curriculumModule: 6,
    dashboardTier: "tactical",
  }),
  workedExample: Object.freeze({
    "cac": 371681,
    "arpu": 185000,
    "gross_margin": 0.6,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 30,
    xpRepeat: 6,
    masteryThreshold: 3,
    badgeId: "badge_payback_period",
    unlocksAfterModule: 5,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
