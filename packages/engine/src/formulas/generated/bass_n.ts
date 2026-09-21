// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Env, Relation } from '../../types.ts';
import { num } from '../env.ts';
import { buildGuards } from '../../validate/domain.ts';

/**
 * Bass_n(t): Bass Instantaneous Adoption
 * Laju Adopsi Sesaat Bass
 *
 * Stratum IX, phase B0, structural class C9, decision domain D7.
 * Engine rule: require calibration_source; always render at least three parameter scenarios
 */
export const bass_n: Relation = Object.freeze({
  formulaId: "bass_n",
  symbol: "Bass_n(t)",
  name: { id: "Laju Adopsi Sesaat Bass", en: "Bass Instantaneous Adoption" },
  inputs: Object.freeze(["bass_p", "bass_q", "bass_m", "bass_nt"]),
  output: "bass_n",
  structuralClass: "C9",
  resultBounds: null,
  expressionSource: "(bass_p + (bass_q / bass_m) * bass_nt) * (bass_m - bass_nt)",
  latex: "n(t) = \\left(p + \\dfrac{q}{m} N(t)\\right)\\left(m - N(t)\\right)",
  resultShape: "scalar",
  forward: (env: Env): number => {
    const bass_p = num(env, "bass_p");
    const bass_q = num(env, "bass_q");
    const bass_m = num(env, "bass_m");
    const bass_nt = num(env, "bass_nt");
    return (bass_p + (bass_q / bass_m) * bass_nt) * (bass_m - bass_nt);
  },
  inverses: Object.freeze({
    "bass_p": (env: Env): number => {
    const result = num(env, "bass_n");
    const bass_m = num(env, "bass_m");
    const bass_nt = num(env, "bass_nt");
    const bass_q = num(env, "bass_q");
      return result / (bass_m - bass_nt) - (bass_q / bass_m) * bass_nt;
    },
  }),
  inverseSources: Object.freeze({
    "bass_p": "result / (bass_m - bass_nt) - (bass_q / bass_m) * bass_nt",
  }),
  guards: buildGuards({
    formulaId: "bass_n",
    inputs: ["bass_p", "bass_q", "bass_m", "bass_nt"],
    denominators: ["bass_m"],
    guardZeroDenominator: true,
    rejectNegativeCounts: true,
  }),
  interpretationBands: Object.freeze([

  ]),
  pitfallCount: 3,
  taxonomy: Object.freeze({
    stratum: "IX",
    phase: "B0",
    structuralClass: "C9",
    decisionDomain: "D7",
    computeLayer: "L5",
    curriculumModule: 9,
    dashboardTier: "strategic",
  }),
  workedExample: Object.freeze({
    "bass_p": 0.021,
    "bass_q": 0.38,
    "bass_m": 180000,
    "bass_nt": 42000,
  }),
  gamification: Object.freeze({
    xpFirstSolve: 90,
    xpRepeat: 18,
    masteryThreshold: 3,
    badgeId: "badge_bass_n",
    unlocksAfterModule: 8,
    challengeTypes: Object.freeze(["forward_compute", "inverse_solve", "spot_the_error", "interpret_the_band", "choose_the_metric"]),
  }),
  publishesToGraph: false,
});
