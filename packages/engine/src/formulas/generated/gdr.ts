// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * GDR: Gross Dollar Retention
 * Retensi Pendapatan Kotor
 *
 * Stratum V, phase B6, structural class C3, decision domain D5.
 * Engine rule: null is not zero; distinguish None from 0.0 in the store and in the renderer
 */
export const gdr: Relation = Object.freeze({
  formulaId: "gdr",
  symbol: "GDR",
  name: { id: "Retensi Pendapatan Kotor", en: "Gross Dollar Retention" },
  inputs: Object.freeze(["start_mrr", "contraction_mrr", "churned_mrr"]),
  output: "gdr",
  structuralClass: "C3",
  resultBounds: null,
  expressionSource: "(start_mrr - contraction_mrr - churned_mrr) / start_mrr",
  latex: "GDR = \\dfrac{StartMRR - Contraction - Churn}{StartMRR}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const start_mrr = num(env, "start_mrr");
    const contraction_mrr = num(env, "contraction_mrr");
    const churned_mrr = num(env, "churned_mrr");
    return (start_mrr - contraction_mrr - churned_mrr) / start_mrr;
  },
  inverses: Object.freeze({
    "contraction_mrr": (env: Env): number => {
    const start_mrr = num(env, "start_mrr");
    const result = num(env, "gdr");
    const churned_mrr = num(env, "churned_mrr");
      return start_mrr * (1 - result) - churned_mrr;
    },
    "churned_mrr": (env: Env): number => {
    const start_mrr = num(env, "start_mrr");
    const result = num(env, "gdr");
    const contraction_mrr = num(env, "contraction_mrr");
      return start_mrr * (1 - result) - contraction_mrr;
    },
    "start_mrr": (env: Env): number => {
    const contraction_mrr = num(env, "contraction_mrr");
    const churned_mrr = num(env, "churned_mrr");
    const result = num(env, "gdr");
      return (contraction_mrr + churned_mrr) / (1 - result);
    },
  }),
  inverseSources: Object.freeze({
    "contraction_mrr": "start_mrr * (1 - result) - churned_mrr",
    "churned_mrr": "start_mrr * (1 - result) - contraction_mrr",
    "start_mrr": "(contraction_mrr + churned_mrr) / (1 - result)",
  }),
  guards: buildGuards({
    formulaId: "gdr",
    inputs: ["start_mrr", "contraction_mrr", "churned_mrr"],
    denominators: ["start_mrr"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.8, label: "Lemah", guidance: "Kebocoran nilai besar." },
    { lower: 0.8, upper: 0.9, label: "Wajar", guidance: "Rentang lazim segmen usaha kecil." },
    { lower: 0.9, upper: 0.97, label: "Baik", guidance: "Rentang lazim segmen korporat." },
    { lower: 0.97, upper: 1, label: "Sangat baik", guidance: "Nyaris tidak ada kebocoran." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "V",
    phase: "B6",
    structuralClass: "C3",
    decisionDomain: "D5",
    computeLayer: "L1",
    curriculumModule: 4,
    dashboardTier: "tactical",
  }),
  workedExample: Object.freeze({
    "start_mrr": 173900000,
    "contraction_mrr": 2600000,
    "churned_mrr": 4200000,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 45,
    xpRepeat: 9,
    masteryThreshold: 3,
    badgeId: "badge_gdr",
    unlocksAfterModule: 3,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
