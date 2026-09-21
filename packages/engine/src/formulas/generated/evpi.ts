// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * EVPI: Expected Value of Perfect Information
 * Nilai Harapan Informasi Sempurna
 *
 * Stratum XI, phase B8, structural class C7, decision domain D8.
 * Engine rule: render distribution alongside point value; require probability_source field
 */
export const evpi: Relation = Object.freeze({
  formulaId: "evpi",
  symbol: "EVPI",
  name: { id: "Nilai Harapan Informasi Sempurna", en: "Expected Value of Perfect Information" },
  inputs: Object.freeze(["ev_perfect", "ev_base"]),
  output: "evpi",
  structuralClass: "C7",
  resultBounds: null,
  expressionSource: "ev_perfect - ev_base",
  latex: "EVPI = EV_{perfect} - EV_{base}",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const ev_perfect = num(env, "ev_perfect");
    const ev_base = num(env, "ev_base");
    return ev_perfect - ev_base;
  },
  inverses: Object.freeze({
    "ev_perfect": (env: Env): number => {
    const result = num(env, "evpi");
    const ev_base = num(env, "ev_base");
      return result + ev_base;
    },
    "ev_base": (env: Env): number => {
    const ev_perfect = num(env, "ev_perfect");
    const result = num(env, "evpi");
      return ev_perfect - result;
    },
  }),
  inverseSources: Object.freeze({
    "ev_perfect": "result + ev_base",
    "ev_base": "ev_perfect - result",
  }),
  guards: buildGuards({
    formulaId: "evpi",
    inputs: ["ev_perfect", "ev_base"],
    denominators: [],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "XI",
    phase: "B8",
    structuralClass: "C7",
    decisionDomain: "D8",
    computeLayer: "L2",
    curriculumModule: 9,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "ev_perfect": 412000000,
    "ev_base": 289000000,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 110,
    xpRepeat: 22,
    masteryThreshold: 3,
    badgeId: "badge_evpi",
    unlocksAfterModule: 8,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
