// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Engagement_Rate: Engagement Rate
 * Tingkat Interaksi
 *
 * Stratum I, phase B3, structural class C1, decision domain D3.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const engagement_rate: Relation = Object.freeze({
  formulaId: "engagement_rate",
  symbol: "Engagement_Rate",
  name: { id: "Tingkat Interaksi", en: "Engagement Rate" },
  inputs: Object.freeze(["engagements", "followers"]),
  output: "engagement_rate",
  structuralClass: "C1",
  resultBounds: Object.freeze({ lower: 0, upper: 1 }),
  expressionSource: "engagements / followers",
  latex: "ER = \\dfrac{Engagements}{Followers}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const engagements = num(env, "engagements");
    const followers = num(env, "followers");
    return engagements / followers;
  },
  inverses: Object.freeze({
    "engagements": (env: Env): number => {
    const result = num(env, "engagement_rate");
    const followers = num(env, "followers");
      return result * followers;
    },
    "followers": (env: Env): number => {
    const engagements = num(env, "engagements");
    const result = num(env, "engagement_rate");
      return engagements / result;
    },
  }),
  inverseSources: Object.freeze({
    "engagements": "result * followers",
    "followers": "engagements / result",
  }),
  guards: buildGuards({
    formulaId: "engagement_rate",
    inputs: ["engagements", "followers"],
    denominators: ["engagement_rate", "followers"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.01, label: "Rendah", guidance: "Konten tidak menjangkau bahkan pengikut sendiri." },
    { lower: 0.01, upper: 0.035, label: "Wajar", guidance: "Rentang lazim akun merek." },
    { lower: 0.035, upper: 0.08, label: "Baik", guidance: "Kelekatan audiens kuat." },
    { lower: 0.08, upper: 1, label: "Luar biasa", guidance: "Periksa apakah pengikut terlalu sedikit sehingga penyebut kecil." },
  ]),
  taxonomy: Object.freeze({
    stratum: "I",
    phase: "B3",
    structuralClass: "C1",
    decisionDomain: "D3",
    computeLayer: "L1",
    curriculumModule: 1,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "engagements": 2400,
    "followers": 85000,
  }),
  publishesToGraph: false,
});
