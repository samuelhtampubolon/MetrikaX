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
 * Conjoint_Utility: Conjoint Utility
 * Utilitas Konjoin
 *
 * Stratum VIII, phase B1, structural class C5, decision domain D1.
 * Engine rule: require weight_provenance field; run rank-stability perturbation test
 */
export const conjoint_utility: Relation = Object.freeze({
  formulaId: "conjoint_utility",
  symbol: "Conjoint_Utility",
  name: { id: "Utilitas Konjoin", en: "Conjoint Utility" },
  inputs: Object.freeze(["beta_vector", "x_vector"]),
  output: "conjoint_utility",
  structuralClass: "C5",
  resultBounds: null,
  expressionSource: "dot(beta_vector, x_vector)",
  latex: "U = \\sum_{i=1}^{n} \\beta_i x_i",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const beta_vector = vec(env, "beta_vector");
    const x_vector = vec(env, "x_vector");
    return dot(beta_vector, x_vector);
  },
  inverses: Object.freeze({

  }),
  inverseSources: Object.freeze({

  }),
  guards: buildGuards({
    formulaId: "conjoint_utility",
    inputs: ["beta_vector", "x_vector"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "VIII",
    phase: "B1",
    structuralClass: "C5",
    decisionDomain: "D1",
    computeLayer: "L1",
    curriculumModule: 8,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "beta_vector": [0.42,-0.31,0.18,0.55],
    "x_vector": [1,1,0,1],
  }),
  gamification: Object.freeze({
    xpFirstSolve: 70,
    xpRepeat: 14,
    masteryThreshold: 3,
    badgeId: "badge_conjoint_utility",
    unlocksAfterModule: 7,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
