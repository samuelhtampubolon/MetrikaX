// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { vec } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';
import { dot } from '../../helpers/index.ts';

/**
 * EV: Expected Value
 * Nilai Harapan
 *
 * Stratum XI, phase B8, structural class C7, decision domain D8.
 * Engine rule: render distribution alongside point value; require probability_source field
 */
export const ev: Relation = Object.freeze({
  formulaId: "ev",
  symbol: "EV",
  name: { id: "Nilai Harapan", en: "Expected Value" },
  inputs: Object.freeze(["prob_vector", "payoff_vector"]),
  output: "ev_out",
  structuralClass: "C7",
  resultBounds: null,
  expressionSource: "dot(prob_vector, payoff_vector)",
  latex: "EV = \\sum_{i=1}^{n} p_i \\times Payoff_i",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const prob_vector = vec(env, "prob_vector");
    const payoff_vector = vec(env, "payoff_vector");
    return dot(prob_vector, payoff_vector);
  },
  inverses: Object.freeze({

  }),
  inverseSources: Object.freeze({

  }),
  guards: buildGuards({
    formulaId: "ev",
    inputs: ["prob_vector", "payoff_vector"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  taxonomy: Object.freeze({
    stratum: "XI",
    phase: "B8",
    structuralClass: "C7",
    decisionDomain: "D8",
    computeLayer: "L1",
    curriculumModule: 9,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "prob_vector": [0.25,0.45,0.3],
    "payoff_vector": [820000000,240000000,-180000000],
  }),
  publishesToGraph: true,
});
