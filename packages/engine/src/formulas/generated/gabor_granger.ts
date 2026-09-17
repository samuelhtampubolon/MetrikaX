// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Gabor_Granger_Demand: Gabor-Granger Demand
 * Permintaan Gabor Granger
 *
 * Stratum VIII, phase B1, structural class C1, decision domain D2.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const gabor_granger: Relation = Object.freeze({
  formulaId: "gabor_granger",
  symbol: "Gabor_Granger_Demand",
  name: { id: "Permintaan Gabor Granger", en: "Gabor-Granger Demand" },
  inputs: Object.freeze(["buyers_at_p", "total_respondents"]),
  output: "gabor_granger",
  structuralClass: "C1",
  resultBounds: Object.freeze({ lower: 0, upper: 1 }),
  expressionSource: "buyers_at_p / total_respondents",
  latex: "D(P) = \\dfrac{BuyersAtP}{TotalRespondents}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const buyers_at_p = num(env, "buyers_at_p");
    const total_respondents = num(env, "total_respondents");
    return buyers_at_p / total_respondents;
  },
  inverses: Object.freeze({
    "buyers_at_p": (env: Env): number => {
    const result = num(env, "gabor_granger");
    const total_respondents = num(env, "total_respondents");
      return result * total_respondents;
    },
    "total_respondents": (env: Env): number => {
    const buyers_at_p = num(env, "buyers_at_p");
    const result = num(env, "gabor_granger");
      return buyers_at_p / result;
    },
  }),
  inverseSources: Object.freeze({
    "buyers_at_p": "result * total_respondents",
    "total_respondents": "buyers_at_p / result",
  }),
  guards: buildGuards({
    formulaId: "gabor_granger",
    inputs: ["buyers_at_p", "total_respondents"],
    denominators: ["gabor_granger", "total_respondents"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "VIII",
    phase: "B1",
    structuralClass: "C1",
    decisionDomain: "D2",
    computeLayer: "L1",
    curriculumModule: 8,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "buyers_at_p": 168,
    "total_respondents": 420,
  }),
  publishesToGraph: false,
});
