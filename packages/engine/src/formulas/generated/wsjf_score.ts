// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * WSJF_Score: Weighted Shortest Job First
 * Skor Pekerjaan Terpendek Berbobot
 *
 * Stratum X, phase B8, structural class C4, decision domain D1.
 * Engine rule: auto-run one-at-a-time sensitivity at plus and minus 10 percent for every factor
 */
export const wsjf_score: Relation = Object.freeze({
  formulaId: "wsjf_score",
  symbol: "WSJF_Score",
  name: { id: "Skor Pekerjaan Terpendek Berbobot", en: "Weighted Shortest Job First" },
  inputs: Object.freeze(["user_value", "time_value", "risk_reduction", "job_size"]),
  output: "wsjf_score",
  structuralClass: "C4",
  resultBounds: null,
  expressionSource: "(user_value + time_value + risk_reduction) / job_size",
  latex: "WSJF = \\dfrac{UserValue + TimeCriticality + RiskReduction}{JobSize}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const user_value = num(env, "user_value");
    const time_value = num(env, "time_value");
    const risk_reduction = num(env, "risk_reduction");
    const job_size = num(env, "job_size");
    return (user_value + time_value + risk_reduction) / job_size;
  },
  inverses: Object.freeze({
    "job_size": (env: Env): number => {
    const user_value = num(env, "user_value");
    const time_value = num(env, "time_value");
    const risk_reduction = num(env, "risk_reduction");
    const result = num(env, "wsjf_score");
      return (user_value + time_value + risk_reduction) / result;
    },
    "user_value": (env: Env): number => {
    const result = num(env, "wsjf_score");
    const job_size = num(env, "job_size");
    const time_value = num(env, "time_value");
    const risk_reduction = num(env, "risk_reduction");
      return result * job_size - time_value - risk_reduction;
    },
  }),
  inverseSources: Object.freeze({
    "job_size": "(user_value + time_value + risk_reduction) / result",
    "user_value": "result * job_size - time_value - risk_reduction",
  }),
  guards: buildGuards({
    formulaId: "wsjf_score",
    inputs: ["user_value", "time_value", "risk_reduction", "job_size"],
    denominators: ["job_size", "wsjf_score"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  taxonomy: Object.freeze({
    stratum: "X",
    phase: "B8",
    structuralClass: "C4",
    decisionDomain: "D1",
    computeLayer: "L1",
    curriculumModule: 9,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "user_value": 8,
    "time_value": 5,
    "risk_reduction": 3,
    "job_size": 5,
  }),
  publishesToGraph: false,
});
