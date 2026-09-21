// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation, FormulaResult } from '../../types.ts';
import { mat, vec } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';
import { matvec, transpose } from '../../helpers/index.ts';

/**
 * QFD_Technical_Importance: QFD Technical Importance
 * Kepentingan Teknis QFD
 *
 * Stratum VIII, phase B1, structural class C5, decision domain D1.
 * Engine rule: require weight_provenance field; run rank-stability perturbation test
 */
export const qfd_technical_importance: Relation = Object.freeze({
  formulaId: "qfd_technical_importance",
  symbol: "QFD_Technical_Importance",
  name: { id: "Kepentingan Teknis QFD", en: "QFD Technical Importance" },
  inputs: Object.freeze(["customer_importance", "relationship_matrix"]),
  output: null,
  structuralClass: "C5",
  resultBounds: null,
  expressionSource: "matvec(transpose(relationship_matrix), customer_importance)",
  latex: "TI_j = \\sum_{i=1}^{m} CustomerImportance_i \\times Relationship_{ij}",
  resultShape: "composite",
  forward: (env: Env): FormulaResult => {
    const relationship_matrix = mat(env, "relationship_matrix");
    const customer_importance = vec(env, "customer_importance");
    return matvec(transpose(relationship_matrix), customer_importance);
  },
  inverses: Object.freeze({

  }),
  inverseSources: Object.freeze({

  }),
  guards: buildGuards({
    formulaId: "qfd_technical_importance",
    inputs: ["customer_importance", "relationship_matrix"],
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
    "customer_importance": [9,7,5,8],
    "relationship_matrix": [[9,3,0],[3,9,1],[0,3,9],[9,0,3]],
  }),
  gamification: Object.freeze({
    xpFirstSolve: 70,
    xpRepeat: 14,
    masteryThreshold: 3,
    badgeId: "badge_qfd_technical_importance",
    unlocksAfterModule: 7,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
