// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * CLV_Simple: Simple Customer Lifetime Value
 * Nilai Seumur Hidup Sederhana
 *
 * Stratum V, phase B6, structural class C6, decision domain D5.
 * Engine rule: discount_rate and horizon are mandatory output annotations, never optional
 */
export const clv_simple: Relation = Object.freeze({
  formulaId: "clv_simple",
  symbol: "CLV_Simple",
  name: { id: "Nilai Seumur Hidup Sederhana", en: "Simple Customer Lifetime Value" },
  inputs: Object.freeze(["arpu", "gross_margin", "churn_rate"]),
  output: "clv_simple",
  structuralClass: "C6",
  resultBounds: null,
  expressionSource: "(arpu * gross_margin) / churn_rate",
  latex: "CLV_{simple} = \\dfrac{ARPU \\times GrossMargin}{ChurnRate}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const arpu = num(env, "arpu");
    const gross_margin = num(env, "gross_margin");
    const churn_rate = num(env, "churn_rate");
    return (arpu * gross_margin) / churn_rate;
  },
  inverses: Object.freeze({
    "arpu": (env: Env): number => {
    const result = num(env, "clv_simple");
    const churn_rate = num(env, "churn_rate");
    const gross_margin = num(env, "gross_margin");
      return result * churn_rate / gross_margin;
    },
    "gross_margin": (env: Env): number => {
    const result = num(env, "clv_simple");
    const churn_rate = num(env, "churn_rate");
    const arpu = num(env, "arpu");
      return result * churn_rate / arpu;
    },
    "churn_rate": (env: Env): number => {
    const arpu = num(env, "arpu");
    const gross_margin = num(env, "gross_margin");
    const result = num(env, "clv_simple");
      return (arpu * gross_margin) / result;
    },
  }),
  inverseSources: Object.freeze({
    "arpu": "result * churn_rate / gross_margin",
    "gross_margin": "result * churn_rate / arpu",
    "churn_rate": "(arpu * gross_margin) / result",
  }),
  guards: buildGuards({
    formulaId: "clv_simple",
    inputs: ["arpu", "gross_margin", "churn_rate"],
    denominators: ["arpu", "churn_rate", "clv_simple", "gross_margin"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "V",
    phase: "B6",
    structuralClass: "C6",
    decisionDomain: "D5",
    computeLayer: "L2",
    curriculumModule: 6,
    dashboardTier: "tactical",
  }),
  workedExample: Object.freeze({
    "arpu": 185000,
    "gross_margin": 0.6,
    "churn_rate": 0.04,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 45,
    xpRepeat: 9,
    masteryThreshold: 3,
    badgeId: "badge_clv_simple",
    unlocksAfterModule: 5,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
