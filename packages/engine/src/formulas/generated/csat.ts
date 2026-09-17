// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * CSAT: Customer Satisfaction Score
 * Skor Kepuasan Pelanggan
 *
 * Stratum II, phase B6, structural class C1, decision domain D5.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const csat: Relation = Object.freeze({
  formulaId: "csat",
  symbol: "CSAT",
  name: { id: "Skor Kepuasan Pelanggan", en: "Customer Satisfaction Score" },
  inputs: Object.freeze(["satisfied_count", "total_responses"]),
  output: "csat",
  structuralClass: "C1",
  resultBounds: Object.freeze({ lower: 0, upper: 100 }),
  expressionSource: "(satisfied_count / total_responses) * 100",
  latex: "CSAT = \\dfrac{SatisfiedCount}{TotalResponses} \\times 100",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const satisfied_count = num(env, "satisfied_count");
    const total_responses = num(env, "total_responses");
    return (satisfied_count / total_responses) * 100;
  },
  inverses: Object.freeze({
    "satisfied_count": (env: Env): number => {
    const result = num(env, "csat");
    const total_responses = num(env, "total_responses");
      return result * total_responses / 100;
    },
    "total_responses": (env: Env): number => {
    const satisfied_count = num(env, "satisfied_count");
    const result = num(env, "csat");
      return satisfied_count * 100 / result;
    },
  }),
  inverseSources: Object.freeze({
    "satisfied_count": "result * total_responses / 100",
    "total_responses": "satisfied_count * 100 / result",
  }),
  guards: buildGuards({
    formulaId: "csat",
    inputs: ["satisfied_count", "total_responses"],
    denominators: ["csat", "total_responses"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 60, label: "Rendah", guidance: "Masalah mendasar pada pengalaman layanan." },
    { lower: 60, upper: 75, label: "Wajar", guidance: "Cukup namun tidak membedakan merek." },
    { lower: 75, upper: 90, label: "Baik", guidance: "Pengalaman layanan menjadi kekuatan." },
    { lower: 90, upper: 100, label: "Sangat baik", guidance: "Periksa bias responden yang hanya menjawab bila puas." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "II",
    phase: "B6",
    structuralClass: "C1",
    decisionDomain: "D5",
    computeLayer: "L1",
    curriculumModule: 5,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "satisfied_count": 342,
    "total_responses": 420,
  }),
  publishesToGraph: false,
});
