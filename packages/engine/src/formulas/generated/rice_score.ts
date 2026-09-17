// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * RICE_Score: RICE Score
 * Skor RICE
 *
 * Stratum X, phase B8, structural class C4, decision domain D1.
 * Engine rule: auto-run one-at-a-time sensitivity at plus and minus 10 percent for every factor
 */
export const rice_score: Relation = Object.freeze({
  formulaId: "rice_score",
  symbol: "RICE_Score",
  name: { id: "Skor RICE", en: "RICE Score" },
  inputs: Object.freeze(["rice_reach", "rice_impact", "rice_confidence", "rice_effort"]),
  output: "rice_score",
  structuralClass: "C4",
  resultBounds: null,
  expressionSource: "(rice_reach * rice_impact * (rice_confidence / 100)) / rice_effort",
  latex: "RICE = \\dfrac{Reach \\times Impact \\times Confidence}{Effort}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const rice_reach = num(env, "rice_reach");
    const rice_impact = num(env, "rice_impact");
    const rice_confidence = num(env, "rice_confidence");
    const rice_effort = num(env, "rice_effort");
    return (rice_reach * rice_impact * (rice_confidence / 100)) / rice_effort;
  },
  inverses: Object.freeze({
    "rice_effort": (env: Env): number => {
    const rice_reach = num(env, "rice_reach");
    const rice_impact = num(env, "rice_impact");
    const rice_confidence = num(env, "rice_confidence");
    const result = num(env, "rice_score");
      return (rice_reach * rice_impact * (rice_confidence / 100)) / result;
    },
    "rice_reach": (env: Env): number => {
    const result = num(env, "rice_score");
    const rice_effort = num(env, "rice_effort");
    const rice_impact = num(env, "rice_impact");
    const rice_confidence = num(env, "rice_confidence");
      return result * rice_effort / (rice_impact * (rice_confidence / 100));
    },
  }),
  inverseSources: Object.freeze({
    "rice_effort": "(rice_reach * rice_impact * (rice_confidence / 100)) / result",
    "rice_reach": "result * rice_effort / (rice_impact * (rice_confidence / 100))",
  }),
  guards: buildGuards({
    formulaId: "rice_score",
    inputs: ["rice_reach", "rice_impact", "rice_confidence", "rice_effort"],
    denominators: ["rice_effort", "rice_score"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  pitfallCount: 3,
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
    "rice_reach": 4200,
    "rice_impact": 2,
    "rice_confidence": 80,
    "rice_effort": 3,
  }),
  publishesToGraph: false,
});
