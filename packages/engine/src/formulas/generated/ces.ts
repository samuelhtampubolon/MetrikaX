// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * CES: Customer Effort Score
 * Skor Upaya Pelanggan
 *
 * Stratum II, phase B6, structural class C5, decision domain D5.
 * Engine rule: require weight_provenance field; run rank-stability perturbation test
 */
export const ces: Relation = Object.freeze({
  formulaId: "ces",
  symbol: "CES",
  name: { id: "Skor Upaya Pelanggan", en: "Customer Effort Score" },
  inputs: Object.freeze(["effort_sum", "total_responses"]),
  output: "ces",
  structuralClass: "C5",
  resultBounds: null,
  expressionSource: "effort_sum / total_responses",
  latex: "CES = \\dfrac{\\sum EffortScores}{TotalResponses}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const effort_sum = num(env, "effort_sum");
    const total_responses = num(env, "total_responses");
    return effort_sum / total_responses;
  },
  inverses: Object.freeze({
    "effort_sum": (env: Env): number => {
    const result = num(env, "ces");
    const total_responses = num(env, "total_responses");
      return result * total_responses;
    },
    "total_responses": (env: Env): number => {
    const effort_sum = num(env, "effort_sum");
    const result = num(env, "ces");
      return effort_sum / result;
    },
  }),
  inverseSources: Object.freeze({
    "effort_sum": "result * total_responses",
    "total_responses": "effort_sum / result",
  }),
  guards: buildGuards({
    formulaId: "ces",
    inputs: ["effort_sum", "total_responses"],
    denominators: ["ces", "total_responses"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 1, upper: 3, label: "Upaya rendah", guidance: "Proses terasa mudah. Prediktor loyalitas yang kuat." },
    { lower: 3, upper: 5, label: "Sedang", guidance: "Ada gesekan yang dapat dihilangkan." },
    { lower: 5, upper: 7, label: "Tinggi", guidance: "Upaya tinggi adalah prediktor churn terkuat di antara metrik persepsi." },
  ]),
  taxonomy: Object.freeze({
    stratum: "II",
    phase: "B6",
    structuralClass: "C5",
    decisionDomain: "D5",
    computeLayer: "L1",
    curriculumModule: 5,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "effort_sum": 1218,
    "total_responses": 420,
  }),
  publishesToGraph: false,
});
