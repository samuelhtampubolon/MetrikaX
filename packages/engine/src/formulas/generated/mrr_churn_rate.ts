// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * MRR_Churn_Rate: MRR Churn Rate
 * Tingkat Churn Pendapatan
 *
 * Stratum III, phase B6, structural class C1, decision domain D5.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const mrr_churn_rate: Relation = Object.freeze({
  formulaId: "mrr_churn_rate",
  symbol: "MRR_Churn_Rate",
  name: { id: "Tingkat Churn Pendapatan", en: "MRR Churn Rate" },
  inputs: Object.freeze(["churned_mrr", "total_mrr"]),
  output: "mrr_churn_rate",
  structuralClass: "C1",
  resultBounds: Object.freeze({ lower: 0, upper: 1 }),
  expressionSource: "churned_mrr / total_mrr",
  latex: "MRRChurn = \\dfrac{ChurnedMRR}{TotalMRR}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const churned_mrr = num(env, "churned_mrr");
    const total_mrr = num(env, "total_mrr");
    return churned_mrr / total_mrr;
  },
  inverses: Object.freeze({
    "churned_mrr": (env: Env): number => {
    const result = num(env, "mrr_churn_rate");
    const total_mrr = num(env, "total_mrr");
      return result * total_mrr;
    },
    "total_mrr": (env: Env): number => {
    const churned_mrr = num(env, "churned_mrr");
    const result = num(env, "mrr_churn_rate");
      return churned_mrr / result;
    },
  }),
  inverseSources: Object.freeze({
    "churned_mrr": "result * total_mrr",
    "total_mrr": "churned_mrr / result",
  }),
  guards: buildGuards({
    formulaId: "mrr_churn_rate",
    inputs: ["churned_mrr", "total_mrr"],
    denominators: ["mrr_churn_rate", "total_mrr"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.01, label: "Sangat baik", guidance: "Kebocoran nilai hampir tidak ada." },
    { lower: 0.01, upper: 0.03, label: "Baik", guidance: "Rentang sehat." },
    { lower: 0.03, upper: 0.07, label: "Waspada", guidance: "Kebocoran nilai mulai membatasi pertumbuhan." },
    { lower: 0.07, upper: 1, label: "Kritis", guidance: "Periksa apakah pelanggan besar yang pergi." },
  ]),
  taxonomy: Object.freeze({
    stratum: "III",
    phase: "B6",
    structuralClass: "C1",
    decisionDomain: "D5",
    computeLayer: "L1",
    curriculumModule: 4,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "churned_mrr": 4200000,
    "total_mrr": 173900000,
  }),
  publishesToGraph: false,
});
