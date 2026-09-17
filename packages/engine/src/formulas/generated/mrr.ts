// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * MRR: Monthly Recurring Revenue
 * Pendapatan Berulang Bulanan
 *
 * Stratum III, phase B5, structural class C4, decision domain D8.
 * Engine rule: auto-run one-at-a-time sensitivity at plus and minus 10 percent for every factor
 */
export const mrr: Relation = Object.freeze({
  formulaId: "mrr",
  symbol: "MRR",
  name: { id: "Pendapatan Berulang Bulanan", en: "Monthly Recurring Revenue" },
  inputs: Object.freeze(["arpu", "subscribers"]),
  output: "mrr",
  structuralClass: "C4",
  expressionSource: "arpu * subscribers",
  latex: "MRR = ARPU \\times Subscribers",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const arpu = num(env, "arpu");
    const subscribers = num(env, "subscribers");
    return arpu * subscribers;
  },
  inverses: Object.freeze({
    "arpu": (env: Env): number => {
    const mrr = num(env, "mrr");
    const subscribers = num(env, "subscribers");
      return mrr / subscribers;
    },
    "subscribers": (env: Env): number => {
    const mrr = num(env, "mrr");
    const arpu = num(env, "arpu");
      return mrr / arpu;
    },
  }),
  inverseSources: Object.freeze({
    "arpu": "mrr / subscribers",
    "subscribers": "mrr / arpu",
  }),
  guards: buildGuards({
    formulaId: "mrr",
    inputs: ["arpu", "subscribers"],
    denominators: ["arpu", "subscribers"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  taxonomy: Object.freeze({
    stratum: "III",
    phase: "B5",
    structuralClass: "C4",
    decisionDomain: "D8",
    computeLayer: "L2",
    curriculumModule: 4,
    dashboardTier: "operational",
  }),
  workedExample: Object.freeze({
    "arpu": 185000,
    "subscribers": 940,
  }),
  publishesToGraph: true,
});
