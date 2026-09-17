// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * NPS: Net Promoter Score
 * Skor Promotor Bersih
 *
 * Stratum II, phase B7, structural class C3, decision domain D5.
 * Engine rule: null is not zero; distinguish None from 0.0 in the store and in the renderer
 */
export const nps: Relation = Object.freeze({
  formulaId: "nps",
  symbol: "NPS",
  name: { id: "Skor Promotor Bersih", en: "Net Promoter Score" },
  inputs: Object.freeze(["promoters", "detractors", "total_respondents"]),
  output: "nps",
  structuralClass: "C3",
  resultBounds: null,
  expressionSource: "((promoters - detractors) / total_respondents) * 100",
  latex: "NPS = \\left(\\dfrac{Promoters - Detractors}{TotalRespondents}\\right) \\times 100",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const promoters = num(env, "promoters");
    const detractors = num(env, "detractors");
    const total_respondents = num(env, "total_respondents");
    return ((promoters - detractors) / total_respondents) * 100;
  },
  inverses: Object.freeze({
    "promoters": (env: Env): number => {
    const result = num(env, "nps");
    const total_respondents = num(env, "total_respondents");
    const detractors = num(env, "detractors");
      return result * total_respondents / 100 + detractors;
    },
    "detractors": (env: Env): number => {
    const promoters = num(env, "promoters");
    const result = num(env, "nps");
    const total_respondents = num(env, "total_respondents");
      return promoters - result * total_respondents / 100;
    },
    "total_respondents": (env: Env): number => {
    const promoters = num(env, "promoters");
    const detractors = num(env, "detractors");
    const result = num(env, "nps");
      return (promoters - detractors) * 100 / result;
    },
  }),
  inverseSources: Object.freeze({
    "promoters": "result * total_respondents / 100 + detractors",
    "detractors": "promoters - result * total_respondents / 100",
    "total_respondents": "(promoters - detractors) * 100 / result",
  }),
  guards: buildGuards({
    formulaId: "nps",
    inputs: ["promoters", "detractors", "total_respondents"],
    denominators: ["nps", "total_respondents"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: -100, upper: 0, label: "Negatif", guidance: "Detraktor lebih banyak daripada promotor." },
    { lower: 0, upper: 30, label: "Wajar", guidance: "Rentang lazim banyak kategori." },
    { lower: 30, upper: 60, label: "Baik", guidance: "Basis advokasi mulai terbentuk." },
    { lower: 60, upper: 100, label: "Sangat baik", guidance: "Pertumbuhan dari rujukan seharusnya terlihat pada K faktor." },
  ]),
  taxonomy: Object.freeze({
    stratum: "II",
    phase: "B7",
    structuralClass: "C3",
    decisionDomain: "D5",
    computeLayer: "L1",
    curriculumModule: 5,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "promoters": 186,
    "detractors": 74,
    "total_respondents": 420,
  }),
  publishesToGraph: false,
});
