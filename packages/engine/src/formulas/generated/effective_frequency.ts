// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Effective_Frequency: Effective Frequency Share
 * Frekuensi Efektif
 *
 * Stratum VI, phase B2, structural class C1, decision domain D3.
 * Engine rule: assert 0 <= result <= 1 else raise DomainViolation
 */
export const effective_frequency: Relation = Object.freeze({
  formulaId: "effective_frequency",
  symbol: "Effective_Frequency",
  name: { id: "Frekuensi Efektif", en: "Effective Frequency Share" },
  inputs: Object.freeze(["reach_at_threshold", "total_reach"]),
  output: "effective_frequency",
  structuralClass: "C1",
  resultBounds: Object.freeze({ lower: 0, upper: 1 }),
  expressionSource: "reach_at_threshold / total_reach",
  latex: "EF = \\dfrac{ReachAtThreshold}{TotalReach}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const reach_at_threshold = num(env, "reach_at_threshold");
    const total_reach = num(env, "total_reach");
    return reach_at_threshold / total_reach;
  },
  inverses: Object.freeze({
    "reach_at_threshold": (env: Env): number => {
    const result = num(env, "effective_frequency");
    const total_reach = num(env, "total_reach");
      return result * total_reach;
    },
    "total_reach": (env: Env): number => {
    const reach_at_threshold = num(env, "reach_at_threshold");
    const result = num(env, "effective_frequency");
      return reach_at_threshold / result;
    },
  }),
  inverseSources: Object.freeze({
    "reach_at_threshold": "result * total_reach",
    "total_reach": "reach_at_threshold / result",
  }),
  guards: buildGuards({
    formulaId: "effective_frequency",
    inputs: ["reach_at_threshold", "total_reach"],
    denominators: ["effective_frequency", "total_reach"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([
    { lower: 0, upper: 0.3, label: "Rendah", guidance: "Sebagian besar audiens terpapar terlalu jarang untuk mengingat." },
    { lower: 0.3, upper: 0.55, label: "Wajar", guidance: "Sebagian audiens mencapai ambang." },
    { lower: 0.55, upper: 0.8, label: "Baik", guidance: "Mayoritas audiens terpapar cukup." },
    { lower: 0.8, upper: 1, label: "Sangat baik", guidance: "Periksa apakah anggaran berlebih pada audiens sempit." },
  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "VI",
    phase: "B2",
    structuralClass: "C1",
    decisionDomain: "D3",
    computeLayer: "L1",
    curriculumModule: 7,
    dashboardTier: "tactical",
  }),
  workedExample: Object.freeze({
    "reach_at_threshold": 782000,
    "total_reach": 1320000,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 40,
    xpRepeat: 8,
    masteryThreshold: 3,
    badgeId: "badge_effective_frequency",
    unlocksAfterModule: 6,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
