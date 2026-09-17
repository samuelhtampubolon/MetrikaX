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
 * Weighted_Screening_Score: Weighted Screening Score
 * Skor Penyaringan Berbobot
 *
 * Stratum X, phase B8, structural class C5, decision domain D1.
 * Engine rule: require weight_provenance field; run rank-stability perturbation test
 */
export const weighted_screening: Relation = Object.freeze({
  formulaId: "weighted_screening",
  symbol: "Weighted_Screening_Score",
  name: { id: "Skor Penyaringan Berbobot", en: "Weighted Screening Score" },
  inputs: Object.freeze(["w_vector", "r_vector"]),
  output: "weighted_screening",
  structuralClass: "C5",
  resultBounds: null,
  expressionSource: "dot(w_vector, r_vector)",
  latex: "S_j = \\sum_{i=1}^{n} w_i r_{ij}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const w_vector = vec(env, "w_vector");
    const r_vector = vec(env, "r_vector");
    return dot(w_vector, r_vector);
  },
  inverses: Object.freeze({

  }),
  inverseSources: Object.freeze({

  }),
  guards: buildGuards({
    formulaId: "weighted_screening",
    inputs: ["w_vector", "r_vector"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "X",
    phase: "B8",
    structuralClass: "C5",
    decisionDomain: "D1",
    computeLayer: "L1",
    curriculumModule: 8,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "w_vector": [0.35,0.25,0.25,0.15],
    "r_vector": [8,6,9,4],
  }),
  publishesToGraph: false,
});
